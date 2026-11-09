"""Pedidos con reintentos."""

import httpx2
import pytest

from core.red import ServicioExternoError, pedir


def _cliente(codigos: list[int]) -> tuple[httpx2.Client, list[int]]:
    vistos: list[int] = []

    def responder(_pedido: httpx2.Request) -> httpx2.Response:
        codigo = codigos[min(len(vistos), len(codigos) - 1)]
        vistos.append(codigo)
        return httpx2.Response(codigo)

    return httpx2.Client(transport=httpx2.MockTransport(responder)), vistos


def test_reintenta_lo_transitorio_con_espera_creciente() -> None:
    cliente, vistos = _cliente([503, 504, 200])
    esperas: list[float] = []

    respuesta = pedir(cliente, "x", "https://x.prueba/", espera_s=1.0, dormir=esperas.append)

    assert respuesta.status_code == 200
    assert vistos == [503, 504, 200]
    assert esperas == [1.0, 2.0]


def test_no_reintenta_un_404() -> None:
    cliente, vistos = _cliente([404])

    with pytest.raises(ServicioExternoError) as error:
        pedir(cliente, "x", "https://x.prueba/", dormir=lambda _s: None)

    assert vistos == [404]
    assert error.value.codigo_http == 404


def test_se_rinde_despues_de_los_reintentos() -> None:
    cliente, vistos = _cliente([503])

    with pytest.raises(ServicioExternoError, match="HTTP 503"):
        pedir(cliente, "x", "https://x.prueba/", reintentos=2, dormir=lambda _s: None)

    assert len(vistos) == 3
