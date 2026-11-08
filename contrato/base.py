"""Base común de los modelos del contrato."""

from pydantic import BaseModel, ConfigDict


class ModeloDelContrato(BaseModel):
    """Modelo base: rechaza campos que el contrato no declara.

    Con `extra="forbid"` un error de tipeo en el pipeline (`tamaño_grados`
    en vez de `tamano_grados`) falla al validar en vez de pasar callado y
    romper la web más tarde.
    """

    model_config = ConfigDict(extra="forbid")
