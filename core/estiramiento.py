"""Estiramiento común a todas las épocas y exportación a WebP (RF-05).

Adaptado de `backend/spherex/stretch.py` de mateibut/SPHEREx
(https://github.com/mateibut/SPHEREx), Copyright (c) 2026 mateibut, licencia
MIT: a cada época se le resta su propio fondo mediano (la luz zodiacal cambia
con la fecha y haría parpadear todo el cuadro) y después se calcula **una**
escala asinh con los píxeles de todas las épocas juntas, para que una estrella
no parezca más brillante sólo porque se escaló distinto.

Los WebP son en escala de grises con canal alfa: los píxeles inválidos
(enmascarados por FLAGS o fuera de la imagen) quedan con alfa 0, y el visor
los pinta con su color fijo de «sin dato». Así el mapa de color lo decide el
visor sin confundir un píxel roto con cielo oscuro.
"""

import io
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import numpy.typing as npt
from PIL import Image

PERCENTIL_INFERIOR = 1.0
PERCENTIL_SUPERIOR = 99.7
PARAMETRO_ASINH = 0.1
"""Más chico realza más lo débil; 0,1 es el de astropy y el de mateibut."""

PERCENTIL_DE_LA_DIFERENCIA = 99.5

Imagen = npt.NDArray[np.float64]


@dataclass(frozen=True)
class EscalaComun:
    minimo: float
    """MJy/sr (con el fondo restado) que se pintan negros."""
    maximo: float
    """MJy/sr (con el fondo restado) que se pintan blancos."""


def fondo_mediano(imagen: Imagen) -> float:
    validos = imagen[np.isfinite(imagen)]
    return float(np.median(validos)) if validos.size else 0.0


def escala_comun(imagenes: Sequence[Imagen]) -> EscalaComun:
    """Una escala para todas las épocas, de los percentiles de todos sus píxeles."""
    juntos = np.concatenate([i[np.isfinite(i)].ravel() for i in imagenes] or [np.zeros(1)])
    if juntos.size == 0:
        juntos = np.zeros(1)
    minimo, maximo = (
        float(v) for v in np.percentile(juntos, [PERCENTIL_INFERIOR, PERCENTIL_SUPERIOR])
    )
    if maximo <= minimo:
        maximo = minimo + 1.0
    return EscalaComun(minimo=minimo, maximo=maximo)


def a_ocho_bits(imagen: Imagen, escala: EscalaComun) -> npt.NDArray[np.uint8]:
    """Asinh entre el mínimo y el máximo comunes; los NaN quedan en 0."""
    normalizada = np.clip((imagen - escala.minimo) / (escala.maximo - escala.minimo), 0, 1)
    estirada = np.arcsinh(normalizada / PARAMETRO_ASINH) / np.arcsinh(1 / PARAMETRO_ASINH)
    return np.asarray(np.round(np.nan_to_num(estirada, nan=0.0) * 255), dtype=np.uint8)


def limite_de_la_diferencia(diferencias: Sequence[Imagen]) -> float:
    """Valor absoluto que se pinta en los extremos de la escala divergente, común a todas."""
    juntos = np.concatenate(
        [np.abs(d[np.isfinite(d)]).ravel() for d in diferencias] or [np.zeros(1)]
    )
    limite = float(np.percentile(juntos, PERCENTIL_DE_LA_DIFERENCIA)) if juntos.size else 0.0
    return limite if limite > 0 else 1.0


def diferencia_a_ocho_bits(diferencia: Imagen, limite: float) -> npt.NDArray[np.uint8]:
    """Escala lineal simétrica: 128 es «sin cambio», 255 «apareció», 0 «se fue»."""
    lineal = np.clip(diferencia / limite, -1, 1)
    return np.asarray(np.round(np.nan_to_num(lineal, nan=0.0) * 127 + 128), dtype=np.uint8)


def webp(valores: npt.NDArray[np.uint8], valido: npt.NDArray[np.bool_]) -> bytes:
    """WebP sin pérdida, gris + alfa (alfa 0 en los píxeles inválidos)."""
    alfa = np.where(valido, 255, 0).astype(np.uint8)
    imagen = Image.fromarray(np.ascontiguousarray(np.dstack([valores, alfa])), mode="LA")
    salida = io.BytesIO()
    # method=6: la compresión más lenta y más chica; los campos se generan una vez.
    imagen.save(salida, format="WEBP", lossless=True, quality=100, method=6, exact=True)
    return salida.getvalue()


def escribir_webp(
    valores: npt.NDArray[np.uint8], valido: npt.NDArray[np.bool_], ruta: Path
) -> Path:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_bytes(webp(valores, valido))
    return ruta
