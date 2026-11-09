"""Búsqueda de las imágenes L2 de SPHEREx que cubren un campo (RF-01).

La consulta ADQL sobre `spherex.plane` + `spherex.artifact` sigue la del
tutorial «spherex_cutouts» de IRSA (Caltech-IPAC/irsa-tutorials,
Copyright (c) 2022-2026 California Institute of Technology, licencia
BSD-3-Clause). Se le agregan el planeid, la versión del proceso y un rango de
fechas opcional, para elegir una pasada.
"""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import get_args

import httpx2

from contrato.comunes import Coordenadas, Detector
from core.cache import CacheEnDisco
from core.configuracion import Configuracion
from core.epocas import Observacion
from core.tap import Fila, consultar_tap

SERVICIO = "IRSA TAP"
DETECTORES: tuple[Detector, ...] = get_args(Detector)


@dataclass(frozen=True)
class ResultadoDeBusqueda:
    observaciones: list[Observacion]
    consultado_en: datetime


def adql_de_observaciones(
    centro: Coordenadas,
    detector: Detector,
    mjd_desde: float | None = None,
    mjd_hasta: float | None = None,
) -> str:
    """Consulta de las imágenes cuyo polígono contiene el centro del campo.

    Una imagen L2 mide 3,5° de lado y los campos de la demo unos minutos de
    arco: si cubre el centro, cubre el campo salvo en el borde de la imagen,
    y ese caso lo descarta la descarga del recorte (RF-02, más de la mitad en
    NaN).
    """
    if detector not in DETECTORES:
        raise ValueError(f"detector inválido: {detector}")
    condiciones = [
        f"1 = CONTAINS(POINT('ICRS', {centro.ra:.7f}, {centro.dec:.7f}), p.poly)",
        f"p.energy_bandpassname = 'SPHEREx-{detector}'",
    ]
    if mjd_desde is not None:
        condiciones.append(f"p.time_bounds_lower >= {mjd_desde:.6f}")
    if mjd_hasta is not None:
        condiciones.append(f"p.time_bounds_lower <= {mjd_hasta:.6f}")
    return (
        "SELECT p.planeid, a.uri, p.time_bounds_lower, p.energy_bandpassname, "
        "p.provenance_version "
        "FROM spherex.artifact a JOIN spherex.plane p ON a.planeid = p.planeid "
        f"WHERE {' AND '.join(condiciones)} "
        "ORDER BY p.time_bounds_lower"
    )


def observaciones_de_filas(
    filas: list[Fila], detector: Detector, url_base: str
) -> list[Observacion]:
    """Convierte las filas de TAP en observaciones del detector pedido, por fecha.

    Se vuelve a filtrar el detector aunque la consulta ya lo haga: una
    respuesta inesperada no puede colar imágenes de otra longitud de onda. Si
    un mismo plano aparece dos veces (varios artefactos), queda uno.
    """
    vistas: set[str] = set()
    observaciones: list[Observacion] = []
    for fila in filas:
        banda = str(fila.get("energy_bandpassname") or "")
        uri = str(fila.get("uri") or "")
        planeid = str(fila.get("planeid") or "")
        if banda != f"SPHEREx-{detector}" or not uri.endswith(".fits") or planeid in vistas:
            continue
        vistas.add(planeid)
        absoluta = uri if uri.startswith("https://") else url_base.rstrip("/") + "/" + uri
        observaciones.append(
            Observacion(
                planeid=planeid,
                uri=absoluta,
                mjd=float(fila["time_bounds_lower"]),
                detector=detector,
                version_proceso=str(fila.get("provenance_version") or "desconocida"),
            )
        )
    return sorted(observaciones, key=lambda o: o.mjd)


def buscar_observaciones(
    centro: Coordenadas,
    detector: Detector,
    *,
    cliente: httpx2.Client,
    configuracion: Configuracion,
    cache: CacheEnDisco,
    mjd_desde: float | None = None,
    mjd_hasta: float | None = None,
    ahora: Callable[[], datetime] = lambda: datetime.now(UTC),
) -> ResultadoDeBusqueda:
    """Lista las imágenes L2 que cubren el campo, de la caché si ya se consultó.

    La respuesta se guarda con su fecha: así una segunda corrida usa las
    mismas épocas aunque IRSA haya publicado imágenes nuevas (RNF-12).
    """
    adql = adql_de_observaciones(centro, detector, mjd_desde, mjd_hasta)
    guardado = cache.leer_json("tap-irsa", adql)
    if guardado is None:
        filas = consultar_tap(
            cliente,
            configuracion.url_tap_irsa,
            adql,
            SERVICIO,
            reintentos=configuracion.reintentos,
            espera_s=configuracion.espera_entre_reintentos_s,
        )
        guardado = {"consultado_en": ahora().isoformat(), "filas": filas}
        cache.guardar_json("tap-irsa", adql, guardado)
    return ResultadoDeBusqueda(
        observaciones=observaciones_de_filas(
            guardado["filas"], detector, configuracion.url_base_irsa
        ),
        consultado_en=datetime.fromisoformat(guardado["consultado_en"]),
    )
