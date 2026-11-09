"""FITS sintéticos con la forma de un recorte L2 de SPHEREx.

Imitan lo que devuelve el servicio de recortes de IRSA: extensiones IMAGE,
FLAGS, VARIANCE y WCS-WAVE, una WCS celeste TAN (con SIP opcional) girada
respecto del norte y la WCS espectral alternativa «W». Las fuentes son
gaussianas puestas en coordenadas del cielo, así un test sabe dónde tienen que
caer después de reproyectar.
"""

import io
import math
from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt
from astropy.io import fits
from astropy.wcs import WCS

ESCALA_GRADOS = 6.15 / 3600
LONGITUD_DE_ONDA_MINIMA = 0.75
LONGITUD_DE_ONDA_POR_PIXEL = 0.35 / 2040
DESPLAZAMIENTO_EN_EL_DETECTOR = 1000
"""El recorte empieza en la columna 1000 del detector (como CRPIX1A de IRSA)."""


@dataclass(frozen=True)
class Fuente:
    ra: float
    dec: float
    flujo: float
    """Pico en MJy/sr."""
    sigma_px: float = 1.0


def wcs_celeste(ra: float, dec: float, lado: int, rotacion_grados: float, sip: bool = False) -> WCS:
    wcs = WCS(naxis=2)
    wcs.wcs.ctype = ["RA---TAN-SIP", "DEC--TAN-SIP"] if sip else ["RA---TAN", "DEC--TAN"]
    wcs.wcs.crval = [ra, dec]
    wcs.wcs.crpix = [(lado + 1) / 2, (lado + 1) / 2]
    angulo = math.radians(rotacion_grados)
    wcs.wcs.cd = [
        [-ESCALA_GRADOS * math.cos(angulo), ESCALA_GRADOS * math.sin(angulo)],
        [ESCALA_GRADOS * math.sin(angulo), ESCALA_GRADOS * math.cos(angulo)],
    ]
    wcs.wcs.radesys = "ICRS"
    if sip:
        from astropy.wcs import Sip

        # Distorsión fuerte a propósito, para que la inversa no converja lejos.
        a = np.zeros((4, 4))
        b = np.zeros((4, 4))
        a[2, 0] = 4e-3
        a[3, 0] = 2e-4
        b[0, 2] = 4e-3
        b[0, 3] = 2e-4
        wcs.sip = Sip(a, b, None, None, wcs.wcs.crpix)
    return wcs


def longitud_de_onda_esperada(x_del_recorte: float) -> float:
    return LONGITUD_DE_ONDA_MINIMA + LONGITUD_DE_ONDA_POR_PIXEL * (
        x_del_recorte + DESPLAZAMIENTO_EN_EL_DETECTOR
    )


def _tabla_de_longitudes() -> fits.BinTableHDU:
    eje = np.linspace(0, 2040, 9).astype(np.int32)
    valores = np.zeros((9, 9, 2), dtype=np.float32)
    for i in range(9):
        for j in range(9):
            valores[i, j, 0] = LONGITUD_DE_ONDA_MINIMA + LONGITUD_DE_ONDA_POR_PIXEL * eje[j]
            valores[i, j, 1] = 0.017
    columnas = [
        fits.Column(name="X", format="9J", dim="(9)", array=eje[np.newaxis, :]),
        fits.Column(name="Y", format="9J", dim="(9)", array=eje[np.newaxis, :]),
        fits.Column(name="VALUES", format="162E", dim="(2,9,9)", array=valores[np.newaxis]),
    ]
    return fits.BinTableHDU.from_columns(columnas, name="WCS-WAVE")


def _claves_espectrales(cabecera: fits.Header) -> None:
    claves: dict[str, str | int | float] = {
        "WCSAXESW": 2,
        "CTYPE1W": "WAVE-TAB",
        "CTYPE2W": "WAVE-TAB",
        "CRPIX1W": -float(DESPLAZAMIENTO_EN_EL_DETECTOR),
        "CRPIX2W": -float(DESPLAZAMIENTO_EN_EL_DETECTOR),
        "CDELT1W": 1,
        "CDELT2W": 1,
        "CUNIT1W": "um",
        "CUNIT2W": "um",
        "CRVAL1W": 1,
        "CRVAL2W": 1,
        "PV1_3W": 1,
        "PV2_3W": 2,
        "PS1_0W": "WCS-WAVE",
        "PS2_0W": "WCS-WAVE",
        "PS1_1W": "VALUES",
        "PS2_1W": "VALUES",
        "PS1_2W": "X",
        "PS2_2W": "Y",
    }
    for clave, valor in claves.items():
        cabecera[clave] = valor


def imagen_con_fuentes(
    wcs: WCS, lado: int, fuentes: Sequence[Fuente], fondo: float, ruido: float, semilla: int
) -> npt.NDArray[np.float32]:
    generador = np.random.default_rng(semilla)
    imagen = np.full((lado, lado), fondo, dtype=np.float64)
    imagen += generador.normal(0, ruido, (lado, lado)) if ruido > 0 else 0
    filas, columnas = np.mgrid[0:lado, 0:lado]
    for fuente in fuentes:
        x, y = wcs.all_world2pix([[fuente.ra, fuente.dec]], 0)[0]
        imagen += fuente.flujo * np.exp(
            -((columnas - x) ** 2 + (filas - y) ** 2) / (2 * fuente.sigma_px**2)
        )
    return imagen.astype(np.float32)


def mef_sintetico(
    ra: float,
    dec: float,
    *,
    lado: int = 41,
    rotacion_grados: float = 30.0,
    fuentes: Sequence[Fuente] = (),
    fondo: float = 0.2,
    ruido: float = 0.0,
    semilla: int = 0,
    flags: npt.NDArray[np.int32] | None = None,
    sip: bool = False,
    fraccion_nan: float = 0.0,
) -> bytes:
    """Bytes de un MEF como el que devuelve el servicio de recortes."""
    wcs = wcs_celeste(ra, dec, lado, rotacion_grados, sip)
    imagen = imagen_con_fuentes(wcs, lado, fuentes, fondo, ruido, semilla)
    if fraccion_nan > 0:
        filas_nan = round(lado * fraccion_nan)
        imagen[:filas_nan, :] = np.nan
    cabecera = wcs.to_header(relax=True)
    cabecera["BUNIT"] = "MJy / sr"
    _claves_espectrales(cabecera)
    hdus = fits.HDUList(
        [
            fits.PrimaryHDU(),
            fits.ImageHDU(imagen, header=cabecera, name="IMAGE"),
            fits.ImageHDU(
                flags if flags is not None else np.zeros((lado, lado), dtype=np.int32),
                header=wcs.to_header(relax=True),
                name="FLAGS",
            ),
            fits.ImageHDU(
                np.full((lado, lado), 1e-4, dtype=np.float32),
                header=wcs.to_header(relax=True),
                name="VARIANCE",
            ),
            fits.ImageHDU(np.zeros((3, 5, 5), dtype=np.float32), name="PSF"),
            _tabla_de_longitudes(),
        ]
    )
    salida = io.BytesIO()
    hdus.writeto(salida)
    return salida.getvalue()
