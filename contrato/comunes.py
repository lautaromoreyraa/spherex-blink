"""Tipos que comparten el índice, el campo y la API."""

from typing import Annotated, Literal

from pydantic import Field

from contrato.base import ModeloDelContrato

Detector = Literal["D1", "D2", "D3", "D4", "D5", "D6"]
"""Detector de SPHEREx (D1 a D6, de 0,75 a 5,0 µm)."""

IdentificadorKebab = Annotated[
    str,
    Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$", description="Identificador en kebab-case"),
]

RutaRelativa = Annotated[
    str,
    Field(
        min_length=1,
        description="Ruta relativa a web/public/datos/ (o servida por la API en el modo en vivo)",
    ),
]

AscensionRecta = Annotated[float, Field(ge=0, lt=360, description="Ascensión recta ICRS en grados")]
Declinacion = Annotated[float, Field(ge=-90, le=90, description="Declinación ICRS en grados")]
TamanoEnGrados = Annotated[float, Field(gt=0, description="Lado del campo en grados")]


class TextoTraducido(ModeloDelContrato):
    """Texto en los dos idiomas de la interfaz (RNF-06)."""

    es: str = Field(min_length=1)
    en: str = Field(min_length=1)


class Coordenadas(ModeloDelContrato):
    """Punto del cielo en grados ICRS."""

    ra: AscensionRecta
    dec: Declinacion
