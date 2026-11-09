import type { VectorUA } from './efemerides.ts'

/**
 * Del Sistema Solar en UA a coordenadas de la escena (RF-34, RNF-07).
 *
 * A escala real, Makemake queda a 52 veces la distancia de la Tierra y todos
 * los cuerpos son puntos invisibles: no se ve nada. Por eso la escena abre
 * en escala ilustrativa —distancias comprimidas con la raíz cuadrada y
 * tamaños agrandados— y lo dice en pantalla, con un interruptor para ver la
 * escala real. Las direcciones no se tocan: un planeta queda siempre en la
 * misma dirección vista desde el Sol, sólo cambia a qué distancia se dibuja.
 *
 * Los ejes: la escena usa el «y arriba» de three.js, así que la eclíptica
 * (x, y) queda en el piso (x, -z) y el polo norte de la eclíptica hacia arriba.
 */

export type ModoDeEscala = 'ilustrativa' | 'real'

export type PuntoDeEscena = readonly [number, number, number]

/** Unidades de la escena por UA (en real) o por √UA (en ilustrativa). */
export const UNIDADES_POR_UA = 10

const KM_POR_UA = 149_597_870.7
const RADIO_DE_LA_TIERRA_KM = 6371

export function distanciaEnEscena(distanciaUA: number, modo: ModoDeEscala): number {
  return modo === 'real'
    ? distanciaUA * UNIDADES_POR_UA
    : Math.sqrt(distanciaUA) * UNIDADES_POR_UA
}

/** Ejes eclípticos a los de three.js, sin cambiar la escala. */
export function ejesDeEscena(v: VectorUA): PuntoDeEscena {
  return [v.x, v.z, -v.y]
}

export function aEscena(v: VectorUA, modo: ModoDeEscala): PuntoDeEscena {
  const r = Math.hypot(v.x, v.y, v.z)
  if (r === 0) return [0, 0, 0]
  const factor = distanciaEnEscena(r, modo) / r
  return ejesDeEscena({ x: v.x * factor, y: v.y * factor, z: v.z * factor })
}

/**
 * Radio de un cuerpo en la escena. En ilustrativa crece con una potencia
 * menor a 1 para que Júpiter no tape la órbita de Marte ni Makemake
 * desaparezca, con un mínimo que se puede ver en el proyector.
 */
export function radioEnEscena(radioKm: number, modo: ModoDeEscala): number {
  if (modo === 'real') return (radioKm / KM_POR_UA) * UNIDADES_POR_UA
  return Math.max(0.25, 0.35 * (radioKm / RADIO_DE_LA_TIERRA_KM) ** 0.45)
}

export function resta(a: PuntoDeEscena, b: PuntoDeEscena): PuntoDeEscena {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function suma(a: PuntoDeEscena, b: PuntoDeEscena): PuntoDeEscena {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function escalar(a: PuntoDeEscena, k: number): PuntoDeEscena {
  return [a[0] * k, a[1] * k, a[2] * k]
}

export function largo(a: PuntoDeEscena): number {
  return Math.hypot(a[0], a[1], a[2])
}

export function normalizar(a: PuntoDeEscena): PuntoDeEscena {
  const l = largo(a)
  return l === 0 ? [0, 0, 0] : escalar(a, 1 / l)
}
