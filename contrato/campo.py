"""Forma de `campos/<id>/campo.json`: un campo con sus épocas (SRS 4.2)."""

from datetime import datetime
from typing import Annotated, Literal, Self

from pydantic import Field, model_validator

from contrato.base import ModeloDelContrato
from contrato.comunes import (
    AscensionRecta,
    Coordenadas,
    Declinacion,
    Detector,
    IdentificadorKebab,
    RutaRelativa,
    TamanoEnGrados,
    TextoTraducido,
)

TipoDeEstiramiento = Literal["lineal", "asinh"]
TipoDeObjetoConocido = Literal[
    "estrella", "asteroide", "cometa", "tno", "planeta-enano", "enana-marron"
]
FuenteDeCatalogo = Literal["SkyBoT", "Horizons", "SIMBAD", "Gaia DR3"]
EstadoDeIdentificacion = Literal["conocido", "sin-identificar"]

ValorDeCabeceraFits = str | int | float | bool


class Rejilla(ModeloDelContrato):
    """Rejilla común norte arriba a la que se reproyectan todas las épocas."""

    ancho_px: int = Field(gt=0)
    alto_px: int = Field(gt=0)
    escala_arcsec_px: float = Field(gt=0, description="Segundos de arco por píxel")
    wcs: dict[str, ValorDeCabeceraFits] = Field(
        description="Cabecera FITS TAN de la rejilla, como diccionario"
    )


class Estiramiento(ModeloDelContrato):
    """Escala de brillo común a todas las épocas del campo (RF-05)."""

    tipo: TipoDeEstiramiento
    minimo: float = Field(description="MJy/sr que se pintan negros")
    maximo: float = Field(description="MJy/sr que se pintan blancos")

    @model_validator(mode="after")
    def _maximo_mayor_que_minimo(self) -> Self:
        if self.maximo <= self.minimo:
            raise ValueError("el máximo del estiramiento tiene que ser mayor que el mínimo")
        return self


class FuenteDeEpoca(ModeloDelContrato):
    """De qué archivo de IRSA salió la época (RF-15, RNF-07)."""

    uri: str = Field(pattern=r"^https://", description="URI de IRSA del archivo L2")
    planeid: str = Field(min_length=1)
    version_proceso: str = Field(min_length=1)


class Epoca(ModeloDelContrato):
    """Un recorte usado en el campo."""

    id: IdentificadorKebab
    mjd: float = Field(description="Inicio de la observación (time_bounds_lower) en MJD")
    fecha_utc: datetime = Field(description="Inicio de la observación en UTC")
    pasada: int = Field(ge=1, le=4, description="Número de pasada de SPHEREx")
    fuente: FuenteDeEpoca
    longitud_onda_um: float = Field(gt=0, description="Longitud de onda central en el centro")
    fraccion_mala: float = Field(ge=0, le=1, description="Fracción enmascarada por FLAGS")
    imagen: RutaRelativa
    diferencia: RutaRelativa | None = Field(
        description="Diferencia contra la mediana de las otras épocas; null con menos de 3"
    )


class PosicionEsperada(ModeloDelContrato):
    """Dónde tenía que estar un objeto conocido en una época."""

    epoca_id: IdentificadorKebab
    ra: AscensionRecta
    dec: Declinacion
    x: float = Field(description="Píxel de la rejilla, origen arriba a la izquierda")
    y: float = Field(description="Píxel de la rejilla, origen arriba a la izquierda")
    dentro_del_campo: bool
    distancia_ua: float | None = Field(
        gt=0, description="Distancia al observador en UA; null para las estrellas"
    )


class DeteccionDeConocido(ModeloDelContrato):
    """Dónde se midió un objeto conocido en una época y a cuánto quedó de lo esperado."""

    epoca_id: IdentificadorKebab
    x: float = Field(description="Centroide medido, en píxeles de la rejilla")
    y: float = Field(description="Centroide medido, en píxeles de la rejilla")
    snr: float = Field(description="Relación señal/ruido de la medición")
    distancia_px: float = Field(ge=0, description="Distancia a la posición esperada")


class Magnitud(ModeloDelContrato):
    valor: float
    banda: str = Field(min_length=1)


class ObjetoConocido(ModeloDelContrato):
    """Cuerpo del Sistema Solar o estrella de catálogo con posición esperada."""

    nombre: str = Field(min_length=1)
    tipo: TipoDeObjetoConocido
    posiciones: list[PosicionEsperada]
    deteccion: list[DeteccionDeConocido] = Field(
        description="Mediciones en la imagen; vacía si no se midió"
    )
    fuente: FuenteDeCatalogo
    consultado_en: datetime
    magnitud: Magnitud | None


class Deteccion(ModeloDelContrato):
    epoca_id: IdentificadorKebab
    x: float
    y: float
    ra: AscensionRecta
    dec: Declinacion
    snr: float = Field(description="Relación señal/ruido de la detección")


class Identificacion(ModeloDelContrato):
    estado: EstadoDeIdentificacion
    nombre: str | None
    distancia_arcsec: Annotated[float, Field(ge=0)] | None


class Candidato(ModeloDelContrato):
    """Grupo de detecciones compatible con un movimiento; no es un descubrimiento."""

    id: IdentificadorKebab
    detecciones: list[Deteccion] = Field(min_length=3)
    velocidad_arcsec_h: float = Field(ge=0)
    angulo_posicion_grados: float = Field(ge=0, lt=360)
    residuo_arcsec: float = Field(ge=0)
    falsas_alarmas_esperadas: float = Field(ge=0, description="Enlaces espurios esperados (RF-21)")
    identificacion: Identificacion


class Profundidad(ModeloDelContrato):
    mjy_sr: float = Field(gt=0, description="Brillo de superficie a 5σ en MJy/sr")
    magnitud: float | None = Field(description="Magnitud equivalente, si se puede calcular")


class PuntoDeRecuperacion(ModeloDelContrato):
    brillo: float
    fraccion_recuperada: float = Field(ge=0, le=1)


class Limites(ModeloDelContrato):
    """Límites medidos por inyección de objetos falsos (RF-27)."""

    umbral_sigma: float = Field(gt=0)
    profundidad_5sigma: Profundidad
    recuperacion: list[PuntoDeRecuperacion]


MarcoDeReferencia = Literal["heliocentrico-ecliptico-J2000"]


class PuntoHeliocentrico(ModeloDelContrato):
    """Posición de un cuerpo en una época, centrada en el Sol (RF-34, RF-35)."""

    epoca_id: IdentificadorKebab
    x_ua: float
    y_ua: float
    z_ua: float


class ObjetoEnLaEscena(ModeloDelContrato):
    """El cuerpo del Sistema Solar del campo, con su posición en cada época."""

    nombre: str = Field(min_length=1)
    posiciones: list[PuntoHeliocentrico]


class Geometria(ModeloDelContrato):
    """Dónde estaban la Tierra y el objeto cuando se tomó cada época (JPL Horizons).

    La escena 3D dibuja exactamente esta geometría, la misma que usó el
    pipeline para marcar al objeto, en vez de recalcularla en el navegador.
    """

    marco: MarcoDeReferencia
    tierra: list[PuntoHeliocentrico]
    objeto: ObjetoEnLaEscena


class Procedencia(ModeloDelContrato):
    """Con qué versión del pipeline y cuándo se consultó IRSA (RNF-12)."""

    version_pipeline: str = Field(min_length=1)
    irsa_consultado_en: datetime = Field(description="Cuándo se buscaron las observaciones")


class Campo(ModeloDelContrato):
    """Raíz de `campo.json`."""

    id: IdentificadorKebab
    nombre: TextoTraducido
    descripcion: TextoTraducido
    centro: Coordenadas
    tamano_grados: TamanoEnGrados
    detector: Detector
    rejilla: Rejilla
    estiramiento: Estiramiento
    epocas: list[Epoca] = Field(description="Ordenadas por mjd")
    referencia: RutaRelativa | None = Field(description="Mediana de las épocas")
    rastro: RutaRelativa | None = Field(description="Máximo por píxel (RF-17)")
    conocidos: list[ObjetoConocido]
    candidatos: list[Candidato]
    geometria: Geometria | None = Field(
        description="Para la escena 3D; null si el campo no sigue un cuerpo del Sistema Solar"
    )
    limites: Limites | None
    avisos: list[TextoTraducido]
    creditos: str = Field(min_length=1)
    procedencia: Procedencia

    @model_validator(mode="after")
    def _epocas_coherentes(self) -> Self:
        # Las reglas que cruzan listas no entran en el JSON Schema: se validan
        # acá para que el pipeline no pueda escribir un campo inconsistente.
        mjds = [epoca.mjd for epoca in self.epocas]
        if mjds != sorted(mjds):
            raise ValueError("las épocas tienen que estar ordenadas por mjd")

        ids = [epoca.id for epoca in self.epocas]
        if len(set(ids)) != len(ids):
            raise ValueError("hay épocas con el mismo id")

        conocidas = set(ids)
        citadas = (
            {p.epoca_id for o in self.conocidos for p in o.posiciones}
            | {d.epoca_id for o in self.conocidos for d in o.deteccion}
            | {d.epoca_id for c in self.candidatos for d in c.detecciones}
        )
        if self.geometria is not None:
            citadas |= {p.epoca_id for p in self.geometria.tierra}
            citadas |= {p.epoca_id for p in self.geometria.objeto.posiciones}
        desconocidas = sorted(citadas - conocidas)
        if desconocidas:
            raise ValueError(f"se citan épocas que el campo no tiene: {desconocidas}")
        return self
