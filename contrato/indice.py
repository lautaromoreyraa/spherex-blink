"""Forma de `indice.json`: la lista de campos de la demo (SRS 4.2)."""

from datetime import datetime

from pydantic import Field

from contrato.base import ModeloDelContrato
from contrato.comunes import (
    Coordenadas,
    Detector,
    IdentificadorKebab,
    RutaRelativa,
    TamanoEnGrados,
    TextoTraducido,
)

PATRON_SEMVER = r"^\d+\.\d+\.\d+$"


class ResumenDeCampo(ModeloDelContrato):
    """Lo que la página de inicio necesita para listar un campo."""

    id: IdentificadorKebab
    nombre: TextoTraducido
    centro: Coordenadas
    tamano_grados: TamanoEnGrados
    detector: Detector
    cantidad_epocas: int = Field(ge=0, description="Épocas incluidas en el campo")
    objeto_destacado: str | None = Field(description="Lo que hay que mirar en el campo")
    miniatura: RutaRelativa


class Indice(ModeloDelContrato):
    """Raíz de `indice.json`."""

    version_contrato: str = Field(
        pattern=PATRON_SEMVER, description="Versión del contrato con que se generó"
    )
    generado_en: datetime = Field(description="Cuándo corrió el pipeline (UTC)")
    campos: list[ResumenDeCampo]
