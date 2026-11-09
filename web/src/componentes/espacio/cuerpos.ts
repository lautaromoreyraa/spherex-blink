import type { Planeta } from '../../util/efemerides.ts'

/**
 * Cuerpos que dibuja la escena, con su radio medio y su textura.
 *
 * Las texturas son de Solar System Scope (CC BY 4.0), convertidas a WebP y
 * servidas desde `web/public/texturas/` (RNF-01, RNF-13). La de Makemake es
 * de su colección «Fictional»: nadie fotografió su superficie, así que se
 * rotula como ilustración (RNF-07).
 */
export interface DatosDeCuerpo {
  nombre: string
  radioKm: number
  textura: string
}

export const SOL: DatosDeCuerpo = { nombre: 'Sol', radioKm: 695_700, textura: 'sol' }

export const PLANETAS_DE_LA_ESCENA: Record<Planeta, DatosDeCuerpo> = {
  mercurio: { nombre: 'Mercurio', radioKm: 2_439.7, textura: 'mercurio' },
  venus: { nombre: 'Venus', radioKm: 6_051.8, textura: 'venus' },
  tierra: { nombre: 'Tierra', radioKm: 6_371, textura: 'tierra' },
  marte: { nombre: 'Marte', radioKm: 3_389.5, textura: 'marte' },
  jupiter: { nombre: 'Júpiter', radioKm: 69_911, textura: 'jupiter' },
  saturno: { nombre: 'Saturno', radioKm: 58_232, textura: 'saturno' },
  urano: { nombre: 'Urano', radioKm: 25_362, textura: 'urano' },
  neptuno: { nombre: 'Neptuno', radioKm: 24_622, textura: 'neptuno' },
}

export const MAKEMAKE: DatosDeCuerpo = {
  nombre: 'Makemake',
  radioKm: 715,
  textura: 'makemake-ilustracion',
}

export function rutaDeTextura(nombre: string, base: string = import.meta.env.BASE_URL): string {
  const prefijo = base.endsWith('/') ? base : `${base}/`
  return `${prefijo}texturas/${nombre}.webp`
}
