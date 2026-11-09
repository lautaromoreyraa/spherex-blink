"""RF-04: rejilla común norte arriba."""

import numpy as np
import pytest

from contrato.comunes import Coordenadas
from core.epocas import Observacion
from core.medicion import medir_fuente
from core.recortes import leer_recorte, recortar_extensiones
from core.rejilla import rejilla_norte_arriba, reproyectar
from tests.fixture.sinteticos import Fuente, mef_sintetico

CENTRO = Coordenadas(ra=200.0, dec=20.0)
ESTRELLAS = [
    Fuente(200.0, 20.0, 5.0),
    Fuente(200.012, 20.008, 3.0),
    Fuente(199.99, 19.991, 4.0),
]
OBS = Observacion(
    planeid="p", uri="https://irsa/a.fits", mjd=61200.0, detector="D1", version_proceso="1"
)


def _alinear(rotacion: float, sip: bool = False, flags: np.ndarray | None = None) -> np.ndarray:
    contenido = mef_sintetico(
        CENTRO.ra,
        CENTRO.dec,
        lado=61,
        rotacion_grados=rotacion,
        fuentes=ESTRELLAS,
        sip=sip,
        flags=flags,
    )
    recorte = leer_recorte(OBS, recortar_extensiones(contenido))
    return reproyectar(recorte, rejilla_norte_arriba(CENTRO, 0.06)).imagen


@pytest.mark.parametrize("rotacion", [0.0, 30.0, 117.0])
def test_las_estrellas_caen_en_su_pixel_con_cualquier_orientacion(rotacion: float) -> None:
    rejilla = rejilla_norte_arriba(CENTRO, 0.06)
    imagen = _alinear(rotacion)

    for estrella in ESTRELLAS:
        x, y = rejilla.a_pixel(estrella.ra, estrella.dec)
        medida = medir_fuente(imagen - 0.2, x, y)
        assert medida is not None
        assert medida.distancia_a(x, y) < 0.2


def test_el_norte_queda_arriba_y_el_este_a_la_izquierda() -> None:
    rejilla = rejilla_norte_arriba(CENTRO, 0.06)

    x0, y0 = rejilla.a_pixel(200.0, 20.0)
    _, y_norte = rejilla.a_pixel(200.0, 20.01)
    x_este, _ = rejilla.a_pixel(200.01, 20.0)

    assert y_norte < y0
    assert x_este < x0


def test_pixel_y_cielo_son_inversos() -> None:
    rejilla = rejilla_norte_arriba(CENTRO, 0.06)

    ra, dec = rejilla.a_cielo(*rejilla.a_pixel(200.013, 19.987))

    assert ra == pytest.approx(200.013, abs=1e-9)
    assert dec == pytest.approx(19.987, abs=1e-9)


def test_la_cabecera_describe_la_misma_rejilla() -> None:
    from astropy.io import fits
    from astropy.wcs import WCS

    rejilla = rejilla_norte_arriba(CENTRO, 0.06)
    cabecera = rejilla.cabecera()
    reconstruida = WCS(fits.Header(cabecera))

    assert cabecera["NAXIS1"] == rejilla.ancho
    assert cabecera["CTYPE1"] == "RA---TAN"
    assert np.allclose(
        reconstruida.pixel_to_world_values(3.0, 7.0), rejilla.wcs.pixel_to_world_values(3.0, 7.0)
    )


def test_un_recorte_de_borde_con_sip_no_falla_y_lo_de_fuera_queda_en_nan() -> None:
    # El recorte (21×21) es mucho más chico que la rejilla y tiene una SIP
    # fuerte: lejos de él la inversa no converge.
    contenido = mef_sintetico(CENTRO.ra + 0.02, CENTRO.dec, lado=21, rotacion_grados=45, sip=True)
    recorte = leer_recorte(OBS, recortar_extensiones(contenido))

    alineada = reproyectar(recorte, rejilla_norte_arriba(CENTRO, 0.2))

    assert np.isnan(alineada.imagen).mean() > 0.5
    assert np.isfinite(alineada.imagen).any()


def test_los_pixeles_malos_no_se_agrandan_al_reproyectar() -> None:
    flags = np.zeros((61, 61), dtype=np.int32)
    flags[10, 10] = 1 << 10

    imagen = _alinear(0.0, flags=flags)

    assert np.isnan(imagen).sum() <= 2
