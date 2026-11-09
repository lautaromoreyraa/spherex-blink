"""RF-01: búsqueda de las observaciones de un campo."""

from datetime import UTC, datetime
from pathlib import Path

import httpx2
import pytest

from contrato.comunes import Coordenadas
from core.cache import CacheEnDisco
from core.configuracion import configuracion_desde_entorno
from core.epocas import pasada_de
from core.observaciones import adql_de_observaciones, buscar_observaciones, observaciones_de_filas
from core.red import crear_cliente
from core.tap import filas_de_votable
from tests.fixture.servicios import configuracion_de_prueba, grabada

BARNARD = Coordenadas(ra=269.4486, dec=4.7397)


def _filas() -> list[dict[str, object]]:
    return filas_de_votable(grabada("irsa-tap-barnard.xml"), "IRSA TAP")


def test_la_respuesta_grabada_da_observaciones_ordenadas_con_uri_absoluta() -> None:
    observaciones = observaciones_de_filas(_filas(), "D1", "https://irsa.ipac.caltech.edu/")

    assert len(observaciones) == 6
    assert [o.mjd for o in observaciones] == sorted(o.mjd for o in observaciones)
    for observacion in observaciones:
        assert observacion.planeid
        assert observacion.detector == "D1"
        assert observacion.uri.startswith("https://irsa.ipac.caltech.edu/ibe/data/spherex/")
        assert observacion.uri.endswith("D1_spx_l2b-v24-2026-094.fits")


def test_filtrar_por_d2_no_devuelve_filas_de_otro_detector() -> None:
    # La respuesta grabada tiene filas de D1 y D4, ninguna de D2.
    assert observaciones_de_filas(_filas(), "D2", "https://irsa.ipac.caltech.edu/") == []
    d4 = observaciones_de_filas(_filas(), "D4", "https://irsa.ipac.caltech.edu/")
    assert d4
    assert {o.detector for o in d4} == {"D4"}
    assert all("D4_spx" in o.uri for o in d4)


def test_un_plano_repetido_queda_una_sola_vez() -> None:
    filas = _filas()
    filas.append(dict(filas[0]))

    observaciones = observaciones_de_filas(filas, "D1", "https://irsa.ipac.caltech.edu/")

    assert len({o.planeid for o in observaciones}) == len(observaciones) == 6


def test_la_consulta_filtra_detector_y_fechas() -> None:
    adql = adql_de_observaciones(BARNARD, "D2", 61200.0, 61205.0)

    assert "p.energy_bandpassname = 'SPHEREx-D2'" in adql
    assert "p.time_bounds_lower >= 61200.000000" in adql
    assert "p.time_bounds_lower <= 61205.000000" in adql
    assert "CONTAINS(POINT('ICRS', 269.4486000, 4.7397000), p.poly)" in adql


def test_rechaza_un_detector_inexistente() -> None:
    with pytest.raises(ValueError):
        adql_de_observaciones(BARNARD, "D7")  # type: ignore[arg-type]


def test_la_segunda_busqueda_sale_de_la_cache(tmp_path: Path) -> None:
    pedidos: list[httpx2.Request] = []

    def responder(pedido: httpx2.Request) -> httpx2.Response:
        pedidos.append(pedido)
        return httpx2.Response(200, content=grabada("irsa-tap-barnard.xml"))

    configuracion = configuracion_de_prueba(tmp_path)
    cache = CacheEnDisco(tmp_path)
    momento = datetime(2026, 11, 8, 12, tzinfo=UTC)
    with httpx2.Client(transport=httpx2.MockTransport(responder)) as cliente:
        primera = buscar_observaciones(
            BARNARD,
            "D1",
            cliente=cliente,
            configuracion=configuracion,
            cache=cache,
            ahora=lambda: momento,
        )
        segunda = buscar_observaciones(
            BARNARD,
            "D1",
            cliente=cliente,
            configuracion=configuracion,
            cache=cache,
        )

    assert len(pedidos) == 1
    assert primera == segunda
    assert segunda.consultado_en == momento
    assert primera.observaciones[0].uri.startswith("https://irsa.prueba/ibe/")


@pytest.mark.red
def test_barnard_tiene_observaciones_de_al_menos_dos_pasadas(tmp_path: Path) -> None:
    configuracion = configuracion_desde_entorno({"SPHEREX_BLINK_CACHE": str(tmp_path)})
    with crear_cliente(120, 4) as cliente:
        resultado = buscar_observaciones(
            BARNARD,
            "D1",
            cliente=cliente,
            configuracion=configuracion,
            cache=CacheEnDisco(tmp_path),
        )

    assert len({pasada_de(o.mjd) for o in resultado.observaciones}) >= 2
