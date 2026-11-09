"""Configuración de core/: servicios externos, caché y límites de red.

Todo se lee de variables de entorno con un default que sirve para correr el
pipeline en la PC. Ninguno de estos servicios pide credenciales.
"""

import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

MAXIMO_DE_PEDIDOS_SIMULTANEOS = 12
"""Tope de pedidos en paralelo a IRSA (RF-02).

IRSA no documenta límites de tasa; con 7 a 12 recortes en paralelo responde
bien y más arriba empieza a cortar conexiones. Ninguna configuración lo puede
superar.
"""

# SIMBAD de CDS (Estrasburgo) es el servidor principal; el espejo de Harvard
# responde lo mismo y queda como alternativa porque desde algunas redes CDS no
# contesta.
URLS_TAP_SIMBAD = (
    "https://simbad.cds.unistra.fr/simbad/sim-tap/sync",
    "https://simbad.cfa.harvard.edu/simbad/sim-tap/sync",
)


@dataclass(frozen=True)
class Configuracion:
    url_tap_irsa: str
    """Endpoint síncrono del TAP de IRSA."""
    url_base_irsa: str
    """Prefijo de las URI relativas de `spherex.artifact`."""
    urls_tap_simbad: tuple[str, ...]
    """Endpoints síncronos del TAP de SIMBAD, en orden de preferencia."""
    url_horizons: str
    """API de JPL Horizons."""
    directorio_cache: Path
    pedidos_simultaneos: int
    reintentos: int
    """Intentos extra ante una falla transitoria (timeout, 503, conexión cortada)."""
    espera_entre_reintentos_s: float
    """Espera base; crece al doble en cada reintento."""
    tiempo_maximo_s: float
    """Timeout de cada pedido. Un recorte tarda entre 9 y 15 s."""


def configuracion_desde_entorno(entorno: Mapping[str, str] | None = None) -> Configuracion:
    """Arma la configuración desde el entorno (por defecto, `os.environ`)."""
    variables = os.environ if entorno is None else entorno
    simbad = variables.get("SIMBAD_TAP_URLS")
    pedidos = int(variables.get("SPHEREX_BLINK_PEDIDOS_SIMULTANEOS", "8"))
    if not 1 <= pedidos <= MAXIMO_DE_PEDIDOS_SIMULTANEOS:
        raise ValueError(
            f"SPHEREX_BLINK_PEDIDOS_SIMULTANEOS tiene que estar entre 1 y "
            f"{MAXIMO_DE_PEDIDOS_SIMULTANEOS}; vale {pedidos}"
        )
    return Configuracion(
        url_tap_irsa=variables.get("IRSA_TAP_URL", "https://irsa.ipac.caltech.edu/TAP/sync"),
        url_base_irsa=variables.get("IRSA_URL_BASE", "https://irsa.ipac.caltech.edu/"),
        urls_tap_simbad=(
            tuple(u.strip() for u in simbad.split(",") if u.strip()) if simbad else URLS_TAP_SIMBAD
        ),
        url_horizons=variables.get("HORIZONS_URL", "https://ssd.jpl.nasa.gov/api/horizons.api"),
        directorio_cache=Path(variables.get("SPHEREX_BLINK_CACHE", "cache")),
        pedidos_simultaneos=pedidos,
        reintentos=int(variables.get("SPHEREX_BLINK_REINTENTOS", "3")),
        espera_entre_reintentos_s=float(variables.get("SPHEREX_BLINK_ESPERA_S", "2")),
        tiempo_maximo_s=float(variables.get("SPHEREX_BLINK_TIMEOUT_S", "120")),
    )
