/**
 * Del gris de los WebP a MJy/sr y de MJy/sr a una posición del mapa de color
 * (RF-37).
 *
 * Los WebP del pipeline guardan cada época estirada con asinh entre un mínimo
 * y un máximo comunes (RF-05), y la diferencia lineal y simétrica alrededor
 * del gris 128 (RF-06). El visor deshace esa codificación para volver al
 * brillo físico y lo vuelve a estirar con el rango que elija quien mira. El
 * shader hace exactamente estas cuentas; acá están en TypeScript para poder
 * probarlas y para el dibujo en canvas 2D cuando no hay WebGL.
 */
import type { EscalaDeDiferencia, Estiramiento } from '../api/tipos.ts'

/** Un estiramiento listo para usar: `a` es null cuando es lineal. */
export interface ParametrosDeEstiramiento {
  minimo: number
  maximo: number
  a: number | null
}

export interface RangoVisible {
  minimo: number
  maximo: number
}

/** Lo que recibe el shader como `vec4`: mínimo, máximo, a (0 = lineal) y tipo. */
export type Uniforme4 = readonly [number, number, number, number]

export const CODIFICACION_IMAGEN = 0
export const CODIFICACION_DIFERENCIA = 1

/** Parámetros del estiramiento con que el pipeline escribió los WebP. */
export function parametrosDeEstiramiento(estiramiento: Estiramiento): ParametrosDeEstiramiento {
  if (!(estiramiento.maximo > estiramiento.minimo)) {
    throw new Error('El estiramiento tiene que tener el máximo mayor que el mínimo')
  }
  if (estiramiento.tipo === 'asinh') {
    const a = estiramiento.parametro_asinh
    if (a === null || !(a > 0)) {
      throw new Error('Un estiramiento asinh necesita su parámetro mayor que cero')
    }
    return { minimo: estiramiento.minimo, maximo: estiramiento.maximo, a }
  }
  return { minimo: estiramiento.minimo, maximo: estiramiento.maximo, a: null }
}

/** Gris del WebP (0 a 255) → MJy/sr con el fondo restado. */
export function grisAMjySr(gris: number, p: ParametrosDeEstiramiento): number {
  const t = Math.min(255, Math.max(0, gris)) / 255
  const normalizado = p.a === null ? t : p.a * Math.sinh(t * Math.asinh(1 / p.a))
  return p.minimo + (p.maximo - p.minimo) * normalizado
}

/** MJy/sr → posición 0 a 1 en el mapa de color, con el rango visible. */
export function posicionEnElMapa(valor: number, rango: RangoVisible, a: number | null): number {
  const ancho = rango.maximo - rango.minimo
  const n = ancho > 0 ? Math.min(1, Math.max(0, (valor - rango.minimo) / ancho)) : 0
  return a === null ? n : Math.asinh(n / a) / Math.asinh(1 / a)
}

/** Inversa de `posicionEnElMapa`, para ubicar las marcas de la leyenda. */
export function valorEnLaPosicion(t: number, rango: RangoVisible, a: number | null): number {
  const u = Math.min(1, Math.max(0, t))
  const n = a === null ? u : a * Math.sinh(u * Math.asinh(1 / a))
  return rango.minimo + (rango.maximo - rango.minimo) * n
}

/** Gris del WebP de diferencia → MJy/sr: 128 es «sin cambio». */
export function grisDeDiferenciaAMjySr(gris: number, escala: EscalaDeDiferencia): number {
  return ((Math.min(255, Math.max(0, gris)) - 128) / 127) * escala.limite
}

/** MJy/sr de una diferencia → posición 0 a 1 en el mapa divergente (0,5 = sin cambio). */
export function posicionDivergente(valor: number, limite: number): number {
  if (!(limite > 0)) return 0.5
  return Math.min(1, Math.max(0, 0.5 + valor / (2 * limite)))
}

/** Uniforme del shader que decodifica una capa de imagen (época, mediana o rastro). */
export function uniformeDeImagen(p: ParametrosDeEstiramiento): Uniforme4 {
  return [p.minimo, p.maximo, p.a ?? 0, CODIFICACION_IMAGEN]
}

/** Uniforme del shader que decodifica una capa de diferencia. */
export function uniformeDeDiferencia(escala: EscalaDeDiferencia): Uniforme4 {
  return [escala.limite, 0, 0, CODIFICACION_DIFERENCIA]
}

/**
 * Rango visible acotado al del contrato: más allá de él los WebP no tienen
 * información (lo que pasaba del máximo ya quedó recortado en 255).
 */
export function acotarRango(rango: RangoVisible, p: ParametrosDeEstiramiento): RangoVisible {
  const paso = (p.maximo - p.minimo) / 255
  const minimo = Math.min(Math.max(rango.minimo, p.minimo), p.maximo - paso)
  const maximo = Math.max(Math.min(rango.maximo, p.maximo), minimo + paso)
  return { minimo, maximo }
}

export interface Marca {
  valor: number
  posicion: number
}

/** Números redondos entre el mínimo y el máximo: 1, 2 o 5 por una potencia de diez. */
function pasoRedondo(ancho: number, cantidad: number): number {
  const crudo = ancho / Math.max(1, cantidad)
  const potencia = 10 ** Math.floor(Math.log10(crudo))
  const relativo = crudo / potencia
  const factor = relativo <= 1 ? 1 : relativo <= 2 ? 2 : relativo <= 5 ? 5 : 10
  return factor * potencia
}

/** Marcas de la barra de color en MJy/sr, ubicadas con el mismo estiramiento. */
export function marcasDeEscala(rango: RangoVisible, a: number | null, cantidad = 4): Marca[] {
  const ancho = rango.maximo - rango.minimo
  if (!(ancho > 0)) return []
  // Con asinh las marcas lineales se amontonan arriba; se agrega el cero,
  // que es donde está el fondo y lo que más se mira.
  const paso = pasoRedondo(ancho, cantidad)
  const valores = new Set<number>()
  for (let v = Math.ceil(rango.minimo / paso) * paso; v <= rango.maximo + 1e-12; v += paso) {
    valores.add(Number(v.toPrecision(12)))
  }
  if (rango.minimo < 0 && rango.maximo > 0) valores.add(0)
  return [...valores]
    .sort((x, y) => x - y)
    .map((valor) => ({ valor, posicion: posicionEnElMapa(valor, rango, a) }))
}

/** Marcas de la escala divergente: −límite, 0 y +límite, y sus mitades. */
export function marcasDivergentes(limite: number): Marca[] {
  if (!(limite > 0)) return []
  return [-1, -0.5, 0, 0.5, 1].map((f) => ({
    valor: f * limite,
    posicion: posicionDivergente(f * limite, limite),
  }))
}
