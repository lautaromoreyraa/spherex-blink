"""Estrellas fijas de Gaia DR3 para controlar la alineación (RF-04).

SIMBAD sólo tiene las estrellas citadas en la literatura: en un campo de 9′ a
latitud galáctica alta puede no haber ninguna con brillo útil. Gaia DR3 las
tiene todas, con movimiento propio, y IRSA la sirve por el mismo TAP que
SPHEREx (`gaia_dr3_source`).
"""

from collections.abc import Callable
from datetime import UTC, datetime

import httpx2

from contrato.comunes import Coordenadas
from core.cache import CacheEnDisco
from core.configuracion import Configuracion
from core.estrellas import EstrellaDeCatalogo
from core.tap import Fila, consultar_tap

SERVICIO = "IRSA TAP (Gaia DR3)"
EPOCA_DE_GAIA_DR3 = 2016.0


def adql_estrellas_de_gaia(
    centro: Coordenadas, radio_grados: float, magnitud_minima: float, magnitud_maxima: float
) -> str:
    return (
        "SELECT source_id, ra, dec, pmra, pmdec, parallax, radial_velocity, phot_g_mean_mag "
        "FROM gaia_dr3_source "
        f"WHERE 1 = CONTAINS(POINT('ICRS', ra, dec), "
        f"CIRCLE('ICRS', {centro.ra:.7f}, {centro.dec:.7f}, {radio_grados:.6f})) "
        f"AND phot_g_mean_mag BETWEEN {magnitud_minima:.2f} AND {magnitud_maxima:.2f} "
        "ORDER BY phot_g_mean_mag"
    )


def estrella_de_gaia(fila: Fila) -> EstrellaDeCatalogo:
    def opcional(clave: str) -> float | None:
        valor = fila.get(clave)
        return None if valor is None else float(valor)

    return EstrellaDeCatalogo(
        nombre=f"Gaia DR3 {fila['source_id']}",
        ra=float(fila["ra"]),
        dec=float(fila["dec"]),
        pmra_mas_anio=opcional("pmra"),
        pmdec_mas_anio=opcional("pmdec"),
        paralaje_mas=opcional("parallax"),
        velocidad_radial_km_s=opcional("radial_velocity"),
        magnitud=opcional("phot_g_mean_mag"),
        banda="G",
        epoca_juliana=EPOCA_DE_GAIA_DR3,
    )


def estrellas_de_gaia(
    centro: Coordenadas,
    radio_grados: float,
    magnitud_minima: float,
    magnitud_maxima: float,
    *,
    cliente: httpx2.Client,
    configuracion: Configuracion,
    cache: CacheEnDisco,
    ahora: Callable[[], datetime] = lambda: datetime.now(UTC),
) -> tuple[list[EstrellaDeCatalogo], datetime]:
    """Estrellas de Gaia DR3 en el círculo, de la más brillante a la más débil."""
    adql = adql_estrellas_de_gaia(centro, radio_grados, magnitud_minima, magnitud_maxima)
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
    estrellas = [estrella_de_gaia(f) for f in guardado["filas"]]
    estrellas.sort(key=lambda e: (e.magnitud if e.magnitud is not None else 99.0, e.nombre))
    return estrellas, datetime.fromisoformat(guardado["consultado_en"])
