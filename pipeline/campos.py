"""Los campos de la demo (TAR-06).

Cada campo fija qué se mira, con qué detector, en qué fechas y cuántas épocas
por pasada. El centro sale del propio objeto destacado: la Estrella de Barnard
en su posición de 2026.0 y Makemake en el punto medio de su recorrido en las
épocas elegidas, así el campo lo contiene entero.

Elección, verificada con consultas reales el 2026-11-08:

- **Estrella de Barnard**, D1: IRSA tiene imágenes de 3 pasadas (2025-08/09,
  2026-03 y 2026-08/09). En ese año la estrella se corre unos 10,6″, 1,7 px;
  menos de los 2 px que pedía TAR-06, porque SPHEREx no tiene datos de antes
  de 2025-08 en ese punto. Se avisa en el campo.
- **Makemake**, D1 (donde mateibut/SPHEREx lo midió con S/N 7–19), pasada de
  2026-06-09 a 2026-06-13: 9 visitas en 4 días, en las que se corre unos
  22 px según Horizons.
"""

from dataclasses import dataclass

from contrato.campo import TipoDeObjetoConocido
from contrato.comunes import Detector, TextoTraducido


@dataclass(frozen=True)
class EstrellaDestacada:
    identificador_simbad: str
    nombre: str
    """Nombre que se muestra (en `conocidos[].nombre` y `objeto_destacado`)."""
    mjd_del_centro: float
    """Fecha en la que se toma la posición de la estrella como centro del campo."""


@dataclass(frozen=True)
class CuerpoDestacado:
    comando_horizons: str
    nombre: str
    tipo: TipoDeObjetoConocido


@dataclass(frozen=True)
class DefinicionDeCampo:
    id: str
    nombre: TextoTraducido
    descripcion: TextoTraducido
    tamano_grados: float
    detector: Detector
    destacado: EstrellaDestacada | CuerpoDestacado
    maximo_por_pasada: int
    mjd_desde: float | None = None
    mjd_hasta: float | None = None


CAMPOS: tuple[DefinicionDeCampo, ...] = (
    DefinicionDeCampo(
        id="estrella-de-barnard",
        nombre=TextoTraducido(es="Estrella de Barnard", en="Barnard's Star"),
        descripcion=TextoTraducido(
            es=(
                "La estrella con el movimiento propio más rápido del cielo: 10,4″ por año. "
                "Entre las pasadas de SPHEREx se corre casi dos píxeles mientras las demás "
                "estrellas quedan quietas."
            ),
            en=(
                "The star with the fastest proper motion in the sky: 10.4″ per year. "
                "Between SPHEREx passes it shifts almost two pixels while the other stars "
                "stay put."
            ),
        ),
        tamano_grados=0.15,
        detector="D1",
        destacado=EstrellaDestacada(
            identificador_simbad="NAME Barnard's star",
            nombre="Estrella de Barnard",
            mjd_del_centro=61041.0,
        ),
        maximo_por_pasada=3,
    ),
    DefinicionDeCampo(
        id="makemake",
        nombre=TextoTraducido(es="Makemake", en="Makemake"),
        descripcion=TextoTraducido(
            es=(
                "Planeta enano a 52 UA del Sol. En cuatro días de una misma pasada de "
                "SPHEREx se corre sobre las estrellas quietas: así se delata un cuerpo "
                "lejano del Sistema Solar."
            ),
            en=(
                "Dwarf planet 52 AU from the Sun. Over four days of a single SPHEREx "
                "pass it drifts across the fixed stars: that is how a distant Solar "
                "System body gives itself away."
            ),
        ),
        tamano_grados=0.15,
        detector="D1",
        destacado=CuerpoDestacado(
            comando_horizons="136472;", nombre="Makemake", tipo="planeta-enano"
        ),
        maximo_por_pasada=9,
        mjd_desde=61200.0,
        mjd_hasta=61205.0,
    ),
)
