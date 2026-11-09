"""Estrellas de catálogo en la fecha de cada época (RF-08).

SIMBAD da la posición en la época J2000 (Gaia DR3, en J2016.0) junto con el
movimiento propio, la paralaje y la velocidad radial; `SkyCoord.apply_space_motion` de astropy la
lleva a la fecha de cada exposición. La Estrella de Barnard se corre 10,4″ por
año, casi dos píxeles de SPHEREx.
"""

import warnings
from dataclasses import dataclass

import astropy.units as u
from astropy.coordinates import Distance, SkyCoord
from astropy.time import Time
from erfa import ErfaWarning

from contrato.comunes import Coordenadas
from core.tap import Fila

EPOCA_DE_SIMBAD = 2000.0
"""SIMBAD da las coordenadas en la época J2000; Gaia DR3, en J2016.0."""

DISTANCIA_SIN_PARALAJE = Distance(1e6, u.pc)
"""Para una estrella sin paralaje medida: tan lejos que sólo cuenta el
movimiento propio, que es lo que importa a esta escala."""


@dataclass(frozen=True)
class EstrellaDeCatalogo:
    nombre: str
    ra: float
    """Grados ICRS en la época J2000."""
    dec: float
    pmra_mas_anio: float | None
    """Movimiento propio en RA·cos(Dec)."""
    pmdec_mas_anio: float | None
    paralaje_mas: float | None
    velocidad_radial_km_s: float | None
    magnitud: float | None
    banda: str
    """Banda de `magnitud` (J de 2MASS, G de Gaia…)."""
    epoca_juliana: float = EPOCA_DE_SIMBAD
    """Año juliano de la posición de catálogo."""

    @property
    def tiene_movimiento_propio(self) -> bool:
        return self.pmra_mas_anio is not None and self.pmdec_mas_anio is not None


COLUMNAS = (
    "b.main_id, b.ra, b.dec, b.pmra, b.pmdec, b.plx_value, b.rvz_radvel, "
    "f.flux AS magnitud, f.filter AS banda"
)
BANDAS = ("J", "G")


def adql_estrella_por_nombre(identificador: str, banda: str = "J") -> str:
    if banda not in BANDAS:
        raise ValueError(f"banda no prevista: {banda}")
    seguro = identificador.replace("'", "''")
    return (
        f"SELECT {COLUMNAS} FROM basic AS b JOIN ident AS i ON i.oidref = b.oid "
        f"LEFT JOIN flux AS f ON f.oidref = b.oid AND f.filter = '{banda}' "
        f"WHERE i.id = '{seguro}'"
    )


def adql_estrellas_en_la_region(
    centro: Coordenadas, radio_grados: float, banda: str, magnitud_maxima: float
) -> str:
    if banda not in BANDAS:
        raise ValueError(f"banda no prevista: {banda}")
    return (
        f"SELECT {COLUMNAS} FROM basic AS b "
        f"JOIN flux AS f ON f.oidref = b.oid AND f.filter = '{banda}' "
        f"WHERE 1 = CONTAINS(POINT('ICRS', b.ra, b.dec), "
        f"CIRCLE('ICRS', {centro.ra:.7f}, {centro.dec:.7f}, {radio_grados:.6f})) "
        f"AND f.flux < {magnitud_maxima:.2f} "
        "ORDER BY magnitud"
    )


def estrella_de_fila(fila: Fila) -> EstrellaDeCatalogo:
    def opcional(clave: str) -> float | None:
        valor = fila.get(clave)
        return None if valor is None else float(valor)

    nombre = str(fila["main_id"]).removeprefix("NAME ").strip()
    return EstrellaDeCatalogo(
        nombre=nombre,
        ra=float(fila["ra"]),
        dec=float(fila["dec"]),
        pmra_mas_anio=opcional("pmra"),
        pmdec_mas_anio=opcional("pmdec"),
        paralaje_mas=opcional("plx_value"),
        velocidad_radial_km_s=opcional("rvz_radvel"),
        magnitud=opcional("magnitud"),
        banda=str(fila.get("banda") or "J"),
    )


def posicion_en(estrella: EstrellaDeCatalogo, mjd: float) -> tuple[float, float]:
    """(ra, dec) de la estrella en la fecha dada; sin movimiento propio, la de catálogo."""
    if not estrella.tiene_movimiento_propio:
        return estrella.ra, estrella.dec
    distancia = (
        Distance(parallax=estrella.paralaje_mas * u.mas)
        if estrella.paralaje_mas is not None and estrella.paralaje_mas > 0
        else DISTANCIA_SIN_PARALAJE
    )
    coordenada = SkyCoord(
        ra=estrella.ra * u.deg,
        dec=estrella.dec * u.deg,
        pm_ra_cosdec=(estrella.pmra_mas_anio or 0.0) * u.mas / u.yr,
        pm_dec=(estrella.pmdec_mas_anio or 0.0) * u.mas / u.yr,
        distance=distancia,
        radial_velocity=(estrella.velocidad_radial_km_s or 0.0) * u.km / u.s,
        frame="icrs",
        obstime=Time(estrella.epoca_juliana, format="jyear", scale="tdb"),
    )
    with warnings.catch_warnings():
        # ERFA avisa de «dubious year» para fechas futuras sin tabla de UTC-TAI;
        # no cambia la posición a la escala de un píxel.
        warnings.simplefilter("ignore", ErfaWarning)
        movida = coordenada.apply_space_motion(new_obstime=Time(mjd, format="mjd", scale="utc"))
    return float(movida.ra.deg), float(movida.dec.deg)
