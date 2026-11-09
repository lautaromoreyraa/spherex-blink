"""Arma un campo de la demo de punta a punta y lo escribe según el contrato.

Orden: objeto destacado → observaciones (RF-01) → épocas → recortes (RF-02)
→ máscara y rejilla (RF-03, RF-04) → estiramiento y WebP (RF-05) →
referencia y diferencias (RF-06) → objetos conocidos (RF-08, RF-32) →
`campo.json` validado (RF-09). Todo lo que sale distinto de lo esperado
queda en `avisos[]` en vez de esconderse (RNF-07).
"""

import math
import shutil
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

import httpx2
import numpy as np

from contrato.campo import (
    Campo,
    DeteccionDeConocido,
    Epoca,
    Estiramiento,
    FuenteDeEpoca,
    Geometria,
    Magnitud,
    ObjetoConocido,
    ObjetoEnLaEscena,
    PosicionEsperada,
    Procedencia,
    PuntoHeliocentrico,
)
from contrato.campo import Rejilla as RejillaDelContrato
from contrato.comunes import Coordenadas, TextoTraducido
from contrato.indice import ResumenDeCampo
from core.cache import CacheEnDisco
from core.catalogo import consultar_simbad
from core.configuracion import Configuracion
from core.diferencias import diferencias, mediana
from core.efemerides import TIERRA, Horizons
from core.epocas import elegir_epocas
from core.estiramiento import (
    a_ocho_bits,
    diferencia_a_ocho_bits,
    escala_comun,
    escribir_webp,
    fondo_mediano,
    limite_de_la_diferencia,
)
from core.estrellas import (
    EstrellaDeCatalogo,
    adql_estrella_por_nombre,
    estrella_de_fila,
    posicion_en,
)
from core.gaia import estrellas_de_gaia
from core.mascara import fraccion_mala, pixeles_malos
from core.medicion import medir_fuente
from core.observaciones import buscar_observaciones
from core.recortes import bajar_recortes, lado_del_recorte
from core.rejilla import EpocaAlineada, Rejilla, rejilla_norte_arriba, reproyectar
from core.version import version_de_la_aplicacion
from pipeline.campos import CuerpoDestacado, DefinicionDeCampo, EstrellaDestacada
from pipeline.escritura import escribir_documento

UMBRAL_DE_DETECCION_SNR = 5.0
DISTANCIA_MAXIMA_DE_DETECCION_PX = 1.0
DIFERENCIA_DE_LONGITUD_DE_ONDA_UM = 0.05
DESPLAZAMIENTO_MINIMO_PX = 2.0
ESTRELLAS_DE_CONTROL = 3
"""RF-04: en cada época, al menos 3 estrellas fijas medidas a menos de 1 px."""
MAXIMO_DE_ESTRELLAS_DE_CONTROL = 6
RADIO_DE_MASCARA_DE_CONTROL_PX = 1.5
MAGNITUD_G_MINIMA_DE_CONTROL = 9.0
"""Las estrellas más brillantes saturan el núcleo y su centroide no sirve de control."""
MAGNITUD_G_MAXIMA_DE_CONTROL = 16.5
"""Más débiles, el centroide en una sola imagen ya no es preciso a una fracción de píxel.
Banda G de Gaia DR3."""
MOVIMIENTO_PROPIO_MAXIMO_DE_CONTROL = 50.0
"""mas/año: menos de 0,1 px de corrimiento en un año."""

CREDITOS = (
    "Imágenes: SPHEREx (NASA/JPL-Caltech), NASA/IPAC Infrared Science Archive (IRSA). "
    "Estrellas: base de datos SIMBAD, CDS, Estrasburgo; Gaia DR3 (ESA/DPAC), servido por IRSA. "
    "Efemérides: NASA/JPL Horizons (Giorgini y Solar System Dynamics Group)."
)


@dataclass
class Contexto:
    """Lo que comparten todos los campos de una corrida."""

    cliente: httpx2.Client
    configuracion: Configuracion
    cache: CacheEnDisco
    salida: Path
    """La carpeta `datos/` de la web."""
    ahora: Callable[[], datetime] = field(default=lambda: datetime.now(UTC))


@dataclass(frozen=True)
class CampoGenerado:
    resumen: ResumenDeCampo
    campo: Campo


def _es(valor: float, decimales: int = 1) -> str:
    """Número con coma decimal, para los textos en español."""
    return f"{valor:.{decimales}f}".replace(".", ",")


def _aviso(es: str, en: str) -> TextoTraducido:
    return TextoTraducido(es=es, en=en)


def _desplazamiento_px(rejilla: Rejilla, a: tuple[float, float], b: tuple[float, float]) -> float:
    xa, ya = rejilla.a_pixel(*a)
    xb, yb = rejilla.a_pixel(*b)
    return math.hypot(xb - xa, yb - ya)


def _posiciones(
    rejilla: Rejilla,
    epocas: Sequence[EpocaAlineada],
    coordenadas: Sequence[tuple[float, float]],
    distancias: Sequence[float | None] | None = None,
) -> list[PosicionEsperada]:
    posiciones = []
    for i, (epoca, (ra, dec)) in enumerate(zip(epocas, coordenadas, strict=True)):
        x, y = rejilla.a_pixel(ra, dec)
        posiciones.append(
            PosicionEsperada(
                epoca_id=epoca.recorte.observacion.id_de_epoca,
                ra=round(ra % 360, 7),
                dec=round(dec, 7),
                x=round(x, 3),
                y=round(y, 3),
                dentro_del_campo=rejilla.contiene(x, y),
                distancia_ua=None if distancias is None else distancias[i],
            )
        )
    return posiciones


def _detecciones(
    imagenes: Sequence[np.ndarray],
    epocas: Sequence[EpocaAlineada],
    posiciones: Sequence[PosicionEsperada],
    saltear: Sequence[bool] | None = None,
) -> list[DeteccionDeConocido]:
    detecciones = []
    omitidas = saltear if saltear is not None else [False] * len(epocas)
    for imagen, epoca, posicion, omitida in zip(
        imagenes, epocas, posiciones, omitidas, strict=True
    ):
        if omitida or not posicion.dentro_del_campo:
            continue
        medida = medir_fuente(imagen, posicion.x, posicion.y)
        if medida is None:
            continue
        detecciones.append(
            DeteccionDeConocido(
                epoca_id=epoca.recorte.observacion.id_de_epoca,
                x=round(medida.x, 3),
                y=round(medida.y, 3),
                snr=round(medida.snr, 2),
                distancia_px=round(medida.distancia_a(posicion.x, posicion.y), 3),
            )
        )
    return detecciones


def _estrellas_de_control(
    definicion: DefinicionDeCampo, centro: Coordenadas, contexto: Contexto
) -> tuple[list[EstrellaDeCatalogo], datetime]:
    """Estrellas fijas y no saturadas del campo, para comprobar la alineación (RF-04).

    «Fijas» quiere decir con movimiento propio chico: así la Estrella de
    Barnard, que también está en Gaia, nunca sirve de control de sí misma.
    """
    estrellas, consultado = estrellas_de_gaia(
        centro,
        # El círculo que encierra el cuadrado del campo; las que caen en las
        # esquinas fuera del cuadrado se descartan después.
        definicion.tamano_grados * 0.71,
        MAGNITUD_G_MINIMA_DE_CONTROL,
        MAGNITUD_G_MAXIMA_DE_CONTROL,
        cliente=contexto.cliente,
        configuracion=contexto.configuracion,
        cache=contexto.cache,
        ahora=contexto.ahora,
    )
    fijas = [
        e
        for e in estrellas
        if math.hypot(e.pmra_mas_anio or 0.0, e.pmdec_mas_anio or 0.0)
        < MOVIMIENTO_PROPIO_MAXIMO_DE_CONTROL
    ]
    return fijas, consultado


def armar_campo(definicion: DefinicionDeCampo, contexto: Contexto) -> CampoGenerado:
    avisos: list[TextoTraducido] = []
    destacado = definicion.destacado
    horizons = Horizons(
        cliente=contexto.cliente,
        configuracion=contexto.configuracion,
        cache=contexto.cache,
        ahora=contexto.ahora,
    )

    # 1. Dónde está el objeto destacado, para saber dónde buscar.
    estrella: EstrellaDeCatalogo | None = None
    consultado_estrella: datetime | None = None
    if isinstance(destacado, EstrellaDestacada):
        filas, consultado_estrella = consultar_simbad(
            adql_estrella_por_nombre(destacado.identificador_simbad),
            cliente=contexto.cliente,
            configuracion=contexto.configuracion,
            cache=contexto.cache,
            ahora=contexto.ahora,
        )
        if not filas:
            raise ValueError(f"SIMBAD no conoce a {destacado.identificador_simbad}")
        estrella = estrella_de_fila(filas[0])
        ra, dec = posicion_en(estrella, destacado.mjd_del_centro)
        busqueda = Coordenadas(ra=round(ra, 6), dec=round(dec, 6))
    else:
        if definicion.mjd_desde is None or definicion.mjd_hasta is None:
            raise ValueError(
                "un campo de un cuerpo del Sistema Solar necesita su ventana de fechas"
            )
        medio = (definicion.mjd_desde + definicion.mjd_hasta) / 2
        (aproximada,) = horizons.efemeride(destacado.comando_horizons, [medio])
        busqueda = Coordenadas(ra=round(aproximada.ra, 6), dec=round(aproximada.dec, 6))

    # 2. Observaciones y épocas.
    resultado = buscar_observaciones(
        busqueda,
        definicion.detector,
        cliente=contexto.cliente,
        configuracion=contexto.configuracion,
        cache=contexto.cache,
        mjd_desde=definicion.mjd_desde,
        mjd_hasta=definicion.mjd_hasta,
        ahora=contexto.ahora,
    )
    elegidas = elegir_epocas(resultado.observaciones, definicion.maximo_por_pasada)
    if not elegidas:
        raise ValueError(f"IRSA no tiene observaciones de {definicion.id} en {definicion.detector}")

    # 3. El centro definitivo: para un cuerpo que se mueve, el punto medio de
    # su recorrido en las épocas elegidas.
    efemerides = None
    if isinstance(destacado, CuerpoDestacado):
        efemerides = horizons.efemeride(destacado.comando_horizons, [o.mjd for o in elegidas])
        primera, ultima = efemerides[0], efemerides[-1]
        centro = Coordenadas(
            ra=round((primera.ra + ultima.ra) / 2, 6), dec=round((primera.dec + ultima.dec) / 2, 6)
        )
    else:
        centro = busqueda

    # 4. Recortes, máscara y rejilla común.
    recortes, fallas = bajar_recortes(
        elegidas,
        centro,
        lado_del_recorte(definicion.tamano_grados),
        cliente=contexto.cliente,
        cache=contexto.cache,
        configuracion=contexto.configuracion,
    )
    for falla in fallas:
        fecha = f"{falla.observacion.fecha_utc:%Y-%m-%d %H:%M} UTC"
        avisos.append(
            _aviso(
                f"Se descartó la época del {fecha}: {falla.motivo}.",
                f"The {fecha} epoch was dropped: {falla.motivo} (IRSA).",
            )
        )
    if not recortes:
        raise ValueError(f"no llegó ningún recorte de {definicion.id}")
    rejilla = rejilla_norte_arriba(centro, definicion.tamano_grados)
    alineadas = [reproyectar(r, rejilla) for r in recortes]
    sin_fondo = [a.imagen - fondo_mediano(a.imagen) for a in alineadas]
    avisos.append(
        _aviso(
            "A cada época se le restó su fondo mediano: la luz zodiacal cambia con la fecha.",
            "Each epoch had its median background subtracted: zodiacal light changes with date.",
        )
    )

    # 5. Imágenes, referencia y diferencias.
    carpeta = contexto.salida / "campos" / definicion.id
    if carpeta.exists():
        shutil.rmtree(carpeta)
    escala = escala_comun(sin_fondo)
    referencia_img = mediana(sin_fondo)
    difs = diferencias(sin_fondo)
    limite = limite_de_la_diferencia(difs) if difs is not None else None
    if difs is None:
        avisos.append(
            _aviso(
                f"Con {len(alineadas)} épocas válidas no se calcula la diferencia (hacen falta 3).",
                f"With {len(alineadas)} valid epochs there is no difference image (3 needed).",
            )
        )

    def ruta(nombre: str) -> str:
        return f"campos/{definicion.id}/{nombre}"

    epocas: list[Epoca] = []
    for i, (alineada, imagen) in enumerate(zip(alineadas, sin_fondo, strict=True)):
        obs = alineada.recorte.observacion
        escribir_webp(
            a_ocho_bits(imagen, escala),
            alineada.valido,
            contexto.salida / ruta(f"{obs.id_de_epoca}.webp"),
        )
        ruta_dif = None
        if difs is not None and limite is not None:
            valido = np.isfinite(difs[i])
            ruta_dif = ruta(f"{obs.id_de_epoca}-diferencia.webp")
            escribir_webp(
                diferencia_a_ocho_bits(difs[i], limite), valido, contexto.salida / ruta_dif
            )
        epocas.append(
            Epoca(
                id=obs.id_de_epoca,
                mjd=round(obs.mjd, 7),
                fecha_utc=obs.fecha_utc,
                pasada=obs.pasada,
                fuente=FuenteDeEpoca(
                    uri=obs.uri, planeid=obs.planeid, version_proceso=obs.version_proceso
                ),
                longitud_onda_um=round(alineada.recorte.longitud_onda_um, 4),
                fraccion_mala=round(
                    fraccion_mala(alineada.recorte.flags, alineada.recorte.imagen), 4
                ),
                imagen=ruta(f"{obs.id_de_epoca}.webp"),
                diferencia=ruta_dif,
            )
        )
    valido_ref = np.isfinite(referencia_img)
    escribir_webp(
        a_ocho_bits(referencia_img, escala), valido_ref, contexto.salida / ruta("referencia.webp")
    )
    escribir_webp(
        a_ocho_bits(referencia_img, escala), valido_ref, contexto.salida / ruta("miniatura.webp")
    )

    longitudes = [e.longitud_onda_um for e in epocas]
    if max(longitudes) - min(longitudes) > DIFERENCIA_DE_LONGITUD_DE_ONDA_UM:
        avisos.append(
            _aviso(
                f"La longitud de onda central cambia entre épocas ({_es(min(longitudes), 3)} a "
                f"{_es(max(longitudes), 3)} µm): parte de lo que muestra la diferencia es color, "
                "no movimiento.",
                f"The central wavelength changes between epochs ({min(longitudes):.3f} to "
                f"{max(longitudes):.3f} µm): part of the difference image is colour, not motion.",
            )
        )

    # 6. Objetos conocidos.
    conocidos: list[ObjetoConocido] = []
    geometria: Geometria | None = None
    imagenes_de_medicion: Sequence[np.ndarray]
    if estrella is not None and consultado_estrella is not None:
        coordenadas = [posicion_en(estrella, a.recorte.observacion.mjd) for a in alineadas]
        posiciones = _posiciones(rejilla, alineadas, coordenadas)
        corrimiento = _desplazamiento_px(rejilla, coordenadas[0], coordenadas[-1])
        saturada = [
            bool(pixeles_malos(a.recorte.flags).any()) and _hay_mascara_cerca(a, rejilla, p.x, p.y)
            for a, p in zip(alineadas, posiciones, strict=True)
        ]
        conocidos.append(
            ObjetoConocido(
                nombre=destacado.nombre
                if isinstance(destacado, EstrellaDestacada)
                else estrella.nombre,
                tipo="estrella",
                posiciones=posiciones,
                deteccion=[],
                fuente="SIMBAD",
                consultado_en=consultado_estrella,
                magnitud=None
                if estrella.magnitud is None
                else Magnitud(valor=estrella.magnitud, banda=estrella.banda),
            )
        )
        if any(saturada):
            avisos.append(
                _aviso(
                    f"{conocidos[0].nombre} satura el detector: su núcleo queda enmascarado y "
                    "no se mide su posición; el marcador es la del catálogo.",
                    f"{conocidos[0].nombre} saturates the detector: its core is masked and its "
                    "position is not measured; the marker is the catalogue position.",
                )
            )
        if corrimiento < DESPLAZAMIENTO_MINIMO_PX:
            avisos.append(
                _aviso(
                    f"Entre la primera y la última época la estrella se corre "
                    f"{_es(corrimiento)} px "
                    f"({_es(corrimiento * rejilla.escala_arcsec)}″): las épocas disponibles "
                    "en IRSA para este punto y este detector cubren un año.",
                    f"Between the first and last epochs the star moves {corrimiento:.1f} px "
                    f"({corrimiento * rejilla.escala_arcsec:.1f}″): the epochs available at "
                    "IRSA for this spot and detector span one year.",
                )
            )
    if isinstance(destacado, CuerpoDestacado) and efemerides is not None:
        por_mjd = {round(p.mjd, 9): p for p in efemerides}
        propias = [por_mjd[round(a.recorte.observacion.mjd, 9)] for a in alineadas]
        posiciones = _posiciones(
            rejilla,
            alineadas,
            [(p.ra, p.dec) for p in propias],
            [round(p.distancia_ua, 6) for p in propias],
        )
        # Se mide en la diferencia, donde las estrellas fijas se cancelan; sin
        # diferencia, en la imagen.
        imagenes_de_medicion = difs if difs is not None else sin_fondo
        deteccion = _detecciones(imagenes_de_medicion, alineadas, posiciones)
        conocidos.append(
            ObjetoConocido(
                nombre=destacado.nombre,
                tipo=destacado.tipo,
                posiciones=posiciones,
                deteccion=deteccion,
                fuente="Horizons",
                consultado_en=horizons.consultado_en or contexto.ahora(),
                magnitud=None,
            )
        )
        avisos.extend(_avisos_del_cuerpo(destacado.nombre, posiciones, deteccion))
        mjds = [a.recorte.observacion.mjd for a in alineadas]
        tierra = horizons.vectores(TIERRA, mjds)
        objeto = horizons.vectores(destacado.comando_horizons, mjds)
        ids = [a.recorte.observacion.id_de_epoca for a in alineadas]
        geometria = Geometria(
            marco="heliocentrico-ecliptico-J2000",
            tierra=[_punto(i, v.x_ua, v.y_ua, v.z_ua) for i, v in zip(ids, tierra, strict=True)],
            objeto=ObjetoEnLaEscena(
                nombre=destacado.nombre,
                posiciones=[
                    _punto(i, v.x_ua, v.y_ua, v.z_ua) for i, v in zip(ids, objeto, strict=True)
                ],
            ),
        )

    control, consultado_control = _estrellas_de_control(definicion, centro, contexto)
    medidas_por_epoca = [0] * len(alineadas)
    elegidas_de_control = 0
    for estrella_fija in control:
        if elegidas_de_control == MAXIMO_DE_ESTRELLAS_DE_CONTROL:
            break
        coordenadas = [posicion_en(estrella_fija, a.recorte.observacion.mjd) for a in alineadas]
        posiciones = _posiciones(rejilla, alineadas, coordenadas)
        if not all(p.dentro_del_campo and _lejos_del_borde(rejilla, p.x, p.y) for p in posiciones):
            continue
        # Donde la estrella tiene píxeles enmascarados encima, su centroide
        # mediría la máscara y no la alineación: esa época no se mide.
        tapadas = [
            _hay_mascara_cerca(a, rejilla, p.x, p.y, RADIO_DE_MASCARA_DE_CONTROL_PX)
            for a, p in zip(alineadas, posiciones, strict=True)
        ]
        if sum(tapadas) * 2 > len(alineadas):
            continue
        deteccion = _detecciones(sin_fondo, alineadas, posiciones, saltear=tapadas)
        if len(deteccion) < len(alineadas) - sum(tapadas):
            continue
        for k, tapada in enumerate(tapadas):
            medidas_por_epoca[k] += 0 if tapada else 1
        conocidos.append(
            ObjetoConocido(
                nombre=estrella_fija.nombre,
                tipo="estrella",
                posiciones=posiciones,
                deteccion=deteccion,
                fuente="Gaia DR3",
                consultado_en=consultado_control,
                magnitud=None
                if estrella_fija.magnitud is None
                else Magnitud(valor=estrella_fija.magnitud, banda=estrella_fija.banda),
            )
        )
        elegidas_de_control += 1
    pocas = [
        a.recorte.observacion.id_de_epoca
        for a, n in zip(alineadas, medidas_por_epoca, strict=True)
        if n < ESTRELLAS_DE_CONTROL
    ]
    if pocas:
        avisos.append(
            _aviso(
                f"En {len(pocas)} épocas hay menos de {ESTRELLAS_DE_CONTROL} estrellas de "
                f"catálogo medibles para controlar la alineación: {', '.join(pocas)}.",
                f"In {len(pocas)} epochs fewer than {ESTRELLAS_DE_CONTROL} catalogue stars "
                f"can be measured to check the alignment: {', '.join(pocas)}.",
            )
        )

    procedencia = Procedencia(
        version_pipeline=version_de_la_aplicacion(),
        irsa_consultado_en=resultado.consultado_en,
    )
    campo = Campo(
        id=definicion.id,
        nombre=definicion.nombre,
        descripcion=definicion.descripcion,
        centro=centro,
        tamano_grados=definicion.tamano_grados,
        detector=definicion.detector,
        rejilla=RejillaDelContrato(
            ancho_px=rejilla.ancho,
            alto_px=rejilla.alto,
            escala_arcsec_px=rejilla.escala_arcsec,
            wcs=rejilla.cabecera(),
        ),
        estiramiento=Estiramiento(
            tipo="asinh", minimo=round(escala.minimo, 6), maximo=round(escala.maximo, 6)
        ),
        epocas=epocas,
        referencia=ruta("referencia.webp"),
        rastro=None,
        conocidos=conocidos,
        candidatos=[],
        geometria=geometria,
        limites=None,
        avisos=avisos,
        creditos=CREDITOS,
        procedencia=procedencia,
    )
    escribir_documento(campo, carpeta / "campo.json")
    resumen = ResumenDeCampo(
        id=campo.id,
        nombre=campo.nombre,
        centro=campo.centro,
        tamano_grados=campo.tamano_grados,
        detector=campo.detector,
        cantidad_epocas=len(campo.epocas),
        objeto_destacado=destacado.nombre,
        miniatura=ruta("miniatura.webp"),
    )
    return CampoGenerado(resumen=resumen, campo=campo)


def _punto(epoca_id: str, x: float, y: float, z: float) -> PuntoHeliocentrico:
    return PuntoHeliocentrico(
        epoca_id=epoca_id, x_ua=round(x, 9), y_ua=round(y, 9), z_ua=round(z, 9)
    )


def _lejos_del_borde(rejilla: Rejilla, x: float, y: float, margen: float = 6.5) -> bool:
    """Si cabe la apertura con su anillo de fondo sin salirse de la rejilla."""
    return margen <= x <= rejilla.ancho - 1 - margen and margen <= y <= rejilla.alto - 1 - margen


def _hay_mascara_cerca(
    alineada: EpocaAlineada, rejilla: Rejilla, x: float, y: float, radio: float = 2.0
) -> bool:
    """Si la rejilla tiene píxeles inválidos a menos de `radio` px de (x, y)."""
    filas, columnas = np.mgrid[0 : rejilla.alto, 0 : rejilla.ancho]
    cerca = np.hypot(columnas - x, filas - y) <= radio
    return bool((~alineada.valido & cerca).any())


def _avisos_del_cuerpo(
    nombre: str,
    posiciones: Sequence[PosicionEsperada],
    deteccion: Sequence[DeteccionDeConocido],
) -> list[TextoTraducido]:
    """Lo que no cumple RF-32 se dice en el campo, época por época."""
    avisos = []
    dentro = [p for p in posiciones if p.dentro_del_campo]
    if len(dentro) >= 2:
        corrimiento = math.hypot(dentro[-1].x - dentro[0].x, dentro[-1].y - dentro[0].y)
        if corrimiento < DESPLAZAMIENTO_MINIMO_PX:
            avisos.append(
                _aviso(
                    f"{nombre} se corre sólo {_es(corrimiento)} px en las épocas del campo.",
                    f"{nombre} moves only {corrimiento:.1f} px across the field epochs.",
                )
            )
    if len(dentro) < 3:
        avisos.append(
            _aviso(
                f"{nombre} cae dentro del campo en {len(dentro)} épocas; RF-32 pide 3.",
                f"{nombre} falls inside the field in {len(dentro)} epochs; 3 are required.",
            )
        )
    medidas = {d.epoca_id: d for d in deteccion}
    for posicion in dentro:
        medida = medidas.get(posicion.epoca_id)
        if medida is None:
            es, en = "no se pudo medir", "could not be measured"
        elif medida.snr < UMBRAL_DE_DETECCION_SNR:
            es = f"S/N {_es(medida.snr)}, por debajo de {UMBRAL_DE_DETECCION_SNR:.0f}"
            en = f"S/N {medida.snr:.1f}, below {UMBRAL_DE_DETECCION_SNR:.0f}"
        elif medida.distancia_px > DISTANCIA_MAXIMA_DE_DETECCION_PX:
            es = f"la fuente medida quedó a {_es(medida.distancia_px)} px de la efeméride"
            en = f"the measured source is {medida.distancia_px:.1f} px from the ephemeris"
        else:
            continue
        avisos.append(
            _aviso(
                f"Época {posicion.epoca_id}: {nombre} no se detecta con claridad ({es}).",
                f"Epoch {posicion.epoca_id}: {nombre} is not clearly detected ({en}).",
            )
        )
    return avisos
