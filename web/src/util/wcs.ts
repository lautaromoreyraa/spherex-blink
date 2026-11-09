/**
 * Píxel de la rejilla ↔ cielo con la cabecera WCS de `campo.json` (RF-16).
 *
 * La rejilla del pipeline es una proyección gnomónica (TAN) norte arriba,
 * sin distorsión SIP. Se implementa la proyección directa en vez de traer
 * una librería de WCS entera: alcanza con CRVAL, CRPIX y CDELT (o la matriz
 * CD/PC si estuviera). Las fórmulas son las de Calabretta y Greisen (2002),
 * «Representations of celestial coordinates in FITS», con LONPOLE = 180°.
 *
 * Convención del contrato: (x, y) con origen en el centro del píxel de arriba
 * a la izquierda e y hacia abajo. FITS cuenta desde 1 y con y hacia arriba,
 * así que el píxel FITS es (x + 1, alto − y).
 */
import type { Rejilla } from '../api/tipos.ts'

const GRADOS = Math.PI / 180

export interface Cielo {
  ra: number
  dec: number
}

export interface Pixel {
  x: number
  y: number
}

export interface Wcs {
  aCielo(x: number, y: number): Cielo
  aPixel(ra: number, dec: number): Pixel
}

function numero(wcs: Rejilla['wcs'], clave: string, defecto?: number): number {
  const valor = wcs[clave]
  if (typeof valor === 'number') return valor
  if (defecto !== undefined) return defecto
  throw new Error(`Falta ${clave} en la cabecera WCS de la rejilla`)
}

export function crearWcs(rejilla: Rejilla): Wcs {
  const cabecera = rejilla.wcs
  const ctype1 = String(cabecera.CTYPE1 ?? '')
  const ctype2 = String(cabecera.CTYPE2 ?? '')
  if (!ctype1.endsWith('-TAN') || !ctype2.endsWith('-TAN')) {
    throw new Error(`Sólo se admite la proyección TAN; la rejilla es ${ctype1} / ${ctype2}`)
  }
  const ra0 = numero(cabecera, 'CRVAL1') * GRADOS
  const dec0 = numero(cabecera, 'CRVAL2') * GRADOS
  const crpix1 = numero(cabecera, 'CRPIX1')
  const crpix2 = numero(cabecera, 'CRPIX2')
  // Matriz lineal píxel → coordenadas intermedias en grados: CD si está, si
  // no PC escalada por CDELT.
  let m11: number, m12: number, m21: number, m22: number
  if (typeof cabecera.CD1_1 === 'number') {
    m11 = numero(cabecera, 'CD1_1')
    m12 = numero(cabecera, 'CD1_2', 0)
    m21 = numero(cabecera, 'CD2_1', 0)
    m22 = numero(cabecera, 'CD2_2')
  } else {
    const cdelt1 = numero(cabecera, 'CDELT1')
    const cdelt2 = numero(cabecera, 'CDELT2')
    m11 = cdelt1 * numero(cabecera, 'PC1_1', 1)
    m12 = cdelt1 * numero(cabecera, 'PC1_2', 0)
    m21 = cdelt2 * numero(cabecera, 'PC2_1', 0)
    m22 = cdelt2 * numero(cabecera, 'PC2_2', 1)
  }
  const determinante = m11 * m22 - m12 * m21
  const alto = rejilla.alto_px
  const sinDec0 = Math.sin(dec0)
  const cosDec0 = Math.cos(dec0)

  return {
    aCielo(x, y) {
      const u = x + 1 - crpix1
      const v = alto - y - crpix2
      const xi = (m11 * u + m12 * v) * GRADOS
      const eta = (m21 * u + m22 * v) * GRADOS
      const denominador = cosDec0 - eta * sinDec0
      const ra = ra0 + Math.atan2(xi, denominador)
      const dec = Math.atan2(sinDec0 + eta * cosDec0, Math.hypot(xi, denominador))
      return { ra: (((ra / GRADOS) % 360) + 360) % 360, dec: dec / GRADOS }
    },
    aPixel(ra, dec) {
      const alfa = ra * GRADOS - ra0
      const delta = dec * GRADOS
      const coseno = Math.sin(delta) * sinDec0 + Math.cos(delta) * cosDec0 * Math.cos(alfa)
      const xi = (Math.cos(delta) * Math.sin(alfa)) / coseno / GRADOS
      const eta =
        (Math.sin(delta) * cosDec0 - Math.cos(delta) * sinDec0 * Math.cos(alfa)) / coseno / GRADOS
      const u = (m22 * xi - m12 * eta) / determinante
      const v = (-m21 * xi + m11 * eta) / determinante
      return { x: u + crpix1 - 1, y: alto - (v + crpix2) }
    },
  }
}

function sexagesimal(valor: number, decimales: number): [number, number, number] {
  const factor = 10 ** decimales
  let total = Math.round(Math.abs(valor) * 3600 * factor)
  const enteros = Math.floor(total / factor)
  total -= enteros * factor
  const h = Math.floor(enteros / 3600)
  const m = Math.floor((enteros % 3600) / 60)
  const s = (enteros % 60) + total / factor
  return [h, m, s]
}

const dos = (n: number) => String(n).padStart(2, '0')

/** Ascensión recta en horas: `17h 57m 48,5s`. */
export function formatearRa(ra: number, separadorDecimal = ','): string {
  const [h, m, s] = sexagesimal((((ra % 360) + 360) % 360) / 15, 1)
  const [enteros, decimales] = s.toFixed(1).split('.')
  return `${dos(h % 24)}h ${dos(m)}m ${dos(Number(enteros))}${separadorDecimal}${decimales}s`
}

/** Declinación en grados: `+04° 41′ 36″`. */
export function formatearDec(dec: number): string {
  const [g, m, s] = sexagesimal(dec, 0)
  const signo = dec < 0 ? '−' : '+'
  return `${signo}${dos(g)}° ${dos(m)}′ ${dos(Math.round(s))}″`
}
