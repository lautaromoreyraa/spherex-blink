"""Consultas ADQL a servicios TAP (IRSA y SIMBAD) por el endpoint síncrono.

Se pide VOTable y se lo convierte en filas de tipos de Python: así el
resultado se guarda en la caché como JSON y los tests usan respuestas
grabadas sin depender de pyvo.
"""

import io
import math
import time
import warnings
from collections.abc import Callable
from typing import Any

import httpx2
import numpy as np
from astropy.io.votable import parse
from astropy.io.votable.exceptions import VOWarning

from core.red import ServicioExternoError, pedir

Fila = dict[str, Any]


def filas_de_votable(contenido: bytes, servicio: str) -> list[Fila]:
    """Filas de la primera tabla de un VOTable; los valores vacíos quedan en None."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", VOWarning)
        documento = parse(io.BytesIO(contenido))
    for recurso in documento.resources:
        for info in recurso.infos:
            if info.name == "QUERY_STATUS" and info.value == "ERROR":
                raise ServicioExternoError(servicio, f"consulta rechazada: {info.content}")
    try:
        tabla = documento.get_first_table().to_table(use_names_over_ids=True)
    except IndexError as error:
        raise ServicioExternoError(servicio, "la respuesta no trae ninguna tabla") from error
    filas: list[Fila] = []
    for fila in tabla:
        filas.append({nombre: _a_python(fila[nombre]) for nombre in tabla.colnames})
    return filas


def _a_python(valor: Any) -> Any:
    if valor is np.ma.masked:
        return None
    if isinstance(valor, bytes):
        return valor.decode("utf-8")
    if isinstance(valor, np.generic):
        valor = valor.item()
    if isinstance(valor, float) and math.isnan(valor):
        return None
    return valor


def consultar_tap(
    cliente: httpx2.Client,
    url: str,
    adql: str,
    servicio: str,
    *,
    reintentos: int = 3,
    espera_s: float = 2.0,
    dormir: Callable[[float], None] = time.sleep,
) -> list[Fila]:
    """Corre una consulta ADQL y devuelve sus filas."""
    respuesta = pedir(
        cliente,
        servicio,
        url,
        datos={"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "votable", "QUERY": adql},
        reintentos=reintentos,
        espera_s=espera_s,
        dormir=dormir,
    )
    return filas_de_votable(respuesta.content, servicio)
