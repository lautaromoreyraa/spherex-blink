"""Los ejemplos hechos a mano validan contra el schema generado (TAR-03)."""

import json
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator

from contrato.campo import Campo
from contrato.indice import Indice

RAIZ = Path(__file__).resolve().parents[2] / "contrato"


def _leer(ruta: Path) -> Any:
    return json.loads(ruta.read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    ("ejemplo", "esquema"),
    [("indice.json", "indice.schema.json"), ("campo.json", "campo.schema.json")],
)
def test_el_ejemplo_valida_contra_el_schema_versionado(ejemplo: str, esquema: str) -> None:
    validador = Draft202012Validator(
        _leer(RAIZ / "esquemas" / esquema), format_checker=Draft202012Validator.FORMAT_CHECKER
    )

    errores = [e.message for e in validador.iter_errors(_leer(RAIZ / "ejemplos" / ejemplo))]

    assert errores == []


def test_los_ejemplos_validan_contra_los_modelos() -> None:
    Indice.model_validate(_leer(RAIZ / "ejemplos" / "indice.json"))
    Campo.model_validate(_leer(RAIZ / "ejemplos" / "campo.json"))


def test_el_schema_rechaza_un_campo_no_declarado() -> None:
    validador = Draft202012Validator(_leer(RAIZ / "esquemas" / "indice.schema.json"))
    indice = _leer(RAIZ / "ejemplos" / "indice.json")
    indice["campos"][0]["tamaño_grados"] = 1

    assert not validador.is_valid(indice)
