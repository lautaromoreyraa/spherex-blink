import type { Campo, Epoca } from '../../api/tipos.ts'
import {
  direccionDelCielo,
  ELEMENTOS_DE_MAKEMAKE,
  orbitaDePlaneta,
  orbitaKepleriana,
  PLANETAS,
  posicionHeliocentrica,
  type VectorUA,
} from '../../util/efemerides.ts'
import {
  aEscena,
  ejesDeEscena,
  escalar,
  largo,
  normalizar,
  radioEnEscena,
  resta,
  suma,
  type ModoDeEscala,
  type PuntoDeEscena,
} from '../../util/escalas.ts'
import { aVector } from '../../util/paralaje.ts'
import { MAKEMAKE, PLANETAS_DE_LA_ESCENA, SOL } from './cuerpos.ts'

/**
 * Todo lo que la escena dibuja en una época, ya en coordenadas de three.js.
 * Separado de los componentes para que el armado no dependa del render.
 */

export interface CuerpoEnEscena {
  id: string
  nombre: string
  /** Lo que lee el lector de pantalla y el rótulo. */
  rotulo: string
  posicion: PuntoDeEscena
  radio: number
  /** Sin textura (null) se dibuja liso: no se inventa la superficie. */
  textura: string | null
  emite: boolean
  anillos: boolean
}

export interface OrbitaEnEscena {
  id: string
  puntos: PuntoDeEscena[]
}

export interface LineaEnEscena {
  epocaId: string
  desde: PuntoDeEscena
  hasta: PuntoDeEscena
  actual: boolean
}

export interface ModeloDeEscena {
  cuerpos: CuerpoEnEscena[]
  orbitas: OrbitaEnEscena[]
  lineas: LineaEnEscena[]
  /** Dónde se dibuja el recorte del campo y desde dónde se lo mira. */
  campo: { posicion: PuntoDeEscena; tierra: PuntoDeEscena; tamano: number }
}

/** Cuánto más allá del objeto (o de la Tierra, sin objeto) queda el recorte. */
const MARGEN_DEL_CAMPO: Record<ModoDeEscala, number> = { ilustrativa: 18, real: 40 }
const DISTANCIA_SIN_OBJETO: Record<ModoDeEscala, number> = { ilustrativa: 80, real: 600 }
export const TAMANO_DEL_CAMPO = 6

function tierraEn(campo: Campo, epoca: Epoca): VectorUA {
  // La Tierra del pipeline cuando está; si no, la de astronomy-engine.
  const punto = campo.geometria?.tierra.find((p) => p.epoca_id === epoca.id)
  return punto ? aVector(punto) : posicionHeliocentrica('tierra', new Date(epoca.fecha_utc))
}

function objetoEn(campo: Campo, epoca: Epoca): VectorUA | null {
  const punto = campo.geometria?.objeto.posiciones.find((p) => p.epoca_id === epoca.id)
  return punto ? aVector(punto) : null
}

function hastaDondeLlega(
  tierra: PuntoDeEscena,
  objeto: PuntoDeEscena | null,
  direccionDelCampo: PuntoDeEscena,
  modo: ModoDeEscala,
): PuntoDeEscena {
  if (objeto) {
    const haciaElObjeto = resta(objeto, tierra)
    const distancia = largo(haciaElObjeto) + MARGEN_DEL_CAMPO[modo]
    return suma(tierra, escalar(normalizar(haciaElObjeto), distancia))
  }
  return suma(tierra, escalar(direccionDelCampo, DISTANCIA_SIN_OBJETO[modo]))
}

export function armarModelo(campo: Campo, indiceDeEpoca: number, modo: ModoDeEscala): ModeloDeEscena {
  const epoca = campo.epocas[Math.min(Math.max(indiceDeEpoca, 0), campo.epocas.length - 1)]
  if (!epoca) throw new Error(`El campo ${campo.id} no tiene épocas`)
  const fecha = new Date(epoca.fecha_utc)

  const cuerpos: CuerpoEnEscena[] = [
    {
      id: 'sol',
      nombre: SOL.nombre,
      rotulo: SOL.nombre,
      posicion: [0, 0, 0],
      radio: radioEnEscena(SOL.radioKm, modo),
      textura: SOL.textura,
      emite: true,
      anillos: false,
    },
  ]
  const orbitas: OrbitaEnEscena[] = []

  for (const planeta of PLANETAS) {
    const datos = PLANETAS_DE_LA_ESCENA[planeta]
    const posicion = planeta === 'tierra' ? tierraEn(campo, epoca) : posicionHeliocentrica(planeta, fecha)
    cuerpos.push({
      id: planeta,
      nombre: datos.nombre,
      rotulo: datos.nombre,
      posicion: aEscena(posicion, modo),
      radio: radioEnEscena(datos.radioKm, modo),
      textura: datos.textura,
      emite: false,
      anillos: planeta === 'saturno',
    })
    orbitas.push({
      id: planeta,
      puntos: orbitaDePlaneta(planeta, fecha, planeta === 'mercurio' ? 64 : 128).map((p) =>
        aEscena(p, modo),
      ),
    })
  }

  const objeto = objetoEn(campo, epoca)
  const nombreDelObjeto = campo.geometria?.objeto.nombre ?? null
  if (objeto && nombreDelObjeto) {
    const esMakemake = nombreDelObjeto === MAKEMAKE.nombre
    cuerpos.push({
      id: 'objeto',
      nombre: nombreDelObjeto,
      rotulo: esMakemake ? `${nombreDelObjeto} (ilustración)` : nombreDelObjeto,
      posicion: aEscena(objeto, modo),
      radio: radioEnEscena(esMakemake ? MAKEMAKE.radioKm : 500, modo),
      textura: esMakemake ? MAKEMAKE.textura : null,
      emite: false,
      anillos: false,
    })
    if (esMakemake) {
      orbitas.push({
        id: 'objeto',
        puntos: orbitaKepleriana(ELEMENTOS_DE_MAKEMAKE).map((p) => aEscena(p, modo)),
      })
    }
  }

  const direccionDelCampo = normalizar(ejesDeEscena(direccionDelCielo(campo.centro.ra, campo.centro.dec)))
  const lineas: LineaEnEscena[] = campo.epocas.map((e) => {
    const tierra = aEscena(tierraEn(campo, e), modo)
    const deEsaEpoca = objetoEn(campo, e)
    return {
      epocaId: e.id,
      desde: tierra,
      hasta: hastaDondeLlega(tierra, deEsaEpoca ? aEscena(deEsaEpoca, modo) : null, direccionDelCampo, modo),
      actual: e.id === epoca.id,
    }
  })

  const actual = lineas.find((l) => l.actual)!
  return {
    cuerpos,
    orbitas,
    lineas,
    campo: { posicion: actual.hasta, tierra: actual.desde, tamano: TAMANO_DEL_CAMPO },
  }
}

export interface Encuadre {
  posicion: PuntoDeEscena
  objetivo: PuntoDeEscena
}

/**
 * Desde dónde abre la cámara: de costado a la línea de visión y por encima
 * de la eclíptica, para que entren el Sol, la Tierra, el objeto y el recorte
 * en el mismo cuadro, con la línea cruzando la pantalla.
 */
export function encuadreInicial({ posicion, tierra }: ModeloDeEscena['campo']): Encuadre {
  const objetivo = escalar(suma(posicion, tierra), 0.5)
  const linea = normalizar(resta(posicion, tierra))
  // Perpendicular a la línea sobre la eclíptica: producto vectorial con «arriba».
  let costado = normalizar([-linea[2], 0, linea[0]])
  if (largo(costado) === 0) costado = [1, 0, 0]
  const distancia = Math.max(largo(resta(posicion, tierra)), largo(posicion)) * 0.95
  const arriba: PuntoDeEscena = [0, distancia * 0.55, 0]
  return { objetivo, posicion: suma(objetivo, suma(escalar(costado, distancia * 0.8), arriba)) }
}
