import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from contrato.indice import Indice
from pipeline.escritura import escribir_documento

EJEMPLO = Path(__file__).resolve().parents[2] / "contrato" / "ejemplos" / "indice.json"


def _indice() -> Indice:
    return Indice.model_validate_json(EJEMPLO.read_text(encoding="utf-8"))


def test_escribe_un_json_que_vuelve_a_leerse_igual(tmp_path: Path) -> None:
    indice = _indice()

    ruta = escribir_documento(indice, tmp_path / "datos" / "indice.json")

    assert Indice.model_validate_json(ruta.read_text(encoding="utf-8")) == indice


def test_dos_escrituras_dan_bytes_identicos_y_fin_de_linea_lf(tmp_path: Path) -> None:
    indice = _indice()

    primera = escribir_documento(indice, tmp_path / "a.json").read_bytes()
    segunda = escribir_documento(indice, tmp_path / "b.json").read_bytes()

    assert primera == segunda
    assert b"\r\n" not in primera
    assert json.loads(primera)["version_contrato"] == "0.3.0"


def test_no_escribe_un_documento_mutado_fuera_de_contrato(tmp_path: Path) -> None:
    indice = _indice()
    indice.version_contrato = "no-es-semver"

    with pytest.raises(ValidationError):
        escribir_documento(indice, tmp_path / "indice.json")

    assert not (tmp_path / "indice.json").exists()
