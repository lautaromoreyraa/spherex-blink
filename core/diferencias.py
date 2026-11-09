"""Referencia (mediana) y diferencia de cada época contra las otras (RF-06).

Lo que no cambia entre fechas se cancela en la diferencia; lo que apareció,
se fue o se corrió queda como un par positivo/negativo. La mediana de la
época *k* se calcula sin la época *k*: si se la incluyera, un objeto que se
mueve se restaría a sí mismo en parte.
"""

import warnings
from collections.abc import Sequence

import numpy as np
import numpy.typing as npt

MINIMO_DE_EPOCAS = 3
"""Con 2 épocas la «mediana de las otras» es una sola imagen y la diferencia
no separa lo que cambió en una de lo que cambió en la otra."""

Imagen = npt.NDArray[np.float64]


def mediana(imagenes: Sequence[Imagen]) -> Imagen:
    """Mediana por píxel ignorando NaN; NaN donde ninguna época tiene dato."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        return np.asarray(np.nanmedian(np.stack(imagenes), axis=0), dtype=np.float64)


def rastro(imagenes: Sequence[Imagen]) -> Imagen:
    """Máximo por píxel de todas las épocas (RF-17), ignorando NaN.

    Un objeto que se mueve deja una fila de puntos: en cada fecha estuvo en
    otro píxel y el máximo guarda todas sus posiciones a la vez.
    """
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        return np.asarray(np.nanmax(np.stack(imagenes), axis=0), dtype=np.float64)


def diferencias(imagenes: Sequence[Imagen]) -> list[Imagen] | None:
    """Cada época menos la mediana de las demás; None con menos de 3 épocas."""
    if len(imagenes) < MINIMO_DE_EPOCAS:
        return None
    pila = np.stack(imagenes)
    resultado: list[Imagen] = []
    for k in range(len(imagenes)):
        otras = np.delete(pila, k, axis=0)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            referencia = np.nanmedian(otras, axis=0)
        resultado.append(np.asarray(pila[k] - referencia, dtype=np.float64))
    return resultado
