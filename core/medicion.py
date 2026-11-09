"""Medición de una fuente cerca de su posición esperada (RF-32 y control de RF-04).

La fotometría de apertura sigue a `aperture()` de
`backend/spherex/photometry.py` de mateibut/SPHEREx
(https://github.com/mateibut/SPHEREx), Copyright (c) 2026 mateibut, licencia
MIT: suma dentro de un círculo menos la mediana de un anillo, y el error sale
de la dispersión del anillo (acá, con recorte sigma). Así el S/N incluye el ruido real del cielo
(estrellas débiles, residuos) y no sólo el de la varianza del detector. El
centroide lo calcula photutils (BSD-3-Clause) ajustando una cuádrica al pico.
"""

import math
import warnings
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt
from astropy.stats import sigma_clipped_stats
from astropy.utils.exceptions import AstropyUserWarning
from photutils.centroids import centroid_quadratic

RADIO_DE_APERTURA_PX = 1.5
"""El PSF de SPHEREx tiene un ancho a media altura de 1–2 píxeles."""
RADIO_DE_BUSQUEDA_PX = 1.5
"""Hasta dónde se busca el pico alrededor de la posición esperada."""
ANILLO_INTERIOR_PX = RADIO_DE_APERTURA_PX + 2
ANILLO_EXTERIOR_PX = RADIO_DE_APERTURA_PX + 5
MINIMO_DE_PIXELES_EN_EL_ANILLO = 8


@dataclass(frozen=True)
class Medicion:
    x: float
    y: float
    flujo: float
    """Suma en la apertura menos el fondo, en MJy/sr·píxel."""
    snr: float

    def distancia_a(self, x: float, y: float) -> float:
        return math.hypot(self.x - x, self.y - y)


def fotometria(
    imagen: npt.NDArray[np.float64], x: float, y: float, radio: float = RADIO_DE_APERTURA_PX
) -> tuple[float, float] | None:
    """(flujo, error) en una apertura centrada en (x, y); None si no hay datos alrededor.

    Coordenadas con el centro del píxel en los enteros.
    """
    filas, columnas = np.mgrid[0 : imagen.shape[0], 0 : imagen.shape[1]]
    distancia = np.hypot(columnas - x, filas - y)
    finito = np.isfinite(imagen)
    adentro = imagen[(distancia <= radio) & finito]
    anillo = imagen[(distancia >= radio + 2) & (distancia <= radio + 5) & finito]
    if adentro.size == 0 or anillo.size < MINIMO_DE_PIXELES_EN_EL_ANILLO:
        return None
    # Recorte sigma del anillo: una estrella brillante vecina (o su residuo
    # en la diferencia) no puede inflar el fondo ni el ruido de la medición.
    _media, fondo, desvio = sigma_clipped_stats(anillo, sigma=3.0)
    flujo = float(adentro.sum() - float(fondo) * adentro.size)
    error = float(desvio) * math.sqrt(adentro.size)
    return flujo, error


def medir_fuente(
    imagen: npt.NDArray[np.float64],
    x: float,
    y: float,
    radio_de_busqueda: float = RADIO_DE_BUSQUEDA_PX,
) -> Medicion | None:
    """Busca el pico más alto cerca de (x, y), lo centra y mide su S/N.

    Devuelve None si la zona no tiene datos. No decide si la medición es una
    detección: eso lo dice el S/N, que quien llama compara con su umbral.
    """
    alto, ancho = imagen.shape
    filas, columnas = np.mgrid[0:alto, 0:ancho]
    cerca = (np.hypot(columnas - x, filas - y) <= radio_de_busqueda) & np.isfinite(imagen)
    if not cerca.any():
        return None
    candidatos = np.where(cerca, imagen, -np.inf)
    fila_pico, columna_pico = np.unravel_index(int(np.argmax(candidatos)), imagen.shape)
    xc, yc = float(columna_pico), float(fila_pico)
    # El ajuste se hace sobre un recuadro de 5×5 alrededor del pico, con los
    # NaN rellenados con la mediana para que no rompan la cuádrica.
    y0, x0 = max(int(fila_pico) - 2, 0), max(int(columna_pico) - 2, 0)
    recuadro = imagen[y0 : y0 + 5, x0 : x0 + 5]
    recuadro = np.where(np.isfinite(recuadro), recuadro, np.nanmedian(recuadro))
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", AstropyUserWarning)
        centro = centroid_quadratic(recuadro, fit_boxsize=3)
    if np.all(np.isfinite(centro)):
        xq, yq = float(centro[0]) + x0, float(centro[1]) + y0
        if math.hypot(xq - xc, yq - yc) <= 1.0:
            xc, yc = xq, yq
    medida = fotometria(imagen, xc, yc)
    if medida is None:
        return None
    flujo, error = medida
    snr = flujo / error if error > 0 else 0.0
    return Medicion(x=xc, y=yc, flujo=flujo, snr=snr)
