import { Body, HelioVector, PlanetOrbitalPeriod, RotateVector, Rotation_EQJ_ECL } from 'astronomy-engine'

/**
 * Posiciones del Sistema Solar para la escena 3D (RF-34).
 *
 * Todo sale en el marco de `geometria` del contrato: centrado en el Sol, sobre
 * la eclíptica media de J2000 y en UA. Así los planetas que se calculan acá y
 * la Tierra y Makemake que trae el pipeline (de Horizons) comparten ejes y se
 * pueden dibujar juntos sin convertir nada en el componente.
 *
 * Los planetas los calcula astronomy-engine en el navegador: no necesita red y
 * su error para la Tierra y Júpiter es de milésimas de UA, muy por debajo de lo
 * que se ve en pantalla (el test lo compara contra Horizons).
 */

export interface VectorUA {
  x: number
  y: number
  z: number
}

export type Planeta =
  | 'mercurio'
  | 'venus'
  | 'tierra'
  | 'marte'
  | 'jupiter'
  | 'saturno'
  | 'urano'
  | 'neptuno'

const CUERPOS: Record<Planeta, Body> = {
  mercurio: Body.Mercury,
  venus: Body.Venus,
  tierra: Body.Earth,
  marte: Body.Mars,
  jupiter: Body.Jupiter,
  saturno: Body.Saturn,
  urano: Body.Uranus,
  neptuno: Body.Neptune,
}

export const PLANETAS: readonly Planeta[] = Object.keys(CUERPOS) as Planeta[]

const DE_ECUATORIAL_A_ECLIPTICA = Rotation_EQJ_ECL()

/** Posición heliocéntrica eclíptica J2000 de un planeta en una fecha (UTC). */
export function posicionHeliocentrica(planeta: Planeta, fecha: Date): VectorUA {
  // HelioVector devuelve ecuatorial J2000; Horizons y el contrato usan la
  // eclíptica, que es además el plano natural para dibujar las órbitas.
  const ecuatorial = HelioVector(CUERPOS[planeta], fecha)
  const { x, y, z } = RotateVector(DE_ECUATORIAL_A_ECLIPTICA, ecuatorial)
  return { x, y, z }
}

/**
 * Puntos de la órbita de un planeta: una vuelta completa empezando en la
 * fecha dada. Se muestrea la propia efeméride en lugar de usar una elipse
 * fija, así la línea pasa exactamente por donde se dibuja el planeta.
 */
export function orbitaDePlaneta(planeta: Planeta, fecha: Date, puntos = 128): VectorUA[] {
  const periodoDias = PlanetOrbitalPeriod(CUERPOS[planeta])
  const inicio = fecha.getTime()
  const pasoMs = (periodoDias * 86_400_000) / puntos
  return Array.from({ length: puntos + 1 }, (_, i) =>
    posicionHeliocentrica(planeta, new Date(inicio + i * pasoMs)),
  )
}

/** Elementos orbitales osculadores, heliocéntricos y sobre la eclíptica J2000. */
export interface ElementosOrbitales {
  semiejeUA: number
  excentricidad: number
  inclinacionGrados: number
  nodoAscendenteGrados: number
  argumentoDelPerihelioGrados: number
  anomaliaMediaGrados: number
  /** Época de los elementos, en milisegundos Unix. */
  epocaMs: number
  movimientoMedioGradosPorDia: number
}

const KM_POR_UA = 149_597_870.7

/**
 * Makemake no está en astronomy-engine. Su órbita se dibuja con los elementos
 * osculadores que da JPL Horizons (136472, centro 500@10, eclíptica J2000,
 * época JD TDB 2461200,5 = 2026-06-09), consultados el 2026-11-09. Sólo se
 * usan para la línea de la órbita: la posición de Makemake en cada época la
 * trae `geometria` del pipeline.
 */
export const ELEMENTOS_DE_MAKEMAKE: ElementosOrbitales = {
  semiejeUA: 6.817314566318714e9 / KM_POR_UA,
  excentricidad: 0.1588889957549268,
  inclinacionGrados: 29.02785603483134,
  nodoAscendenteGrados: 79.29483383882578,
  argumentoDelPerihelioGrados: 297.0922732911467,
  anomaliaMediaGrados: 169.9379962413635,
  epocaMs: Date.UTC(2026, 5, 9),
  movimientoMedioGradosPorDia: 3.708159862943009e-8 * 86_400,
}

const RAD = Math.PI / 180

function resolverKepler(anomaliaMedia: number, excentricidad: number): number {
  // Newton desde M: converge en pocas vueltas para e < 0,9.
  let excentrica = anomaliaMedia
  for (let i = 0; i < 20; i++) {
    const delta =
      (excentrica - excentricidad * Math.sin(excentrica) - anomaliaMedia) /
      (1 - excentricidad * Math.cos(excentrica))
    excentrica -= delta
    if (Math.abs(delta) < 1e-12) break
  }
  return excentrica
}

function puntoDeLaOrbita(elementos: ElementosOrbitales, anomaliaExcentrica: number): VectorUA {
  const { semiejeUA: a, excentricidad: e } = elementos
  // Posición en el plano de la órbita, con el perihelio sobre el eje x.
  const xp = a * (Math.cos(anomaliaExcentrica) - e)
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(anomaliaExcentrica)
  const w = elementos.argumentoDelPerihelioGrados * RAD
  const nodo = elementos.nodoAscendenteGrados * RAD
  const i = elementos.inclinacionGrados * RAD
  const cw = Math.cos(w)
  const sw = Math.sin(w)
  const cn = Math.cos(nodo)
  const sn = Math.sin(nodo)
  const ci = Math.cos(i)
  const si = Math.sin(i)
  return {
    x: (cn * cw - sn * sw * ci) * xp + (-cn * sw - sn * cw * ci) * yp,
    y: (sn * cw + cn * sw * ci) * xp + (-sn * sw + cn * cw * ci) * yp,
    z: sw * si * xp + cw * si * yp,
  }
}

/** Posición kepleriana (sin perturbaciones) en una fecha. */
export function posicionKepleriana(elementos: ElementosOrbitales, fecha: Date): VectorUA {
  const dias = (fecha.getTime() - elementos.epocaMs) / 86_400_000
  const media = (elementos.anomaliaMediaGrados + elementos.movimientoMedioGradosPorDia * dias) * RAD
  return puntoDeLaOrbita(elementos, resolverKepler(media, elementos.excentricidad))
}

/** La elipse completa, muestreada en anomalía excéntrica (pareja en el dibujo). */
export function orbitaKepleriana(elementos: ElementosOrbitales, puntos = 256): VectorUA[] {
  return Array.from({ length: puntos + 1 }, (_, k) =>
    puntoDeLaOrbita(elementos, (2 * Math.PI * k) / puntos),
  )
}

/** Oblicuidad de la eclíptica en J2000 (IAU 2006): 84381,406″. */
const OBLICUIDAD = (84381.406 / 3600) * RAD

/**
 * Dirección unitaria hacia un punto del cielo (RA y Dec ICRS, en grados),
 * expresada en el marco eclíptico J2000 de la escena.
 */
export function direccionDelCielo(raGrados: number, decGrados: number): VectorUA {
  const ra = raGrados * RAD
  const dec = decGrados * RAD
  const xe = Math.cos(dec) * Math.cos(ra)
  const ye = Math.cos(dec) * Math.sin(ra)
  const ze = Math.sin(dec)
  const c = Math.cos(OBLICUIDAD)
  const s = Math.sin(OBLICUIDAD)
  return { x: xe, y: c * ye + s * ze, z: -s * ye + c * ze }
}

export function distanciaUA(a: VectorUA, b: VectorUA): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}
