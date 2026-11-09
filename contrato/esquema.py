"""Exportación de los modelos del contrato a JSON Schema."""

import json
from typing import Any

from pydantic import BaseModel, TypeAdapter
from pydantic.json_schema import GenerateJsonSchema, JsonSchemaMode, models_json_schema
from pydantic_core import CoreSchema

from contrato import VERSION_CONTRATO
from contrato.api import (
    ErrorDeApi,
    PedidoDeTrabajo,
    PedidoPorCoordenadas,
    PedidoPorNombre,
    Salud,
    Trabajo,
    TrabajoCreado,
)
from contrato.campo import Campo
from contrato.indice import Indice

DIALECTO = "https://json-schema.org/draft/2020-12/schema"


class GeneradorSinTitulosDeCampo(GenerateJsonSchema):
    """Omite el `title` de cada propiedad.

    json-schema-to-typescript convierte cada propiedad con título en un alias
    de tipo propio (`export type Ra = number`); sin títulos, los tipos TS
    quedan como interfaces limpias con el nombre de cada modelo.
    """

    def field_title_should_be_set(self, schema: CoreSchema) -> bool:
        return False


# Los modelos que forman la raíz de cada documento o respuesta. Todo lo que
# cuelga de ellos entra solo en las definiciones.
MODELOS_RAIZ: tuple[type[BaseModel], ...] = (
    Indice,
    Campo,
    Salud,
    ErrorDeApi,
    PedidoPorCoordenadas,
    PedidoPorNombre,
    TrabajoCreado,
    Trabajo,
)


def esquema_de(modelo: type[BaseModel]) -> dict[str, Any]:
    """JSON Schema de un documento, para validar los archivos que lo usan."""
    esquema = modelo.model_json_schema(schema_generator=GeneradorSinTitulosDeCampo)
    return {"$schema": DIALECTO, "$comment": f"contrato {VERSION_CONTRATO}", **esquema}


def esquema_del_contrato() -> dict[str, Any]:
    """Un único schema con todos los modelos en `$defs`, para generar los tipos TS."""
    modo: JsonSchemaMode = "validation"
    _, definiciones = models_json_schema(
        [(modelo, modo) for modelo in MODELOS_RAIZ],
        schema_generator=GeneradorSinTitulosDeCampo,
    )
    pedido = TypeAdapter(PedidoDeTrabajo).json_schema(
        schema_generator=GeneradorSinTitulosDeCampo, ref_template="#/$defs/{model}"
    )
    pedido.pop("$defs", None)
    defs = dict(definiciones["$defs"])
    defs["PedidoDeTrabajo"] = {"title": "PedidoDeTrabajo", **pedido}
    return {
        "$schema": DIALECTO,
        "$comment": f"contrato {VERSION_CONTRATO}",
        "title": "Contrato",
        "$defs": dict(sorted(defs.items())),
    }


def a_texto(esquema: dict[str, Any]) -> str:
    """Serialización estable: la CI compara este texto con el versionado."""
    return json.dumps(esquema, ensure_ascii=False, indent=2) + "\n"
