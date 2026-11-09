"""Respuestas grabadas y configuración de prueba para los tests sin red."""

import json
from pathlib import Path
from typing import Any

from core.configuracion import Configuracion

GRABADAS = Path(__file__).resolve().parent / "grabadas"


def grabada(nombre: str) -> bytes:
    return (GRABADAS / nombre).read_bytes()


def grabada_json(nombre: str) -> Any:
    return json.loads(grabada(nombre).decode("utf-8"))


def configuracion_de_prueba(cache: Path, pedidos_simultaneos: int = 4) -> Configuracion:
    """Configuración que apunta a servidores ficticios y no espera entre reintentos."""
    return Configuracion(
        url_tap_irsa="https://irsa.prueba/TAP/sync",
        url_base_irsa="https://irsa.prueba/",
        urls_tap_simbad=("https://simbad.prueba/sync",),
        url_horizons="https://horizons.prueba/api",
        directorio_cache=cache,
        pedidos_simultaneos=pedidos_simultaneos,
        reintentos=3,
        espera_entre_reintentos_s=0.0,
        tiempo_maximo_s=5.0,
    )


def votable(columnas: list[tuple[str, str]], filas: list[list[Any]]) -> bytes:
    """Un VOTable mínimo como el que devuelve un TAP síncrono."""
    campos = "".join(
        f'<FIELD name="{nombre}" datatype="{tipo}"'
        + (' arraysize="*"' if tipo == "char" else "")
        + "/>"
        for nombre, tipo in columnas
    )
    cuerpo = "".join(
        "<TR>" + "".join(f"<TD>{'' if v is None else v}</TD>" for v in fila) + "</TR>"
        for fila in filas
    )
    return (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<VOTABLE version="1.3" xmlns="http://www.ivoa.net/xml/VOTable/v1.3">'
        '<RESOURCE type="results"><INFO name="QUERY_STATUS" value="OK"/>'
        f"<TABLE>{campos}<DATA><TABLEDATA>{cuerpo}</TABLEDATA></DATA></TABLE>"
        "</RESOURCE></VOTABLE>"
    ).encode()
