"""Máscara de píxeles malos a partir de la extensión FLAGS (RF-03).

Adaptado de `backend/spherex/flags.py` de mateibut/SPHEREx
(https://github.com/mateibut/SPHEREx), Copyright (c) 2026 mateibut, licencia
MIT. Se conserva la lista de bits malos y la regla de no tratar como malo
«cualquier bit distinto de cero»: el bit 21 (píxel asociado a una fuente
conocida) está prendido en casi toda la imagen y el 12 sólo dice que hay
historia completa del píxel.

Los bits 7, 14, 15, 17 y 19 no se enmascaran mientras el SRS no lo decida: el
19 (outlier) puede caer justo sobre un objeto que se mueve.
"""

import numpy as np
import numpy.typing as npt

BITS_MALOS = (0, 1, 2, 4, 5, 6, 9, 10, 11)
"""0 transitorio, 1 desborde, 2 error del SUR, 4 fantasma, 5 referencia,
6 inutilizable, 9 dato perdido a bordo, 10 caliente, 11 frío."""

BITS_INFORMATIVOS = (12, 21)

MASCARA_DE_BITS_MALOS = sum(1 << bit for bit in BITS_MALOS)


def pixeles_malos(flags: npt.NDArray[np.integer]) -> npt.NDArray[np.bool_]:
    """True donde el píxel tiene al menos un bit malo.

    Los valores negativos marcan píxeles fuera de la imagen en algunos
    recortes: no son malos, son ausencia de dato (eso lo dice el NaN).
    """
    valores = np.asarray(flags).astype(np.int64)
    return np.asarray((valores >= 0) & ((valores & MASCARA_DE_BITS_MALOS) != 0), dtype=np.bool_)


def fraccion_mala(flags: npt.NDArray[np.integer], imagen: npt.NDArray[np.floating]) -> float:
    """Fracción de los píxeles con dato que quedan enmascarados por FLAGS."""
    con_dato = np.isfinite(imagen)
    total = int(con_dato.sum())
    if total == 0:
        return 0.0
    return float((pixeles_malos(flags) & con_dato).sum() / total)
