"""Estado del servicio para `GET /salud`."""

from contrato.api import Salud
from core.version import version_de_la_aplicacion


def estado_del_servicio() -> Salud:
    """Responde que el servicio está en pie y con qué versión.

    No consulta a IRSA a propósito: la API duerme en Railway y este chequeo
    tiene que contestar rápido al despertar, aunque IRSA esté caído.
    """
    return Salud(estado="ok", version=version_de_la_aplicacion())
