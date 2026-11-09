/**
 * Lo que la ficha de procedencia tiene que advertir (RF-15).
 */
import type { Epoca } from '../api/tipos.ts'

/** RF-15: más de 0,05 µm entre épocas ya cambia lo que se ve, no sólo dónde. */
export const UMBRAL_DE_LONGITUD_DE_ONDA_UM = 0.05

export interface RangoDeLongitudDeOnda {
  minimo: number
  maximo: number
  difiere: boolean
}

export function rangoDeLongitudDeOnda(epocas: readonly Epoca[]): RangoDeLongitudDeOnda | null {
  if (epocas.length === 0) return null
  const valores = epocas.map((e) => e.longitud_onda_um)
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  // Se compara redondeado a 1e-9 para que 0,05 justo no cuente como «más de».
  const difiere =
    Math.round((maximo - minimo) * 1e9) > Math.round(UMBRAL_DE_LONGITUD_DE_ONDA_UM * 1e9)
  return { minimo, maximo, difiere }
}

/**
 * Enlace al archivo de IRSA de la época. Sólo se aceptan URI https de IRSA:
 * lo que venga en el JSON termina en un `href`, y un `javascript:` ahí sería
 * un agujero.
 */
export function enlaceDeIrsa(uri: string): string | null {
  try {
    const url = new URL(uri)
    if (url.protocol !== 'https:') return null
    if (url.hostname !== 'irsa.ipac.caltech.edu' && !url.hostname.endsWith('.ipac.caltech.edu')) {
      return null
    }
    return url.href
  } catch {
    return null
  }
}

/** Nombre del archivo L2, lo último de la URI, para mostrarlo sin la ruta entera. */
export function nombreDeArchivo(uri: string): string {
  const sinConsulta = uri.split(/[?#]/)[0] ?? uri
  return sinConsulta.split('/').filter(Boolean).pop() ?? uri
}
