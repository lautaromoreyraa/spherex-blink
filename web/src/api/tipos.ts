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
  referencia: string
  /**
   * Máximo por píxel (RF-17)
   */
  rastro: string | null
  conocidos: ObjetoConocido[]
  candidatos: Candidato[]
  limites: Limites | null
  avisos: TextoTraducido[]
  creditos: string
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
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "Estiramiento".
 */
export interface Estiramiento {
  tipo: 'lineal' | 'asinh'
  /**
   * MJy/sr que se pintan negros
   */
  minimo: number
  /**
   * MJy/sr que se pintan blancos
   */
  maximo: number
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
 * Cuerpo del Sistema Solar o estrella de catálogo con posición esperada.
 *
 * This interface was referenced by `Contrato`'s JSON-Schema
 * via the `definition` "ObjetoConocido".
 */
export interface ObjetoConocido {
  nombre: string
  tipo: 'estrella' | 'asteroide' | 'cometa' | 'tno' | 'planeta' | 'enana-marron'
  posiciones: PosicionEsperada[]
  fuente: 'SkyBoT' | 'Horizons' | 'SIMBAD'
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
