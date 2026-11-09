from fastapi.testclient import TestClient

from api.app import crear_app
from contrato.api import Salud


def test_get_salud_devuelve_200_con_el_contrato() -> None:
    cliente = TestClient(crear_app())

    respuesta = cliente.get("/salud")

    assert respuesta.status_code == 200
    salud = Salud.model_validate(respuesta.json())
    assert salud.estado == "ok"


def test_una_ruta_inexistente_devuelve_404() -> None:
    cliente = TestClient(crear_app())

    assert cliente.get("/no-existe").status_code == 404
