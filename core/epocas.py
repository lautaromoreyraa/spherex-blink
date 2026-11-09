"""Pasadas, visitas y elección de las épocas de un campo.

SPHEREx hace un mapa de todo el cielo cada ~6 meses (una «pasada»). Dentro de
una pasada, cada «visita» a un punto son varias exposiciones seguidas,
separadas por unos 2 minutos; para el parpadeo alcanza una por visita, porque
en 2 minutos nada se mueve un píxel.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

from astropy.time import Time

from contrato.comunes import Detector

INICIO_DEL_RELEVAMIENTO_MJD = 60796.0
"""2025-05-01, comienzo del relevamiento de todo el cielo de SPHEREx."""

DURACION_DE_PASADA_DIAS = 365.25 / 2
"""Cada pasada dura medio año. El número de pasada se deriva de la fecha: IRSA
no lo publica como columna, y con pasadas de 6 meses la cuenta es exacta salvo
en los días de transición entre una y otra."""

SEPARACION_ENTRE_VISITAS_H = 0.5
"""Exposiciones a menos de media hora se consideran la misma visita."""


@dataclass(frozen=True)
class Observacion:
    """Una imagen L2 de SPHEREx que cubre el campo (RF-01)."""

    planeid: str
    uri: str
    """URL absoluta del archivo L2 en IRSA."""
    mjd: float
    """Inicio de la exposición (`time_bounds_lower`)."""
    detector: Detector
    version_proceso: str

    @property
    def fecha_utc(self) -> datetime:
        fecha: datetime = Time(self.mjd, format="mjd", scale="utc").to_datetime(timezone=UTC)
        return fecha.replace(microsecond=0)

    @property
    def pasada(self) -> int:
        return pasada_de(self.mjd)

    @property
    def id_de_epoca(self) -> str:
        """Identificador estable dentro del campo: pasada, fecha y hora UTC."""
        return f"p{self.pasada}-{self.fecha_utc:%Y%m%d-%H%M%S}"


def pasada_de(mjd: float) -> int:
    numero = int((mjd - INICIO_DEL_RELEVAMIENTO_MJD) // DURACION_DE_PASADA_DIAS) + 1
    return min(max(numero, 1), 4)


def agrupar_en_visitas(observaciones: Sequence[Observacion]) -> list[list[Observacion]]:
    """Agrupa observaciones ordenadas por fecha en visitas."""
    visitas: list[list[Observacion]] = []
    for observacion in sorted(observaciones, key=lambda o: o.mjd):
        ultima = visitas[-1][-1] if visitas else None
        if ultima is not None and (observacion.mjd - ultima.mjd) * 24 < SEPARACION_ENTRE_VISITAS_H:
            visitas[-1].append(observacion)
        else:
            visitas.append([observacion])
    return visitas


def elegir_epocas(
    observaciones: Sequence[Observacion], maximo_por_pasada: int
) -> list[Observacion]:
    """Una observación por visita y, por pasada, como mucho `maximo_por_pasada`.

    Cuando sobran visitas se toman repartidas en la pasada (incluidas la
    primera y la última), para que el objeto recorra todo el tramo posible.
    """
    if maximo_por_pasada < 1:
        raise ValueError("maximo_por_pasada tiene que ser al menos 1")
    por_pasada: dict[int, list[Observacion]] = {}
    for visita in agrupar_en_visitas(observaciones):
        primera = visita[0]
        por_pasada.setdefault(primera.pasada, []).append(primera)
    elegidas: list[Observacion] = []
    for pasada in sorted(por_pasada):
        visitas = por_pasada[pasada]
        if len(visitas) <= maximo_por_pasada:
            elegidas.extend(visitas)
            continue
        if maximo_por_pasada == 1:
            elegidas.append(visitas[0])
            continue
        paso = (len(visitas) - 1) / (maximo_por_pasada - 1)
        indices = sorted({round(i * paso) for i in range(maximo_por_pasada)})
        elegidas.extend(visitas[i] for i in indices)
    return elegidas
