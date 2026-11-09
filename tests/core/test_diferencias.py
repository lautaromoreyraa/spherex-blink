"""RF-06: referencia y diferencia."""

import numpy as np
import pytest

from core.diferencias import diferencias, mediana, rastro


def _epoca(x: int) -> np.ndarray:
    generador = np.random.default_rng(7)
    cielo = generador.normal(1.0, 0.01, (30, 30))
    cielo[10, 10] += 5.0  # estrella fija
    cielo[20, x] += 3.0  # fuente que se corre
    return cielo


def test_lo_fijo_se_cancela_y_lo_que_se_mueve_deja_un_par() -> None:
    # La fuente está en x=10 en tres épocas y se corre a x=14 en la cuarta.
    epocas = [_epoca(x) for x in (10, 10, 10, 14)]

    difs = diferencias(epocas)

    assert difs is not None
    movida = difs[3]
    assert movida[20, 14] == pytest.approx(3.0)
    assert movida[20, 10] == pytest.approx(-3.0)
    resto = np.ones_like(movida, dtype=bool)
    resto[20, [10, 14]] = False
    assert np.abs(movida[resto]).max() < 1e-9
    # En una época donde no se movió, todo se cancela.
    assert np.abs(difs[0]).max() < 1e-9


def test_la_mediana_de_una_epoca_no_la_incluye() -> None:
    a, b, c = np.zeros((1, 1)), np.ones((1, 1)), np.full((1, 1), 10.0)

    difs = diferencias([a, b, c])

    assert difs is not None
    # mediana de (b, c) = 5,5 → a − 5,5; si incluyera a sería 1.
    assert difs[0][0, 0] == pytest.approx(-5.5)


def test_con_menos_de_tres_epocas_no_hay_diferencia() -> None:
    assert diferencias([np.zeros((2, 2)), np.ones((2, 2))]) is None


def test_la_mediana_ignora_los_nan() -> None:
    a = np.array([[1.0, np.nan]])
    b = np.array([[3.0, 2.0]])

    assert np.array_equal(mediana([a, b]), np.array([[2.0, 2.0]]))


def test_el_rastro_guarda_cada_posicion_de_lo_que_se_mueve() -> None:
    epocas = [_epoca(x) for x in (10, 12, 14)]

    maximo = rastro(epocas)

    # RF-17: la fuente que se corre deja un punto en cada posición.
    for x in (10, 12, 14):
        assert maximo[20, x] > 3.5
    assert maximo[10, 10] == pytest.approx(epocas[0][10, 10])


def test_el_rastro_ignora_los_nan() -> None:
    a = np.array([[1.0, np.nan]])
    b = np.array([[3.0, 2.0]])

    assert np.array_equal(rastro([a, b]), np.array([[3.0, 2.0]]))
