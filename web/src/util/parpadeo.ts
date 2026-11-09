/**
 * Reglas del parpadeo (RF-11, RNF-04).
 *
 * El tope de 3 cambios por segundo viene de WCAG 2.3.1 («tres destellos o
 * menos»): el temporizador nunca pide un intervalo menor, aunque la interfaz
 * le pase otra velocidad.
 */
import type { Epoca } from '../api/tipos.ts'

export const CAMBIOS_POR_SEGUNDO_MAXIMO = 3
export const CAMBIOS_POR_SEGUNDO_MINIMO = 0.5
export const CAMBIOS_POR_SEGUNDO_INICIAL = 1.5

/** Milisegundos entre cuadros, nunca por debajo de 1000 / 3. */
export function intervaloSeguro(cambiosPorSegundo: number): number {
  const pedido = Number.isFinite(cambiosPorSegundo)
    ? cambiosPorSegundo
    : CAMBIOS_POR_SEGUNDO_INICIAL
  const acotado = Math.min(CAMBIOS_POR_SEGUNDO_MAXIMO, Math.max(CAMBIOS_POR_SEGUNDO_MINIMO, pedido))
  return Math.ceil(1000 / acotado)
}

/**
 * Índice de la próxima época dentro de las elegidas, en orden de fecha y
 * dando la vuelta. Si la actual no está elegida, va a la elegida más cercana
 * en esa dirección.
 */
export function siguienteEpoca(elegidas: readonly number[], actual: number, paso: 1 | -1): number {
  if (elegidas.length === 0) return actual
  const ordenadas = [...elegidas].sort((a, b) => a - b)
  if (paso === 1) return ordenadas.find((i) => i > actual) ?? ordenadas[0]!
  return [...ordenadas].reverse().find((i) => i < actual) ?? ordenadas[ordenadas.length - 1]!
}

/** Las pasadas que hay en el campo, con sus índices de época. */
export function epocasPorPasada(epocas: readonly Epoca[]): Map<number, number[]> {
  const pasadas = new Map<number, number[]>()
  epocas.forEach((epoca, indice) => {
    pasadas.set(epoca.pasada, [...(pasadas.get(epoca.pasada) ?? []), indice])
  })
  return new Map([...pasadas.entries()].sort(([a], [b]) => a - b))
}
