"""RF-02: descarga de recortes con reintentos, tope de concurrencia, caché y estado parcial."""

import threading
import time
from pathlib import Path

import httpx2
import numpy as np
import pytest

from contrato.comunes import Coordenadas
from core.cache import CacheEnDisco
from core.configuracion import MAXIMO_DE_PEDIDOS_SIMULTANEOS, configuracion_desde_entorno
from core.epocas import Observacion
from core.recortes import Recorte, bajar_recortes, url_de_recorte
from tests.fixture.servicios import configuracion_de_prueba
from tests.fixture.sinteticos import longitud_de_onda_esperada, mef_sintetico

CENTRO = Coordenadas(ra=200.0, dec=20.0)


def _obs(i: int) -> Observacion:
    return Observacion(
        planeid=f"plano-{i}",
        uri=f"https://irsa.prueba/ibe/{i}.fits",
        mjd=61200.0 + i,
        detector="D1",
        version_proceso="1",
    )


def _bajar(
    tmp_path: Path,
    observaciones: list[Observacion],
    responder: httpx2.MockTransport,
    pedidos_simultaneos: int = 4,
) -> tuple[list[Recorte], list[str]]:
    configuracion = configuracion_de_prueba(tmp_path / "cache", pedidos_simultaneos)
    with httpx2.Client(transport=responder) as cliente:
        recortes, fallas = bajar_recortes(
            observaciones,
            CENTRO,
            0.05,
            cliente=cliente,
            cache=CacheEnDisco(tmp_path / "cache"),
            configuracion=configuracion,
            dormir=lambda _s: None,
        )
    return recortes, [f.motivo for f in fallas]


def test_la_url_pide_el_recorte_centrado() -> None:
    url = url_de_recorte("https://irsa/a.fits", CENTRO, 0.1)

    assert url == "https://irsa/a.fits?center=200.0000000,20.0000000d&size=0.100000d"


def test_reintenta_ante_503_y_obtiene_el_recorte(tmp_path: Path) -> None:
    intentos = 0

    def responder(_pedido: httpx2.Request) -> httpx2.Response:
        nonlocal intentos
        intentos += 1
        if intentos <= 2:
            return httpx2.Response(503)
        return httpx2.Response(200, content=mef_sintetico(CENTRO.ra, CENTRO.dec))

    recortes, fallas = _bajar(tmp_path, [_obs(0)], httpx2.MockTransport(responder))

    assert intentos == 3
    assert fallas == []
    assert len(recortes) == 1
    assert recortes[0].longitud_onda_um == pytest.approx(longitud_de_onda_esperada(20), abs=0.002)


def test_una_observacion_que_falla_siempre_no_tumba_el_campo(tmp_path: Path) -> None:
    def responder(pedido: httpx2.Request) -> httpx2.Response:
        if "/1.fits" in str(pedido.url):
            raise httpx2.ConnectError("conexión cortada", request=pedido)
        return httpx2.Response(200, content=mef_sintetico(CENTRO.ra, CENTRO.dec))

    recortes, fallas = _bajar(
        tmp_path, [_obs(0), _obs(1), _obs(2)], httpx2.MockTransport(responder)
    )

    assert [r.observacion.planeid for r in recortes] == ["plano-0", "plano-2"]
    assert len(fallas) == 1
    assert "falla de red" in fallas[0]


def test_nunca_hay_mas_de_12_pedidos_simultaneos(tmp_path: Path) -> None:
    candado = threading.Lock()
    en_curso = 0
    maximo = 0

    def responder(_pedido: httpx2.Request) -> httpx2.Response:
        nonlocal en_curso, maximo
        with candado:
            en_curso += 1
            maximo = max(maximo, en_curso)
        time.sleep(0.05)
        with candado:
            en_curso -= 1
        return httpx2.Response(200, content=mef_sintetico(CENTRO.ra, CENTRO.dec))

    recortes, _ = _bajar(
        tmp_path,
        [_obs(i) for i in range(30)],
        httpx2.MockTransport(responder),
        pedidos_simultaneos=MAXIMO_DE_PEDIDOS_SIMULTANEOS,
    )

    assert len(recortes) == 30
    assert 1 < maximo <= MAXIMO_DE_PEDIDOS_SIMULTANEOS


def test_la_configuracion_no_deja_pasar_el_tope() -> None:
    with pytest.raises(ValueError):
        configuracion_desde_entorno({"SPHEREX_BLINK_PEDIDOS_SIMULTANEOS": "13"})


def test_la_segunda_corrida_no_sale_a_la_red(tmp_path: Path) -> None:
    pedidos = 0

    def responder(_pedido: httpx2.Request) -> httpx2.Response:
        nonlocal pedidos
        pedidos += 1
        return httpx2.Response(200, content=mef_sintetico(CENTRO.ra, CENTRO.dec))

    transporte = httpx2.MockTransport(responder)
    primera, _ = _bajar(tmp_path, [_obs(0), _obs(1)], transporte)
    pedidos_de_la_primera = pedidos
    segunda, _ = _bajar(tmp_path, [_obs(0), _obs(1)], transporte)

    assert pedidos_de_la_primera == 2
    assert pedidos == 2
    assert np.array_equal(primera[0].imagen, segunda[0].imagen)


def test_un_recorte_fuera_de_la_imagen_se_descarta_con_aviso(tmp_path: Path) -> None:
    def responder(pedido: httpx2.Request) -> httpx2.Response:
        if "/0.fits" in str(pedido.url):
            return httpx2.Response(500)
        return httpx2.Response(200, content=mef_sintetico(CENTRO.ra, CENTRO.dec, fraccion_nan=0.6))

    recortes, fallas = _bajar(tmp_path, [_obs(0), _obs(1)], httpx2.MockTransport(responder))

    assert recortes == []
    assert "no se superpone" in fallas[0]
    assert "NaN" in fallas[1]


def test_un_500_no_se_reintenta(tmp_path: Path) -> None:
    pedidos = 0

    def responder(_pedido: httpx2.Request) -> httpx2.Response:
        nonlocal pedidos
        pedidos += 1
        return httpx2.Response(500)

    _bajar(tmp_path, [_obs(0)], httpx2.MockTransport(responder))

    assert pedidos == 1
