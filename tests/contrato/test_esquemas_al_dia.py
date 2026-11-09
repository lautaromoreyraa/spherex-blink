"""Los schemas versionados coinciden con los modelos.

La CI además regenera los tipos TS y compara con git; este test da el mismo
aviso sin necesitar Node, al correr pytest en la PC.
"""

from pathlib import Path

import pytest

from contrato.generar import escribir_esquemas

VERSIONADOS = Path(__file__).resolve().parents[2] / "contrato" / "esquemas"


@pytest.mark.parametrize(
    "nombre", ["indice.schema.json", "campo.schema.json", "contrato.schema.json"]
)
def test_el_schema_versionado_esta_al_dia(nombre: str, tmp_path: Path) -> None:
    escribir_esquemas(tmp_path)

    generado = (tmp_path / nombre).read_bytes()
    versionado = (VERSIONADOS / nombre).read_bytes().replace(b"\r\n", b"\n")

    assert generado == versionado, "correr `python -m contrato.generar` y versionar el resultado"
