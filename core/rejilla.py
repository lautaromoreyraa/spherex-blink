"""Rejilla común norte arriba y reproyección de cada época (RF-04).

Cada exposición de SPHEREx tiene su propia orientación en el cielo: sin
llevarlas a una misma rejilla, las estrellas girarían de una fecha a otra y el
parpadeo no serviría. La rejilla es TAN, norte arriba y este a la izquierda,
con el píxel nativo de 6,15″; la definición sigue a `target_wcs` de
`backend/spherex/cutout.py` de mateibut/SPHEREx (Copyright (c) 2026 mateibut,
licencia MIT). La reproyección la hace `reproject` (astropy, BSD-3-Clause)
con interpolación bilineal, que conserva las posiciones a fracciones de
píxel.

Convención de píxeles del contrato: (x, y) con origen en el centro del píxel
de arriba a la izquierda, x hacia la derecha e y hacia abajo. Los arreglos de
este módulo ya están en ese orden de filas (la fila 0 es la de arriba, al
revés que en FITS).
"""

import math
import warnings
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt
from astropy.convolution import Gaussian2DKernel, interpolate_replace_nans
from astropy.utils.exceptions import AstropyUserWarning, AstropyWarning
from astropy.wcs import WCS
from reproject import reproject_interp

from contrato.comunes import Coordenadas
from core.mascara import pixeles_malos
from core.recortes import Recorte

ESCALA_NATIVA_ARCSEC = 6.15

ValorDeCabecera = str | int | float | bool


@dataclass(frozen=True)
class Rejilla:
    wcs: WCS
    ancho: int
    alto: int
    escala_arcsec: float

    def a_pixel(self, ra: float, dec: float) -> tuple[float, float]:
        """Cielo → píxel de la rejilla (origen arriba a la izquierda)."""
        x, y_fits = self.wcs.world_to_pixel_values(ra, dec)
        return float(x), float(self.alto - 1 - y_fits)

    def a_cielo(self, x: float, y: float) -> tuple[float, float]:
        """Píxel de la rejilla (origen arriba a la izquierda) → cielo."""
        ra, dec = self.wcs.pixel_to_world_values(x, self.alto - 1 - y)
        return float(ra) % 360, float(dec)

    def contiene(self, x: float, y: float) -> bool:
        return -0.5 <= x <= self.ancho - 0.5 and -0.5 <= y <= self.alto - 0.5

    def cabecera(self) -> dict[str, ValorDeCabecera]:
        """Cabecera FITS de la rejilla como diccionario, para `campo.json`."""
        cabecera = self.wcs.to_header()
        cabecera["NAXIS1"] = self.ancho
        cabecera["NAXIS2"] = self.alto
        salida: dict[str, ValorDeCabecera] = {}
        for clave in cabecera:
            valor = cabecera[clave]
            if isinstance(valor, bool | int | str):
                salida[clave] = valor
            elif isinstance(valor, float):
                salida[clave] = round(valor, 12)
        return dict(sorted(salida.items()))


def rejilla_norte_arriba(
    centro: Coordenadas, tamano_grados: float, escala_arcsec: float = ESCALA_NATIVA_ARCSEC
) -> Rejilla:
    lado = max(8, math.ceil(tamano_grados * 3600 / escala_arcsec))
    wcs = WCS(naxis=2)
    wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]
    wcs.wcs.cunit = ["deg", "deg"]
    wcs.wcs.crval = [centro.ra, centro.dec]
    wcs.wcs.crpix = [(lado + 1) / 2, (lado + 1) / 2]
    paso = escala_arcsec / 3600
    wcs.wcs.cdelt = [-paso, paso]
    wcs.wcs.radesys = "ICRS"
    return Rejilla(wcs=wcs, ancho=lado, alto=lado, escala_arcsec=escala_arcsec)


@dataclass(frozen=True)
class EpocaAlineada:
    """Una época llevada a la rejilla común; NaN donde no hay dato válido."""

    recorte: Recorte
    imagen: npt.NDArray[np.float64]
    varianza: npt.NDArray[np.float64]

    @property
    def valido(self) -> npt.NDArray[np.bool_]:
        return np.isfinite(self.imagen)


def reproyectar(recorte: Recorte, rejilla: Rejilla) -> EpocaAlineada:
    """Lleva un recorte a la rejilla; los píxeles malos y los de fuera quedan en NaN.

    Interpolar con NaN agranda cada píxel malo a sus cuatro vecinos. Para que
    la máscara de la rejilla tenga el mismo tamaño que la original, los
    píxeles malos se rellenan con sus vecinos antes de interpolar la imagen, y
    la máscara se lleva aparte con vecino más cercano; al final, lo que la
    máscara marca queda en NaN.

    Lejos de la imagen la inversa de SIP puede no converger: astropy devuelve
    su mejor solución con un aviso, que acá se silencia porque esos píxeles
    caen fuera del recorte y salen en NaN igual.
    """
    malos = pixeles_malos(recorte.flags) & np.isfinite(recorte.imagen)
    imagen = recorte.imagen.astype(np.float64)
    imagen[malos] = np.nan
    fuera = ~np.isfinite(recorte.imagen)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", AstropyUserWarning)
        rellena = interpolate_replace_nans(imagen, Gaussian2DKernel(x_stddev=1.0))
    rellena[fuera] = np.nan
    forma = (rejilla.alto, rejilla.ancho)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", AstropyWarning)
        warnings.simplefilter("ignore", UserWarning)
        datos, _ = reproject_interp(
            (rellena, recorte.wcs), rejilla.wcs, shape_out=forma, order="bilinear"
        )
        mascara, _ = reproject_interp(
            (malos.astype(np.float64), recorte.wcs),
            rejilla.wcs,
            shape_out=forma,
            order="nearest-neighbor",
        )
        varianza, _ = reproject_interp(
            (recorte.varianza.astype(np.float64), recorte.wcs),
            rejilla.wcs,
            shape_out=forma,
            order="bilinear",
        )
    datos = np.asarray(datos, dtype=np.float64)
    datos[np.nan_to_num(np.asarray(mascara), nan=0.0) > 0.5] = np.nan
    datos = np.flipud(datos)
    varianza = np.flipud(np.asarray(varianza, dtype=np.float64))
    varianza[~np.isfinite(datos)] = np.nan
    return EpocaAlineada(recorte=recorte, imagen=datos, varianza=varianza)
