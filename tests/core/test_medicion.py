"""Medición de una fuente cerca de su posición esperada."""

import numpy as np
import pytest

from core.medicion import fotometria, medir_fuente


def _imagen(x: float, y: float, pico: float, ruido: float = 0.01, semilla: int = 3) -> np.ndarray:
    generador = np.random.default_rng(semilla)
    filas, columnas = np.mgrid[0:30, 0:30]
    imagen = generador.normal(0, ruido, (30, 30))
    imagen += pico * np.exp(-((columnas - x) ** 2 + (filas - y) ** 2) / 2)
    return imagen


def test_centra_una_fuente_brillante_y_da_un_snr_alto() -> None:
    medida = medir_fuente(_imagen(14.3, 15.6, 1.0), 14.0, 16.0)

    assert medida is not None
    assert medida.x == pytest.approx(14.3, abs=0.15)
    assert medida.y == pytest.approx(15.6, abs=0.15)
    assert medida.snr > 50


def test_sobre_ruido_puro_el_snr_es_bajo() -> None:
    medida = medir_fuente(_imagen(0, 0, 0.0), 15.0, 15.0)

    assert medida is not None
    assert medida.snr < 5


def test_una_vecina_brillante_en_el_anillo_no_infla_el_ruido() -> None:
    con_vecina = _imagen(15.0, 15.0, 0.3)
    con_vecina[15, 20] += 50.0

    medida = medir_fuente(con_vecina, 15.0, 15.0)

    assert medida is not None
    assert medida.snr > 20


def test_sin_datos_alrededor_no_hay_medicion() -> None:
    assert medir_fuente(np.full((20, 20), np.nan), 10.0, 10.0) is None
    assert fotometria(np.full((20, 20), np.nan), 10.0, 10.0) is None
