/**
 * El color de cada píxel del visor, en TypeScript (RF-37).
 *
 * Es la misma cuenta que hace el shader de `componentes/visor/shaders/`; acá
 * sirve para el dibujo en canvas 2D cuando no hay WebGL y para probar la
 * lógica con Vitest. Si se cambia una, se cambia la otra.
 */
import { CODIFICACION_DIFERENCIA, posicionDivergente, type Uniforme4 } from './estiramiento.ts'

/** RGBA de una imagen del contrato: gris en R, G y B; alfa 0 donde no hay dato. */
export interface Pixeles {
  ancho: number
  alto: number
  datos: Uint8ClampedArray
}

export interface Visible {
  minimo: number
  maximo: number
  /** Parámetro de asinh; null = lineal. */
  a: number | null
}

export type ModoDePintura = 'simple' | 'cortina' | 'fundido' | 'resta'

/**
 * Verde azulado liso para lo que no tiene dato: ningún mapa del visor tiene
 * ese tono (un test lo comprueba) y, a diferencia de un gris claro, no se
 * confunde con una estrella.
 */
export const COLOR_SIN_DATO: readonly [number, number, number] = [0x2e, 0x7d, 0x6b]

/** Gris (0 a 255) → MJy/sr según la codificación de la capa (la misma del shader). */
export function decodificar(gris: number, c: Uniforme4): number {
  const g = gris / 255
  if (c[3] === CODIFICACION_DIFERENCIA) return ((g * 255 - 128) / 127) * c[0]
  if (c[2] > 0) return c[0] + (c[1] - c[0]) * c[2] * Math.sinh(g * Math.asinh(1 / c[2]))
  return c[0] + (c[1] - c[0]) * g
}

export function estirar(valor: number, v: Visible): number {
  const ancho = v.maximo - v.minimo
  const n = ancho > 0 ? Math.min(1, Math.max(0, (valor - v.minimo) / ancho)) : 0
  return v.a === null || !(v.a > 0) ? n : Math.asinh(n / v.a) / Math.asinh(1 / v.a)
}

function deTabla(tabla: Uint8Array, t: number): [number, number, number] {
  const i = Math.round(Math.min(1, Math.max(0, t)) * 255) * 4
  return [tabla[i]!, tabla[i + 1]!, tabla[i + 2]!]
}

export interface ParametrosDePintura {
  codificacionA: Uniforme4
  codificacionB: Uniforme4 | null
  visible: Visible
  /** ± MJy/sr en los extremos del mapa divergente (diferencia y resta). */
  limite: number
  modo: 'simple' | 'resta'
  mapa: Uint8Array
  divergente: Uint8Array
}

/**
 * Pinta píxel a píxel la capa A (o A − B en la resta) en `salida`, RGBA del
 * mismo tamaño que la imagen. La cortina y el fundido se arman después
 * combinando dos capas ya pintadas.
 */
export function pintarPixeles(
  a: Pixeles,
  b: Pixeles | null,
  p: ParametrosDePintura,
  salida: Uint8ClampedArray,
): void {
  const total = a.ancho * a.alto
  const divergente = p.modo === 'resta' || p.codificacionA[3] === CODIFICACION_DIFERENCIA
  for (let i = 0; i < total; i++) {
    const k = i * 4
    let color: readonly [number, number, number]
    const validoA = a.datos[k + 3]! >= 128
    if (p.modo === 'resta') {
      const validoB = b !== null && b.datos[k + 3]! >= 128 && p.codificacionB !== null
      if (!validoA || !validoB) {
        color = COLOR_SIN_DATO
      } else {
        const valor =
          decodificar(a.datos[k]!, p.codificacionA) - decodificar(b.datos[k]!, p.codificacionB!)
        color = deTabla(p.divergente, posicionDivergente(valor, p.limite))
      }
    } else if (!validoA) {
      color = COLOR_SIN_DATO
    } else {
      const valor = decodificar(a.datos[k]!, p.codificacionA)
      color = divergente
        ? deTabla(p.divergente, posicionDivergente(valor, p.limite))
        : deTabla(p.mapa, estirar(valor, p.visible))
    }
    salida[k] = color[0]
    salida[k + 1] = color[1]
    salida[k + 2] = color[2]
    salida[k + 3] = 255
  }
}

/** Valor en MJy/sr de un píxel, o null si no tiene dato. Para la lectura bajo el cursor. */
export function valorDelPixel(
  capa: Pixeles,
  codificacion: Uniforme4,
  x: number,
  y: number,
): number | null {
  if (x < 0 || y < 0 || x >= capa.ancho || y >= capa.alto) return null
  const k = (y * capa.ancho + x) * 4
  if (capa.datos[k + 3]! < 128) return null
  return decodificar(capa.datos[k]!, codificacion)
}
