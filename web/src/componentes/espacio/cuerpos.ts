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
  radioKm: number
  textura: string
}

export const SOL: DatosDeCuerpo = { radioKm: 695_700, textura: 'sol' }

export const PLANETAS_DE_LA_ESCENA: Record<Planeta, DatosDeCuerpo> = {
  mercurio: { radioKm: 2_439.7, textura: 'mercurio' },
  venus: { radioKm: 6_051.8, textura: 'venus' },
  tierra: { radioKm: 6_371, textura: 'tierra' },
  marte: { radioKm: 3_389.5, textura: 'marte' },
  jupiter: { radioKm: 69_911, textura: 'jupiter' },
  saturno: { radioKm: 58_232, textura: 'saturno' },
  urano: { radioKm: 25_362, textura: 'urano' },
  neptuno: { radioKm: 24_622, textura: 'neptuno' },
}

/** El nombre de Makemake es propio: el mismo en los dos idiomas. */
export const NOMBRE_DE_MAKEMAKE = 'Makemake'

export const MAKEMAKE: DatosDeCuerpo = {
  radioKm: 715,
  textura: 'makemake-ilustracion',
}

export function rutaDeTextura(nombre: string, base: string = import.meta.env.BASE_URL): string {
  const prefijo = base.endsWith('/') ? base : `${base}/`
  return `${prefijo}texturas/${nombre}.webp`
}
