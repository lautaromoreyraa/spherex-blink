/**
 * Reglas del parpadeo (RF-11, RNF-04).
 *
 * WCAG 2.3.1 pide tres destellos o menos por segundo. El tope queda en 2,5
 * cambios por segundo (400 ms entre cuadros) y no en 3: setInterval tiene
 * jitter, y con 334 ms se midieron huecos de 322 ms, así que en algún
 * segundo suelto entraban 4 cambios. Con 400 ms hace falta un retraso de
 * más de 65 ms acumulado en contra para que entren 4, y el navegador atrasa,
 * no adelanta. El temporizador nunca pide menos, aunque la interfaz le pase
 * otra velocidad.
 */
import type { Epoca } from '../api/tipos.ts'

export const CAMBIOS_POR_SEGUNDO_MAXIMO = 2.5

/** Intervalo mínimo entre cuadros del parpadeo, en ms. */
export const INTERVALO_MINIMO_MS = 400
export const CAMBIOS_POR_SEGUNDO_MINIMO = 0.5
export const CAMBIOS_POR_SEGUNDO_INICIAL = 1.5

/** Milisegundos entre cuadros, nunca por debajo de INTERVALO_MINIMO_MS. */
export function intervaloSeguro(cambiosPorSegundo: number): number {
  const pedido = Number.isFinite(cambiosPorSegundo)
    ? cambiosPorSegundo
    : CAMBIOS_POR_SEGUNDO_INICIAL
  const acotado = Math.min(CAMBIOS_POR_SEGUNDO_MAXIMO, Math.max(CAMBIOS_POR_SEGUNDO_MINIMO, pedido))
  return Math.max(INTERVALO_MINIMO_MS, Math.ceil(1000 / acotado))
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
