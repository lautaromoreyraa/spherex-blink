"""Efemérides y vectores de JPL Horizons (RF-32, geometría de RF-34 y RF-35).

Se usa la API de Horizons directamente: dos consultas por campo, una tabla de
observador (dónde se ve el cuerpo desde la Tierra en cada época) y una de
vectores (dónde están el cuerpo y la Tierra respecto del Sol). Las respuestas
se guardan en la caché con su fecha.

Las posiciones se piden para el geocentro: SPHEREx orbita a unos 700 km de
altura y, para un cuerpo a 50 UA, la diferencia es de 0,2″, treinta veces
menos que un píxel.
"""

import csv
import io
import json
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

import httpx2

from core.cache import CacheEnDisco
from core.configuracion import Configuracion
from core.red import ServicioExternoError, pedir

SERVICIO = "JPL Horizons"
GEOCENTRO = "500@399"
CENTRO_DEL_SOL = "500@10"
TIERRA = "399"
DIFERENCIA_MJD_A_JD = 2400000.5


@dataclass(frozen=True)
class PosicionDeEfemeride:
    mjd: float
    ra: float
    dec: float
    distancia_ua: float
    """Distancia al observador (delta)."""


@dataclass(frozen=True)
class Vector:
    mjd: float
    x_ua: float
    y_ua: float
    z_ua: float


def _lista_de_tiempos(mjds: Sequence[float]) -> str:
    return " ".join(f"'{mjd + DIFERENCIA_MJD_A_JD:.9f}'" for mjd in mjds)


def parametros_de_observador(comando: str, mjds: Sequence[float]) -> dict[str, str]:
    return {
        "format": "json",
        "COMMAND": f"'{comando}'",
        "OBJ_DATA": "NO",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "OBSERVER",
        "CENTER": f"'{GEOCENTRO}'",
        "TLIST": _lista_de_tiempos(mjds),
        "TLIST_TYPE": "JD",
        "TIME_TYPE": "UT",
        "QUANTITIES": "'1,20'",
        "ANG_FORMAT": "DEG",
        "CSV_FORMAT": "YES",
        "EXTRA_PREC": "YES",
    }


def parametros_de_vectores(comando: str, mjds: Sequence[float]) -> dict[str, str]:
    return {
        "format": "json",
        "COMMAND": f"'{comando}'",
        "OBJ_DATA": "NO",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "CENTER": f"'{CENTRO_DEL_SOL}'",
        "REF_PLANE": "ECLIPTIC",
        "REF_SYSTEM": "ICRF",
        "VEC_TABLE": "1",
        "OUT_UNITS": "AU-D",
        "TLIST": _lista_de_tiempos(mjds),
        "TLIST_TYPE": "JD",
        "TIME_TYPE": "UT",
        "CSV_FORMAT": "YES",
    }


def filas_de_horizons(texto: str) -> list[list[str]]:
    """Las filas CSV entre $$SOE y $$EOE, sin las columnas vacías del final."""
    if "$$SOE" not in texto or "$$EOE" not in texto:
        resumen = texto.strip().splitlines()[-1] if texto.strip() else "respuesta vacía"
        raise ServicioExternoError(SERVICIO, f"la respuesta no trae efemérides ({resumen})")
    bloque = texto.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    filas = []
    for fila in csv.reader(io.StringIO(bloque.strip())):
        celdas = [c.strip() for c in fila]
        while celdas and celdas[-1] == "":
            celdas.pop()
        if celdas:
            filas.append(celdas)
    return filas


def efemeride_de_texto(texto: str, mjds: Sequence[float]) -> list[PosicionDeEfemeride]:
    """Tabla de observador: fecha, (solar), (lunar), RA, Dec, delta, deldot."""
    filas = filas_de_horizons(texto)
    if len(filas) != len(mjds):
        raise ServicioExternoError(
            SERVICIO, f"se pidieron {len(mjds)} fechas y llegaron {len(filas)}"
        )
    return [
        PosicionDeEfemeride(mjd=mjd, ra=float(f[3]), dec=float(f[4]), distancia_ua=float(f[5]))
        for mjd, f in zip(mjds, filas, strict=True)
    ]


def vectores_de_texto(texto: str, mjds: Sequence[float]) -> list[Vector]:
    """Tabla de vectores: JD, fecha, X, Y, Z (UA)."""
    filas = filas_de_horizons(texto)
    if len(filas) != len(mjds):
        raise ServicioExternoError(
            SERVICIO, f"se pidieron {len(mjds)} fechas y llegaron {len(filas)}"
        )
    return [
        Vector(mjd=mjd, x_ua=float(f[2]), y_ua=float(f[3]), z_ua=float(f[4]))
        for mjd, f in zip(mjds, filas, strict=True)
    ]


class Horizons:
    """Cliente de Horizons con caché; recuerda la fecha de la primera consulta."""

    def __init__(
        self,
        *,
        cliente: httpx2.Client,
        configuracion: Configuracion,
        cache: CacheEnDisco,
        ahora: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._cliente = cliente
        self._configuracion = configuracion
        self._cache = cache
        self._ahora = ahora
        self.consultado_en: datetime | None = None

    def _texto(self, parametros: dict[str, str]) -> str:
        clave = json.dumps(parametros, sort_keys=True)
        guardado = self._cache.leer_json("horizons", clave)
        if guardado is None:
            respuesta = pedir(
                self._cliente,
                SERVICIO,
                self._configuracion.url_horizons,
                params=parametros,
                reintentos=self._configuracion.reintentos,
                espera_s=self._configuracion.espera_entre_reintentos_s,
            )
            cuerpo = respuesta.json()
            if "result" not in cuerpo:
                raise ServicioExternoError(
                    SERVICIO, str(cuerpo.get("error", "respuesta sin resultado"))
                )
            guardado = {"consultado_en": self._ahora().isoformat(), "texto": cuerpo["result"]}
            self._cache.guardar_json("horizons", clave, guardado)
        consultado = datetime.fromisoformat(guardado["consultado_en"])
        if self.consultado_en is None or consultado < self.consultado_en:
            self.consultado_en = consultado
        return str(guardado["texto"])

    def efemeride(self, comando: str, mjds: Sequence[float]) -> list[PosicionDeEfemeride]:
        return efemeride_de_texto(self._texto(parametros_de_observador(comando, mjds)), mjds)

    def vectores(self, comando: str, mjds: Sequence[float]) -> list[Vector]:
        return vectores_de_texto(self._texto(parametros_de_vectores(comando, mjds)), mjds)
