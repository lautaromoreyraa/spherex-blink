"""RF-03: máscara de píxeles malos."""

import numpy as np
import pytest

from core.mascara import BITS_MALOS, fraccion_mala, pixeles_malos


def test_solo_los_bits_malos_invalidan_el_pixel() -> None:
    malos = [1 << b for b in (0, 1, 2, 4, 5, 6, 9, 10, 11)]
    buenos = [0, 1 << 12, 1 << 21, 1 << 26, (1 << 12) | (1 << 21) | (1 << 26)]
    flags = np.array([malos + buenos], dtype=np.int32)

    mascara = pixeles_malos(flags)

    assert mascara[0, : len(malos)].all()
    assert not mascara[0, len(malos) :].any()
    assert set(BITS_MALOS) == {0, 1, 2, 4, 5, 6, 9, 10, 11}


def test_un_bit_malo_junto_a_informativos_invalida_igual() -> None:
    flags = np.array([[(1 << 21) | (1 << 10)]], dtype=np.int32)

    assert pixeles_malos(flags)[0, 0]


def test_la_fraccion_mala_cuenta_solo_pixeles_con_dato() -> None:
    flags = np.zeros((4, 5), dtype=np.int32)
    flags[0, :3] = 1 << 0  # 3 malos
    flags[1, 0] = 1 << 21  # informativo
    imagen = np.ones((4, 5))
    imagen[3, :] = np.nan  # 5 sin dato

    assert fraccion_mala(flags, imagen) == pytest.approx(3 / 15)
