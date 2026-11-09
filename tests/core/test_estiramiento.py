"""RF-05: estiramiento común y WebP."""

import io

import numpy as np
from PIL import Image

from core.estiramiento import (
    a_ocho_bits,
    diferencia_a_ocho_bits,
    escala_comun,
    fondo_mediano,
    webp,
)


def test_una_sola_escala_para_todas_las_epocas() -> None:
    oscura = np.full((10, 10), 1.0)
    clara = np.full((10, 10), 3.0)
    clara[5, 5] = 50.0

    escala = escala_comun([oscura, clara])
    a, b = a_ocho_bits(oscura, escala), a_ocho_bits(clara, escala)

    # Con la misma escala, el mismo valor da el mismo gris en las dos épocas.
    assert escala.minimo <= 1.0 < 3.0 < escala.maximo
    assert a[0, 0] < b[0, 0]
    assert a_ocho_bits(np.full((1, 1), 3.0), escala)[0, 0] == b[0, 0]


def test_el_estiramiento_va_de_negro_a_blanco_y_crece() -> None:
    escala = escala_comun([np.linspace(0, 10, 1000).reshape(10, 100)])
    valores = a_ocho_bits(np.array([[escala.minimo, 1.0, 5.0, escala.maximo]]), escala)

    assert valores[0, 0] == 0
    assert valores[0, -1] == 255
    assert list(valores[0]) == sorted(valores[0])


def test_el_fondo_mediano_ignora_los_nan() -> None:
    imagen = np.array([[1.0, 2.0, np.nan, 3.0]])

    assert fondo_mediano(imagen) == 2.0


def test_la_diferencia_cero_es_gris_medio() -> None:
    valores = diferencia_a_ocho_bits(np.array([[0.0, 5.0, -5.0, 100.0]]), 5.0)

    assert list(valores[0]) == [128, 255, 1, 255]


def test_los_invalidos_salen_transparentes_y_el_webp_es_chico() -> None:
    generador = np.random.default_rng(1)
    valores = generador.integers(0, 256, (88, 88)).astype(np.uint8)
    valido = np.ones((88, 88), dtype=bool)
    valido[0, :10] = False

    contenido = webp(valores, valido)
    leida = Image.open(io.BytesIO(contenido))

    assert leida.format == "WEBP"
    rgba = np.asarray(leida.convert("RGBA"))
    assert (rgba[0, :10, 3] == 0).all()
    assert (rgba[1:, :, 3] == 255).all()
    assert np.array_equal(rgba[1:, :, 0], valores[1:, :])  # sin pérdida
    assert len(contenido) <= 400 * 1024
