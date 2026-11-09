"""RF-32 y geometría: efemérides y vectores de JPL Horizons."""

from datetime import UTC, datetime
from pathlib import Path

import httpx2
import pytest

from core.cache import CacheEnDisco
from core.efemerides import (
    Horizons,
    efemeride_de_texto,
    filas_de_horizons,
    vectores_de_texto,
)
from core.red import ServicioExternoError
from tests.fixture.servicios import configuracion_de_prueba, grabada, grabada_json

MJDS = [61200.405730278, 61201.355920, 61204.478805]


def test_la_tabla_de_observador_da_posicion_y_distancia() -> None:
    texto = grabada_json("horizons-makemake-observador.json")["result"]

    posiciones = efemeride_de_texto(texto, MJDS)

    assert [p.mjd for p in posiciones] == MJDS
    assert posiciones[0].ra == pytest.approx(200.70086, abs=1e-4)
    assert posiciones[0].dec == pytest.approx(20.98899, abs=1e-4)
    assert 51 < posiciones[0].distancia_ua < 54
    # En 3 días se corre hacia el oeste y el sur.
    assert posiciones[-1].ra < posiciones[0].ra
    assert posiciones[-1].dec < posiciones[0].dec


def test_los_vectores_de_la_tierra_estan_a_una_ua_del_sol() -> None:
    texto = grabada_json("horizons-tierra-vectores.json")["result"]

    vectores = vectores_de_texto(texto, MJDS)

    for vector in vectores:
        distancia = (vector.x_ua**2 + vector.y_ua**2 + vector.z_ua**2) ** 0.5
        assert distancia == pytest.approx(1.015, abs=0.02)
        assert abs(vector.z_ua) < 1e-3  # plano de la eclíptica


def test_una_respuesta_sin_efemerides_es_un_error() -> None:
    with pytest.raises(ServicioExternoError, match="no trae efemérides"):
        filas_de_horizons("No matches found.")


def test_si_faltan_fechas_es_un_error() -> None:
    texto = grabada_json("horizons-makemake-observador.json")["result"]

    with pytest.raises(ServicioExternoError, match="se pidieron 4"):
        efemeride_de_texto(texto, [*MJDS, 61205.0])


def test_el_cliente_guarda_la_respuesta_y_su_fecha(tmp_path: Path) -> None:
    pedidos: list[httpx2.Request] = []

    def responder(pedido: httpx2.Request) -> httpx2.Response:
        pedidos.append(pedido)
        return httpx2.Response(200, content=grabada("horizons-makemake-observador.json"))

    momento = datetime(2026, 11, 8, 12, tzinfo=UTC)
    with httpx2.Client(transport=httpx2.MockTransport(responder)) as cliente:
        primero = Horizons(
            cliente=cliente,
            configuracion=configuracion_de_prueba(tmp_path),
            cache=CacheEnDisco(tmp_path),
            ahora=lambda: momento,
        )
        primero.efemeride("136472;", MJDS)
        segundo = Horizons(
            cliente=cliente,
            configuracion=configuracion_de_prueba(tmp_path),
            cache=CacheEnDisco(tmp_path),
        )
        segundo.efemeride("136472;", MJDS)

    assert len(pedidos) == 1
    assert pedidos[0].url.params["COMMAND"] == "'136472;'"
    assert pedidos[0].url.params["TLIST"].startswith("'2461200.905730278'")
    assert segundo.consultado_en == momento
