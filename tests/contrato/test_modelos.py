"""Reglas del contrato que no entran en el JSON Schema."""

import json
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from contrato.api import PedidoDeTrabajo, PedidoPorCoordenadas, PedidoPorNombre
from contrato.campo import Campo, Estiramiento

EJEMPLO = Path(__file__).resolve().parents[2] / "contrato" / "ejemplos" / "campo.json"


def _campo() -> dict[str, Any]:
    datos: dict[str, Any] = json.loads(EJEMPLO.read_text(encoding="utf-8"))
    return datos


def test_rechaza_epocas_fuera_de_orden_por_mjd() -> None:
    datos = _campo()
    datos["epocas"].reverse()

    with pytest.raises(ValidationError, match="ordenadas por mjd"):
        Campo.model_validate(datos)


def test_rechaza_ids_de_epoca_repetidos() -> None:
    datos = _campo()
    datos["epocas"][1]["id"] = datos["epocas"][0]["id"]

    with pytest.raises(ValidationError, match="mismo id"):
        Campo.model_validate(datos)


def test_rechaza_una_posicion_de_una_epoca_que_no_existe() -> None:
    datos = _campo()
    datos["conocidos"][0]["posiciones"][0]["epoca_id"] = "no-existe"

    with pytest.raises(ValidationError, match="no-existe"):
        Campo.model_validate(datos)


def test_rechaza_un_estiramiento_con_maximo_menor_o_igual_al_minimo() -> None:
    with pytest.raises(ValidationError, match="mayor que el mínimo"):
        Estiramiento(tipo="lineal", minimo=1.0, maximo=1.0)


@pytest.mark.parametrize(
    "cambio",
    [{"detector": "D7"}, {"centro": {"ra": 360.0, "dec": 0.0}}, {"tamano_grados": 0}],
)
def test_rechaza_valores_fuera_de_rango(cambio: dict[str, Any]) -> None:
    datos = _campo() | cambio

    with pytest.raises(ValidationError):
        Campo.model_validate(datos)


def test_un_pedido_de_trabajo_es_por_coordenadas_o_por_nombre() -> None:
    from pydantic import TypeAdapter

    adaptador: TypeAdapter[PedidoDeTrabajo] = TypeAdapter(PedidoDeTrabajo)

    por_coordenadas = adaptador.validate_python(
        {"ra": 10.0, "dec": -5.0, "tamano_grados": 0.1, "detector": "D1"}
    )
    por_nombre = adaptador.validate_python(
        {"nombre": "Makemake", "tamano_grados": 0.1, "detector": "D3"}
    )

    assert isinstance(por_coordenadas, PedidoPorCoordenadas)
    assert isinstance(por_nombre, PedidoPorNombre)
    with pytest.raises(ValidationError):
        adaptador.validate_python({"tamano_grados": 0.1, "detector": "D1"})


def test_rechaza_una_deteccion_de_una_epoca_que_no_existe() -> None:
    datos = _campo()
    datos["conocidos"][0]["deteccion"][0]["epoca_id"] = "no-existe"

    with pytest.raises(ValidationError, match="no-existe"):
        Campo.model_validate(datos)


def test_acepta_la_geometria_y_rechaza_una_epoca_que_no_existe() -> None:
    punto = {"epoca_id": "p1-a", "x_ua": -0.2, "y_ua": -0.99, "z_ua": 0.0}
    datos = _campo()
    datos["geometria"] = {
        "marco": "heliocentrico-ecliptico-J2000",
        "tierra": [punto],
        "objeto": {"nombre": "Makemake", "posiciones": [punto | {"x_ua": -45.0}]},
    }

    assert Campo.model_validate(datos).geometria is not None

    datos["geometria"]["tierra"][0]["epoca_id"] = "no-existe"
    with pytest.raises(ValidationError, match="no-existe"):
        Campo.model_validate(datos)


def test_rechaza_un_marco_de_referencia_desconocido() -> None:
    datos = _campo()
    datos["geometria"] = {
        "marco": "geocentrico",
        "tierra": [],
        "objeto": {"nombre": "X", "posiciones": []},
    }

    with pytest.raises(ValidationError):
        Campo.model_validate(datos)
