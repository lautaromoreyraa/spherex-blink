"""Consultas a SIMBAD con caché, probando los servidores en orden.

La respuesta se guarda con la fecha de la consulta: con la caché llena, el
pipeline vuelve a escribir el mismo `consultado_en` (RNF-12).
"""

from collections.abc import Callable
from datetime import UTC, datetime

import httpx2

from core.cache import CacheEnDisco
from core.configuracion import Configuracion
from core.red import ServicioExternoError
from core.tap import Fila, consultar_tap

SERVICIO = "SIMBAD"


def consultar_simbad(
    adql: str,
    *,
    cliente: httpx2.Client,
    configuracion: Configuracion,
    cache: CacheEnDisco,
    ahora: Callable[[], datetime] = lambda: datetime.now(UTC),
) -> tuple[list[Fila], datetime]:
    """Filas de una consulta ADQL a SIMBAD y cuándo se hizo."""
    guardado = cache.leer_json("simbad", adql)
    if guardado is None:
        errores: list[str] = []
        for url in configuracion.urls_tap_simbad:
            try:
                filas = consultar_tap(
                    cliente,
                    url,
                    adql,
                    SERVICIO,
                    reintentos=1,
                    espera_s=configuracion.espera_entre_reintentos_s,
                )
            except ServicioExternoError as error:
                errores.append(f"{url}: {error.motivo}")
                continue
            guardado = {"consultado_en": ahora().isoformat(), "filas": filas}
            cache.guardar_json("simbad", adql, guardado)
            break
        else:
            raise ServicioExternoError(
                SERVICIO, "ningún servidor respondió (" + "; ".join(errores) + ")"
            )
    return guardado["filas"], datetime.fromisoformat(guardado["consultado_en"])
