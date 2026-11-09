"""Entradas y salidas propias de la API del modo en vivo (SRS 4.3).

`GET /campos` y `GET /campos/{id}` devuelven `Indice` y `Campo`, y
`GET /conocidos` una lista de `ObjetoConocido`: la API no tiene formas
propias para eso, usa las mismas que la capa estática.
"""

from typing import Literal

from pydantic import Field

from contrato.base import ModeloDelContrato
from contrato.campo import Campo
from contrato.comunes import AscensionRecta, Declinacion, Detector, TamanoEnGrados

EstadoDeTrabajo = Literal["pendiente", "en-curso", "parcial", "listo", "error"]


class Salud(ModeloDelContrato):
    """Respuesta de `GET /salud`."""

    estado: Literal["ok"]
    version: str = Field(min_length=1)


class ErrorDeApi(ModeloDelContrato):
    """Cuerpo de toda respuesta de error."""

    codigo: str = Field(min_length=1)
    mensaje: str = Field(min_length=1)


class PedidoPorCoordenadas(ModeloDelContrato):
    """`POST /trabajos` con el centro del campo."""

    ra: AscensionRecta
    dec: Declinacion
    tamano_grados: TamanoEnGrados
    detector: Detector


class PedidoPorNombre(ModeloDelContrato):
    """`POST /trabajos` con el nombre de un objeto."""

    nombre: str = Field(min_length=1)
    tamano_grados: TamanoEnGrados
    detector: Detector


PedidoDeTrabajo = PedidoPorCoordenadas | PedidoPorNombre


class TrabajoCreado(ModeloDelContrato):
    """Respuesta de `POST /trabajos`."""

    trabajo_id: str = Field(min_length=1)


class Trabajo(ModeloDelContrato):
    """Respuesta de `GET /trabajos/{trabajo_id}`."""

    estado: EstadoDeTrabajo
    progreso: float = Field(ge=0, le=1)
    epocas_listas: int = Field(ge=0)
    epocas_totales: int = Field(ge=0)
    errores: list[ErrorDeApi]
    campo: Campo | None
