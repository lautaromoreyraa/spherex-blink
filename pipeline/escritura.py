"""Escritura de los documentos del contrato en disco."""

from pathlib import Path

from contrato.campo import Campo
from contrato.indice import Indice


def escribir_documento(documento: Indice | Campo, ruta: Path) -> Path:
    """Valida y escribe `indice.json` o `campo.json` con formato estable.

    Se vuelve a validar antes de escribir porque un modelo de Pydantic se puede
    mutar después de construido; así nada fuera de contrato llega al disco.
    El formato fijo (indentación, UTF-8, fin de línea LF) hace que dos corridas
    con los mismos datos den archivos idénticos (RNF-12).
    """
    validado = type(documento).model_validate(documento.model_dump())
    ruta.parent.mkdir(parents=True, exist_ok=True)
    texto = validado.model_dump_json(indent=2) + "\n"
    ruta.write_text(texto, encoding="utf-8", newline="\n")
    return ruta
