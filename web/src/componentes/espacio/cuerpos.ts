import type { Planeta } from '../../util/efemerides.ts'
import type { Clave, Valores } from '../../util/textos.ts'

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

/**
 * Ids de los cuerpos en el orden en que se recorren con Tab. Están acá y no
 * se sacan de efemerides.ts para que la página los liste sin cargar
 * astronomy-engine, que va en el chunk 3D (RNF-13).
 */
export const IDS_DE_CUERPOS = [
  'sol',
  'mercurio',
  'venus',
  'tierra',
  'marte',
  'jupiter',
  'saturno',
  'urano',
  'neptuno',
] as const satisfies readonly ('sol' | Planeta)[]

/** El objeto del campo (Makemake), cuando el campo tiene `geometria`. */
export const ID_DEL_OBJETO = 'objeto'

/** Nombre traducido de un cuerpo (RNF-06); el del objeto es propio. */
export function rotuloDelCuerpo(
  t: (clave: Clave, valores?: Valores) => string,
  id: string,
  objeto: { nombre: string; ilustracion: boolean } | null,
): string {
  if (id === ID_DEL_OBJETO && objeto) {
    return objeto.ilustracion ? t('escena.ilustracion', { nombre: objeto.nombre }) : objeto.nombre
  }
  return t(`escena.cuerpo.${id}` as Clave)
}

export function rutaDeTextura(nombre: string, base: string = import.meta.env.BASE_URL): string {
  const prefijo = base.endsWith('/') ? base : `${base}/`
  return `${prefijo}texturas/${nombre}.webp`
}
