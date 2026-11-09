import type { Epoca, Geometria, PuntoHeliocentrico } from '../api/tipos.ts'
import type { VectorUA } from './efemerides.ts'

/**
 * Líneas de visión y paralaje (RF-35).
 *
 * El ángulo entre dos líneas de visión Tierra→objeto es lo que el objeto se
 * corre contra las estrellas entre dos épocas. Se calcula con los vectores
 * heliocéntricos de `geometria`, que no dependen de cómo se midió la imagen:
 * por eso el test lo compara con la separación de las posiciones de Horizons
 * en `conocidos[]`, que salen de otra consulta.
 */

/** Escala de píxel de SPHEREx: 6,15″ por píxel. */
export const SEGUNDOS_POR_PIXEL = 6.15

const SEGUNDOS_POR_RADIAN = (180 * 3600) / Math.PI

export function aVector(punto: PuntoHeliocentrico): VectorUA {
  return { x: punto.x_ua, y: punto.y_ua, z: punto.z_ua }
}

function resta(a: VectorUA, b: VectorUA): VectorUA {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

/**
 * Ángulo entre dos vectores, en segundos de arco. Con atan2 de producto
 * vectorial y escalar en vez de acos: acos pierde precisión justo en ángulos
 * chicos como estos (unos pocos ″ sobre 52 UA).
 */
export function anguloEntre(a: VectorUA, b: VectorUA): number {
  const cruz = {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
  const escalar = a.x * b.x + a.y * b.y + a.z * b.z
  return Math.atan2(Math.hypot(cruz.x, cruz.y, cruz.z), escalar) * SEGUNDOS_POR_RADIAN
}

/** Separación entre dos puntos del cielo (RA y Dec en grados), en ″. */
export function separacionEnElCielo(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number,
): number {
  const aVectorDelCielo = (ra: number, dec: number): VectorUA => {
    const a = (ra * Math.PI) / 180
    const d = (dec * Math.PI) / 180
    return { x: Math.cos(d) * Math.cos(a), y: Math.cos(d) * Math.sin(a), z: Math.sin(d) }
  }
  return anguloEntre(aVectorDelCielo(ra1, dec1), aVectorDelCielo(ra2, dec2))
}

export function aPixeles(segundos: number): number {
  return segundos / SEGUNDOS_POR_PIXEL
}

export interface LineaDeVision {
  epocaId: string
  tierra: VectorUA
  objeto: VectorUA
  distanciaUA: number
}

/** Una línea Tierra→objeto por época, en el orden de `epocas`. */
export function lineasDeVision(geometria: Geometria, epocas: readonly Epoca[]): LineaDeVision[] {
  const lineas: LineaDeVision[] = []
  for (const epoca of epocas) {
    const tierra = geometria.tierra.find((p) => p.epoca_id === epoca.id)
    const objeto = geometria.objeto.posiciones.find((p) => p.epoca_id === epoca.id)
    if (!tierra || !objeto) continue
    const t = aVector(tierra)
    const o = aVector(objeto)
    const v = resta(o, t)
    lineas.push({ epocaId: epoca.id, tierra: t, objeto: o, distanciaUA: Math.hypot(v.x, v.y, v.z) })
  }
  return lineas
}

export interface Paralaje {
  /** Ángulo total entre las dos líneas de visión, en ″. */
  segundos: number
  pixeles: number
  /**
   * Parte del ángulo que viene sólo de que la Tierra se movió: el que habría
   * con el objeto quieto en su posición de la primera época.
   */
  segundosPorLaTierra: number
  /** Lo que se movió la Tierra entre las dos épocas, en UA. */
  baseUA: number
}

export function paralajeEntre(a: LineaDeVision, b: LineaDeVision): Paralaje {
  const segundos = anguloEntre(resta(a.objeto, a.tierra), resta(b.objeto, b.tierra))
  const segundosPorLaTierra = anguloEntre(resta(a.objeto, a.tierra), resta(a.objeto, b.tierra))
  const base = resta(b.tierra, a.tierra)
  return {
    segundos,
    pixeles: aPixeles(segundos),
    segundosPorLaTierra,
    baseUA: Math.hypot(base.x, base.y, base.z),
  }
}

export interface ResumenDePasadas {
  pasadas: number[]
  unaSola: boolean
}

/** Qué pasadas de SPHEREx hay entre las épocas, para aclarar el texto. */
export function resumenDePasadas(epocas: readonly Epoca[]): ResumenDePasadas {
  const pasadas = [...new Set(epocas.map((e) => e.pasada))].sort((x, y) => x - y)
  return { pasadas, unaSola: pasadas.length === 1 }
}
