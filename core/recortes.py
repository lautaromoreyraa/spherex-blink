"""Descarga de recortes de las imágenes L2 con reintentos, caché y estado parcial (RF-02).

El servicio de recortes de IRSA corta en el servidor cada imagen L2 con
`?center=<ra>,<dec>d&size=<grados>d` y devuelve un MEF con la misma
estructura que el archivo completo. La forma de la URL y la descarga en
paralelo con un tope de 7 a 12 pedidos siguen el tutorial «spherex_cutouts»
de IRSA (Caltech-IPAC/irsa-tutorials, Copyright (c) 2022-2026 California
Institute of Technology, licencia BSD-3-Clause). La lectura de la longitud de
onda central sigue el tutorial «spherex_intro» y `backend/spherex/query.py`
de mateibut/SPHEREx (Copyright (c) 2026 mateibut, licencia MIT).
"""

import io
import time
import warnings
from collections.abc import Callable, Sequence
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import httpx2
import numpy as np
import numpy.typing as npt
from astropy.io import fits
from astropy.utils.exceptions import AstropyWarning
from astropy.wcs import WCS

from contrato.comunes import Coordenadas
from core.cache import CacheEnDisco
from core.configuracion import MAXIMO_DE_PEDIDOS_SIMULTANEOS, Configuracion
from core.epocas import Observacion
from core.red import ServicioExternoError, pedir

SERVICIO = "IRSA recortes"
MAXIMA_FRACCION_NAN = 0.5
EXTENSIONES_GUARDADAS = ("IMAGE", "FLAGS", "VARIANCE", "WCS-WAVE")
"""Lo que se guarda en la caché. La PSF (121 PSF de 101×101) pesa el 95 %
del recorte y el pipeline no la usa."""


FACTOR_DE_ROTACION = 1.5
"""El recorte sale en la orientación nativa de la exposición, girado respecto
del norte. Para que la rejilla norte arriba no quede con las esquinas vacías,
se pide un recorte más grande que el campo: √2 alcanza para cualquier giro y
el resto es margen para la interpolación."""


def lado_del_recorte(tamano_del_campo_grados: float) -> float:
    return round(tamano_del_campo_grados * FACTOR_DE_ROTACION, 6)


@dataclass(frozen=True)
class Recorte:
    observacion: Observacion
    imagen: npt.NDArray[np.float32]
    """MJy/sr, sin restar el zodiacal."""
    flags: npt.NDArray[np.int32]
    varianza: npt.NDArray[np.float32]
    wcs: WCS
    """WCS celeste del recorte (TAN-SIP, orientación nativa)."""
    longitud_onda_um: float
    """Longitud de onda central en el centro del recorte."""


@dataclass(frozen=True)
class FallaDeRecorte:
    observacion: Observacion
    motivo: str


def url_de_recorte(uri: str, centro: Coordenadas, tamano_grados: float) -> str:
    return f"{uri}?center={centro.ra:.7f},{centro.dec:.7f}d&size={tamano_grados:.6f}d"


def recortar_extensiones(contenido: bytes) -> bytes:
    """El MEF sin las extensiones que el pipeline no usa, para la caché."""
    with fits.open(io.BytesIO(contenido)) as hdul:
        nuevas = fits.HDUList([fits.PrimaryHDU(header=hdul[0].header)])
        for nombre in EXTENSIONES_GUARDADAS:
            if nombre in hdul:
                nuevas.append(hdul[nombre].copy())
        salida = io.BytesIO()
        nuevas.writeto(salida)
    return salida.getvalue()


def longitud_de_onda_central(hdul: fits.HDUList) -> float:
    """λ (µm) en el centro del recorte, de la tabla WCS-WAVE.

    Receta de IRSA: WCS con la clave alternativa «W» y sin SIP (los
    coeficientes SIP corresponden a la WCS celeste, no a la espectral). Se
    sacan de una copia de la cabecera en vez de anularlos después, para que
    astropy no avise de una distorsión inconsistente.
    """
    cabecera = hdul["IMAGE"].header.copy()
    for clave in list(cabecera):
        if clave.split("_")[0] in ("A", "B", "AP", "BP"):
            del cabecera[clave]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", AstropyWarning)
        wcs = WCS(header=cabecera, fobj=hdul, key="W")
        alto, ancho = hdul["IMAGE"].data.shape
        longitud, _ancho_de_banda = wcs.pixel_to_world_values((ancho - 1) / 2, (alto - 1) / 2)
    return float(longitud)


def leer_recorte(observacion: Observacion, contenido: bytes) -> Recorte:
    with fits.open(io.BytesIO(contenido)) as hdul:
        imagen = np.asarray(hdul["IMAGE"].data, dtype=np.float32)
        flags = np.asarray(hdul["FLAGS"].data, dtype=np.int32)
        varianza = np.asarray(hdul["VARIANCE"].data, dtype=np.float32)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", AstropyWarning)
            wcs = WCS(hdul["IMAGE"].header).celestial
        longitud = longitud_de_onda_central(hdul)
    return Recorte(observacion, imagen, flags, varianza, wcs, longitud)


def _bajar_uno(
    observacion: Observacion,
    centro: Coordenadas,
    tamano_grados: float,
    cliente: httpx2.Client,
    cache: CacheEnDisco,
    configuracion: Configuracion,
    dormir: Callable[[float], None],
) -> Recorte | FallaDeRecorte:
    url = url_de_recorte(observacion.uri, centro, tamano_grados)
    contenido = cache.leer_bytes("recortes", url, ".fits")
    if contenido is None:
        try:
            respuesta = pedir(
                cliente,
                SERVICIO,
                url,
                reintentos=configuracion.reintentos,
                espera_s=configuracion.espera_entre_reintentos_s,
                dormir=dormir,
            )
        except ServicioExternoError as error:
            motivo = (
                "el recorte no se superpone con la imagen (HTTP 500)"
                if error.codigo_http == 500
                else f"IRSA no entregó el recorte: {error.motivo}"
            )
            return FallaDeRecorte(observacion, motivo)
        try:
            contenido = recortar_extensiones(respuesta.content)
        except (OSError, KeyError, ValueError):
            return FallaDeRecorte(observacion, "IRSA devolvió un archivo que no es un FITS válido")
        cache.guardar_bytes("recortes", url, contenido, ".fits")
    try:
        recorte = leer_recorte(observacion, contenido)
    except (OSError, KeyError, ValueError) as error:
        return FallaDeRecorte(observacion, f"el recorte no se pudo leer ({type(error).__name__})")
    nan = float(np.isnan(recorte.imagen).mean()) if recorte.imagen.size else 1.0
    if nan > MAXIMA_FRACCION_NAN:
        return FallaDeRecorte(observacion, f"el {nan:.0%} del recorte cae fuera de la imagen (NaN)")
    return recorte


def bajar_recortes(
    observaciones: Sequence[Observacion],
    centro: Coordenadas,
    tamano_grados: float,
    *,
    cliente: httpx2.Client,
    cache: CacheEnDisco,
    configuracion: Configuracion,
    dormir: Callable[[float], None] = time.sleep,
) -> tuple[list[Recorte], list[FallaDeRecorte]]:
    """Baja los recortes en paralelo acotado; lo que falla queda como falla, no tumba el resto.

    Devuelve los recortes en el orden de `observaciones`.
    """
    hilos = min(configuracion.pedidos_simultaneos, MAXIMO_DE_PEDIDOS_SIMULTANEOS)
    with ThreadPoolExecutor(max_workers=hilos) as ejecutor:
        resultados = list(
            ejecutor.map(
                lambda o: _bajar_uno(
                    o, centro, tamano_grados, cliente, cache, configuracion, dormir
                ),
                observaciones,
            )
        )
    recortes = [r for r in resultados if isinstance(r, Recorte)]
    fallas = [r for r in resultados if isinstance(r, FallaDeRecorte)]
    return recortes, fallas
