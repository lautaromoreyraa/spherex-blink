"""RF-08: estrellas de catálogo con movimiento propio."""

from pathlib import Path

import httpx2
import pytest
from astropy.coordinates import SkyCoord

from core.cache import CacheEnDisco
from core.catalogo import consultar_simbad
from core.estrellas import (
    EstrellaDeCatalogo,
    adql_estrella_por_nombre,
    estrella_de_fila,
    posicion_en,
)
from core.gaia import estrella_de_gaia
from core.red import ServicioExternoError
from core.tap import filas_de_votable
from tests.fixture.servicios import configuracion_de_prueba, grabada


def _barnard() -> EstrellaDeCatalogo:
    (fila,) = filas_de_votable(grabada("simbad-barnard.xml"), "SIMBAD")
    return estrella_de_fila(fila)


def _separacion_arcsec(a: tuple[float, float], b: tuple[float, float]) -> float:
    return float(
        SkyCoord(a[0], a[1], unit="deg").separation(SkyCoord(b[0], b[1], unit="deg")).arcsec
    )


def test_la_respuesta_grabada_trae_a_barnard_con_su_movimiento_propio() -> None:
    barnard = _barnard()

    assert barnard.nombre == "Barnard's star"
    assert barnard.pmdec_mas_anio == pytest.approx(10362.394)
    assert barnard.magnitud is not None
    assert barnard.banda == "J"


def test_barnard_se_corre_10_4_segundos_de_arco_por_anio() -> None:
    barnard = _barnard()

    antes = posicion_en(barnard, 61000.0)
    despues = posicion_en(barnard, 61000.0 + 365.25)

    assert _separacion_arcsec(antes, despues) == pytest.approx(10.4, abs=0.5)


def test_una_estrella_sin_movimiento_propio_no_se_mueve() -> None:
    fija = EstrellaDeCatalogo(
        nombre="fija",
        ra=10.0,
        dec=-5.0,
        pmra_mas_anio=None,
        pmdec_mas_anio=None,
        paralaje_mas=None,
        velocidad_radial_km_s=None,
        magnitud=12.0,
        banda="J",
    )

    assert posicion_en(fija, 60000.0) == posicion_en(fija, 62000.0) == (10.0, -5.0)


def test_gaia_parte_de_la_epoca_2016() -> None:
    estrella = estrella_de_gaia(
        {
            "source_id": 1,
            "ra": 10.0,
            "dec": 0.0,
            "pmra": 0.0,
            "pmdec": 1000.0,
            "parallax": None,
            "radial_velocity": None,
            "phot_g_mean_mag": 12.0,
        }
    )

    # J2016.0 = MJD 57388,5: en esa fecha está en su posición de catálogo.
    ra, dec = posicion_en(estrella, 57388.5)

    assert estrella.nombre == "Gaia DR3 1"
    assert dec == pytest.approx(0.0, abs=1e-6)
    assert ra == pytest.approx(10.0, abs=1e-6)


def test_el_nombre_se_escapa_en_la_consulta() -> None:
    assert "i.id = 'NAME Barnard''s star'" in adql_estrella_por_nombre("NAME Barnard's star")


def test_simbad_prueba_el_siguiente_servidor_y_guarda_en_cache(tmp_path: Path) -> None:
    servidos: list[str] = []

    def responder(pedido: httpx2.Request) -> httpx2.Response:
        servidos.append(pedido.url.host)
        if pedido.url.host == "caido.prueba":
            return httpx2.Response(503)
        return httpx2.Response(200, content=grabada("simbad-barnard.xml"))

    configuracion = configuracion_de_prueba(tmp_path)
    configuracion = type(configuracion)(
        **{
            **configuracion.__dict__,
            "urls_tap_simbad": ("https://caido.prueba/sync", "https://simbad.prueba/sync"),
        }
    )
    cache = CacheEnDisco(tmp_path)
    with httpx2.Client(transport=httpx2.MockTransport(responder)) as cliente:
        filas, _ = consultar_simbad(
            "SELECT 1", cliente=cliente, configuracion=configuracion, cache=cache
        )
        consultar_simbad("SELECT 1", cliente=cliente, configuracion=configuracion, cache=cache)

    assert len(filas) == 1
    assert servidos.count("simbad.prueba") == 1


def test_sin_ningun_servidor_simbad_es_un_error_claro(tmp_path: Path) -> None:
    def responder(_pedido: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(503)

    with (
        httpx2.Client(transport=httpx2.MockTransport(responder)) as cliente,
        pytest.raises(ServicioExternoError, match="ningún servidor"),
    ):
        consultar_simbad(
            "SELECT 1",
            cliente=cliente,
            configuracion=configuracion_de_prueba(tmp_path),
            cache=CacheEnDisco(tmp_path),
        )
