/**
 * Contrato de datos de spherex-blink.
 *
 * Archivo generado por `python -m contrato.generar` desde
 * contrato/esquemas/contrato.schema.json. No editar a mano: cambiar los
 * modelos de contrato/ y volver a generar.
 */

/**
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "PedidoDeTrabajo".
 */
export type PedidoDeTrabajo = PedidoPorCoordenadas | PedidoPorNombre

export interface Contrato {
  [k: string]: unknown
}
/**
 * Raíz de `campo.json`.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Campo".
 */
export interface Campo {
  /**
   * Identificador en kebab-case
   */
  id: string
  nombre: TextoTraducido
  descripcion: TextoTraducido
  centro: Coordenadas
  /**
   * Lado del campo en grados
   */
  tamano_grados: number
  detector: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'
  rejilla: Rejilla
  estiramiento: Estiramiento
  /**
   * Ordenadas por mjd
   */
  epocas: Epoca[]
  /**
   * Mediana de las épocas
   */
  referencia: string | null
  /**
   * Escala de los WebP de diferencia; null si el campo no tiene diferencias
   */
  escala_diferencia: EscalaDeDiferencia | null
  /**
   * Máximo por píxel (RF-17)
   */
  rastro: string | null
  conocidos: ObjetoConocido[]
  candidatos: Candidato[]
  /**
   * Para la escena 3D; null si el campo no sigue un cuerpo del Sistema Solar
   */
  geometria: Geometria | null
  limites: Limites | null
  avisos: TextoTraducido[]
  creditos: string
  procedencia: Procedencia
}
/**
 * Texto en los dos idiomas de la interfaz (RNF-06).
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "TextoTraducido".
 */
export interface TextoTraducido {
  es: string
  en: string
}
/**
 * Punto del cielo en grados ICRS.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Coordenadas".
 */
export interface Coordenadas {
  /**
   * Ascensión recta ICRS en grados
   */
  ra: number
  /**
   * Declinación ICRS en grados
   */
  dec: number
}
/**
 * Rejilla común norte arriba a la que se reproyectan todas las épocas.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Rejilla".
 */
export interface Rejilla {
  ancho_px: number
  alto_px: number
  /**
   * Segundos de arco por píxel
   */
  escala_arcsec_px: number
  /**
   * Cabecera FITS TAN de la rejilla, como diccionario
   */
  wcs: {
    [k: string]: string | number | boolean
  }
}
/**
 * Escala de brillo común a todas las épocas del campo (RF-05).
 *
 * Con estos tres números el visor deshace el estiramiento de cada WebP y
 * vuelve a MJy/sr (RF-37): un gris ``g`` de 0 a 255 vale
 * ``minimo + (maximo - minimo) * a * sinh(g / 255 * asinh(1 / a))``, con
 * ``a = parametro_asinh``. Los valores son con el fondo mediano de cada época
 * ya restado.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Estiramiento".
 */
export interface Estiramiento {
  tipo: 'lineal' | 'asinh'
  /**
   * MJy/sr (fondo restado) que se pintan negros
   */
  minimo: number
  /**
   * MJy/sr (fondo restado) que se pintan blancos
   */
  maximo: number
  /**
   * Parámetro a de asinh(x / a) / asinh(1 / a); null con estiramiento lineal
   */
  parametro_asinh: number | null
}
/**
 * Un recorte usado en el campo.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Epoca".
 */
export interface Epoca {
  /**
   * Identificador en kebab-case
   */
  id: string
  /**
   * Inicio de la observación (time_bounds_lower) en MJD
   */
  mjd: number
  /**
   * Inicio de la observación en UTC
   */
  fecha_utc: string
  /**
   * Número de pasada de SPHEREx
   */
  pasada: number
  fuente: FuenteDeEpoca
  /**
   * Longitud de onda central en el centro
   */
  longitud_onda_um: number
  /**
   * Fracción enmascarada por FLAGS
   */
  fraccion_mala: number
  /**
   * Ruta relativa a web/public/datos/ (o servida por la API en el modo en vivo)
   */
  imagen: string
  /**
   * Diferencia contra la mediana de las otras épocas; null con menos de 3
   */
  diferencia: string | null
}
/**
 * De qué archivo de IRSA salió la época (RF-15, RNF-07).
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "FuenteDeEpoca".
 */
export interface FuenteDeEpoca {
  /**
   * URI de IRSA del archivo L2
   */
  uri: string
  planeid: string
  version_proceso: string
}
/**
 * Cómo se pasó la diferencia a los WebP (RF-06, RF-12).
 *
 * Lineal y simétrica alrededor del gris 128 («sin cambio»): un gris ``g``
 * vale ``(g - 128) / 127 * limite`` MJy/sr, de modo que 255 es ``+limite``
 * (más brillo que la mediana de las otras épocas) y 1 es ``-limite``. Lo que
 * pasa del límite queda recortado en los extremos.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "EscalaDeDiferencia".
 */
export interface EscalaDeDiferencia {
  tipo: 'lineal-simetrica'
  /**
   * MJy/sr que se pintan en los extremos (±)
   */
  limite: number
}
/**
 * Cuerpo del Sistema Solar o estrella de catálogo con posición esperada.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "ObjetoConocido".
 */
export interface ObjetoConocido {
  nombre: string
  tipo: 'estrella' | 'asteroide' | 'cometa' | 'tno' | 'planeta-enano' | 'enana-marron'
  posiciones: PosicionEsperada[]
  /**
   * Mediciones en la imagen; vacía si no se midió
   */
  deteccion: DeteccionDeConocido[]
  fuente: 'SkyBoT' | 'Horizons' | 'SIMBAD' | 'Gaia DR3'
  consultado_en: string
  magnitud: Magnitud | null
}
/**
 * Dónde tenía que estar un objeto conocido en una época.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "PosicionEsperada".
 */
export interface PosicionEsperada {
  /**
   * Identificador en kebab-case
   */
  epoca_id: string
  /**
   * Ascensión recta ICRS en grados
   */
  ra: number
  /**
   * Declinación ICRS en grados
   */
  dec: number
  /**
   * Píxel de la rejilla, origen arriba a la izquierda
   */
  x: number
  /**
   * Píxel de la rejilla, origen arriba a la izquierda
   */
  y: number
  dentro_del_campo: boolean
  /**
   * Distancia al observador en UA; null para las estrellas
   */
  distancia_ua: number | null
}
/**
 * Dónde se midió un objeto conocido en una época y a cuánto quedó de lo esperado.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "DeteccionDeConocido".
 */
export interface DeteccionDeConocido {
  /**
   * Identificador en kebab-case
   */
  epoca_id: string
  /**
   * Centroide medido, en píxeles de la rejilla
   */
  x: number
  /**
   * Centroide medido, en píxeles de la rejilla
   */
  y: number
  /**
   * Relación señal/ruido de la medición
   */
  snr: number
  /**
   * Distancia a la posición esperada
   */
  distancia_px: number
}
/**
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Magnitud".
 */
export interface Magnitud {
  valor: number
  banda: string
}
/**
 * Grupo de detecciones compatible con un movimiento; no es un descubrimiento.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Candidato".
 */
export interface Candidato {
  /**
   * Identificador en kebab-case
   */
  id: string
  /**
   * @minItems 3
   */
  detecciones: [Deteccion, Deteccion, Deteccion, ...Deteccion[]]
  velocidad_arcsec_h: number
  angulo_posicion_grados: number
  residuo_arcsec: number
  /**
   * Enlaces espurios esperados (RF-21)
   */
  falsas_alarmas_esperadas: number
  identificacion: Identificacion
}
/**
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Deteccion".
 */
export interface Deteccion {
  /**
   * Identificador en kebab-case
   */
  epoca_id: string
  x: number
  y: number
  /**
   * Ascensión recta ICRS en grados
   */
  ra: number
  /**
   * Declinación ICRS en grados
   */
  dec: number
  /**
   * Relación señal/ruido de la detección
   */
  snr: number
}
/**
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Identificacion".
 */
export interface Identificacion {
  estado: 'conocido' | 'sin-identificar'
  nombre: string | null
  distancia_arcsec: number | null
}
/**
 * Dónde estaban la Tierra y el objeto cuando se tomó cada época (JPL Horizons).
 *
 * La escena 3D dibuja exactamente esta geometría, la misma que usó el
 * pipeline para marcar al objeto, en vez de recalcularla en el navegador.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Geometria".
 */
export interface Geometria {
  marco: 'heliocentrico-ecliptico-J2000'
  tierra: PuntoHeliocentrico[]
  objeto: ObjetoEnLaEscena
}
/**
 * Posición de un cuerpo en una época, centrada en el Sol (RF-34, RF-35).
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "PuntoHeliocentrico".
 */
export interface PuntoHeliocentrico {
  /**
   * Identificador en kebab-case
   */
  epoca_id: string
  x_ua: number
  y_ua: number
  z_ua: number
}
/**
 * El cuerpo del Sistema Solar del campo, con su posición en cada época.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "ObjetoEnLaEscena".
 */
export interface ObjetoEnLaEscena {
  nombre: string
  posiciones: PuntoHeliocentrico[]
}
/**
 * Límites medidos por inyección de objetos falsos (RF-27).
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Limites".
 */
export interface Limites {
  umbral_sigma: number
  profundidad_5sigma: Profundidad
  recuperacion: PuntoDeRecuperacion[]
}
/**
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Profundidad".
 */
export interface Profundidad {
  /**
   * Brillo de superficie a 5σ en MJy/sr
   */
  mjy_sr: number
  /**
   * Magnitud equivalente, si se puede calcular
   */
  magnitud: number | null
}
/**
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "PuntoDeRecuperacion".
 */
export interface PuntoDeRecuperacion {
  brillo: number
  fraccion_recuperada: number
}
/**
 * Con qué versión del pipeline y cuándo se consultó IRSA (RNF-12).
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Procedencia".
 */
export interface Procedencia {
  version_pipeline: string
  /**
   * Cuándo se buscaron las observaciones
   */
  irsa_consultado_en: string
}
/**
 * Cuerpo de toda respuesta de error.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "ErrorDeApi".
 */
export interface ErrorDeApi {
  codigo: string
  mensaje: string
}
/**
 * Raíz de `indice.json`.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Indice".
 */
export interface Indice {
  /**
   * Versión del contrato con que se generó
   */
  version_contrato: string
  /**
   * Cuándo corrió el pipeline (UTC)
   */
  generado_en: string
  campos: ResumenDeCampo[]
}
/**
 * Lo que la página de inicio necesita para listar un campo.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "ResumenDeCampo".
 */
export interface ResumenDeCampo {
  /**
   * Identificador en kebab-case
   */
  id: string
  nombre: TextoTraducido
  centro: Coordenadas
  /**
   * Lado del campo en grados
   */
  tamano_grados: number
  detector: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'
  /**
   * Épocas incluidas en el campo
   */
  cantidad_epocas: number
  /**
   * Lo que hay que mirar en el campo
   */
  objeto_destacado: string | null
  /**
   * Ruta relativa a web/public/datos/ (o servida por la API en el modo en vivo)
   */
  miniatura: string
}
/**
 * `POST /trabajos` con el centro del campo.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "PedidoPorCoordenadas".
 */
export interface PedidoPorCoordenadas {
  /**
   * Ascensión recta ICRS en grados
   */
  ra: number
  /**
   * Declinación ICRS en grados
   */
  dec: number
  /**
   * Lado del campo en grados
   */
  tamano_grados: number
  detector: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'
}
/**
 * `POST /trabajos` con el nombre de un objeto.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "PedidoPorNombre".
 */
export interface PedidoPorNombre {
  nombre: string
  /**
   * Lado del campo en grados
   */
  tamano_grados: number
  detector: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'
}
/**
 * Respuesta de `GET /salud`.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Salud".
 */
export interface Salud {
  estado: 'ok'
  version: string
}
/**
 * Respuesta de `GET /trabajos/{trabajo_id}`.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Trabajo".
 */
export interface Trabajo {
  estado: 'pendiente' | 'en-curso' | 'parcial' | 'listo' | 'error'
  progreso: number
  epocas_listas: number
  epocas_totales: number
  errores: ErrorDeApi[]
  campo: Campo | null
}
/**
 * Respuesta de `POST /trabajos`.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "TrabajoCreado".
 */
export interface TrabajoCreado {
  trabajo_id: string
}
