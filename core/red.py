"""Pedidos HTTP con reintentos a los servicios externos.

IRSA falla de forma esporádica (timeout, 503, conexión cortada) y se recupera
sola; un reintento con espera creciente alcanza. Lo que no es transitorio
(404, 400, el 500 de un recorte fuera de la imagen) no se reintenta.
"""

import time
from collections.abc import Callable, Mapping

import httpx2

CODIGOS_TRANSITORIOS = frozenset({429, 502, 503, 504})


class ServicioExternoError(Exception):
    """Un servicio externo no dio la respuesta pedida."""

    def __init__(self, servicio: str, motivo: str, codigo_http: int | None = None) -> None:
        super().__init__(f"{servicio}: {motivo}")
        self.servicio = servicio
        self.motivo = motivo
        self.codigo_http = codigo_http


def crear_cliente(tiempo_maximo_s: float, pedidos_simultaneos: int) -> httpx2.Client:
    """Cliente compartido; el pool no deja abrir más conexiones que el tope."""
    return httpx2.Client(
        timeout=httpx2.Timeout(tiempo_maximo_s),
        limits=httpx2.Limits(
            max_connections=pedidos_simultaneos, max_keepalive_connections=pedidos_simultaneos
        ),
        follow_redirects=True,
        headers={"User-Agent": "spherex-blink (pipeline de datos)"},
    )


def pedir(
    cliente: httpx2.Client,
    servicio: str,
    url: str,
    *,
    params: Mapping[str, str] | None = None,
    datos: Mapping[str, str] | None = None,
    reintentos: int = 3,
    espera_s: float = 2.0,
    dormir: Callable[[float], None] = time.sleep,
) -> httpx2.Response:
    """GET (o POST si hay `datos`) con reintentos ante fallas transitorias.

    Devuelve la respuesta 2xx o levanta `ServicioExternoError` con el último motivo.
    """
    motivo = "sin respuesta"
    codigo: int | None = None
    for intento in range(reintentos + 1):
        if intento:
            dormir(espera_s * 2 ** (intento - 1))
        try:
            if datos is None:
                respuesta = cliente.get(url, params=params)
            else:
                respuesta = cliente.post(url, params=params, data=dict(datos))
        except httpx2.TransportError as error:
            motivo, codigo = f"falla de red ({type(error).__name__})", None
            continue
        if respuesta.is_success:
            return respuesta
        motivo, codigo = f"HTTP {respuesta.status_code}", respuesta.status_code
        if respuesta.status_code not in CODIGOS_TRANSITORIOS:
            break
    raise ServicioExternoError(servicio, motivo, codigo)
