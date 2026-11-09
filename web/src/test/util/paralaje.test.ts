import { describe, expect, it } from 'vitest'
import barnardJson from '../../../public/datos/campos/estrella-de-barnard/campo.json'
import campoJson from '../../../public/datos/campos/makemake/campo.json'
import type { Campo } from '../../api/tipos.ts'
import {
  anguloEntre,
  aPixeles,
  lineasDeVision,
  paralajeEntre,
  resumenDePasadas,
  SEGUNDOS_POR_PIXEL,
  separacionEnElCielo,
} from '../../util/paralaje.ts'

const campo = campoJson as unknown as Campo
const barnard = barnardJson as unknown as Campo

describe('paralajeEntre', () => {
  const lineas = lineasDeVision(campo.geometria!, campo.epocas)
  const makemake = campo.conocidos.find((c) => c.nombre === 'Makemake')!

  it('arma una línea de visión por época', () => {
    expect(lineas.map((l) => l.epocaId)).toEqual(campo.epocas.map((e) => e.id))
  })

  it.each(campo.epocas.slice(1).map((e) => e.id))(
    'entre la primera época y %s coincide con la separación de Horizons (< 1″)',
    (epocaId) => {
      const primera = lineas[0]!
      const otra = lineas.find((l) => l.epocaId === epocaId)!
      const desde = makemake.posiciones.find((p) => p.epoca_id === primera.epocaId)!
      const hasta = makemake.posiciones.find((p) => p.epoca_id === epocaId)!

      const calculado = paralajeEntre(primera, otra).segundos
      const medido = separacionEnElCielo(desde.ra, desde.dec, hasta.ra, hasta.dec)

      expect(Math.abs(calculado - medido)).toBeLessThan(1)
    },
  )

  it('da los píxeles con la escala de SPHEREx', () => {
    const p = paralajeEntre(lineas[0]!, lineas.at(-1)!)
    expect(p.pixeles).toBeCloseTo(p.segundos / 6.15, 9)
    // Makemake se corre unos 137″ (22 píxeles) en los cuatro días de la pasada.
    expect(p.segundos).toBeGreaterThan(130)
    expect(p.segundos).toBeLessThan(145)
  })

  it('separa la parte que se debe al movimiento de la Tierra', () => {
    // En esta pasada el cambio de punto de vista corre a Makemake ~151″ y su
    // propia órbita lo devuelve ~35″: el paralaje domina el salto.
    const p = paralajeEntre(lineas[0]!, lineas.at(-1)!)
    expect(p.segundosPorLaTierra).toBeGreaterThan(145)
    expect(p.segundosPorLaTierra).toBeLessThan(157)
    expect(p.baseUA).toBeGreaterThan(0.05)
  })

  it('la distancia de cada línea coincide con la de Horizons', () => {
    for (const linea of lineas) {
      const esperada = makemake.posiciones.find((p) => p.epoca_id === linea.epocaId)!.distancia_ua!
      expect(Math.abs(linea.distanciaUA - esperada)).toBeLessThan(0.001)
    }
  })
})

describe('anguloEntre', () => {
  it('una estrella lejana no cambia de dirección: ángulo 0', () => {
    const v = { x: 0.3, y: -0.4, z: 0.866 }
    expect(anguloEntre(v, { x: v.x * 2, y: v.y * 2, z: v.z * 2 })).toBeCloseTo(0, 9)
  })

  it('mide ángulos rectos', () => {
    expect(anguloEntre({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBeCloseTo(90 * 3600, 6)
  })
})

describe('separacionEnElCielo', () => {
  it('un grado de declinación son 3600″', () => {
    expect(separacionEnElCielo(10, 20, 10, 21)).toBeCloseTo(3600, 6)
  })
})

describe('aPixeles', () => {
  it('usa 6,15″ por píxel', () => {
    expect(SEGUNDOS_POR_PIXEL).toBe(6.15)
    expect(aPixeles(12.3)).toBeCloseTo(2, 9)
  })
})

describe('resumenDePasadas', () => {
  it('el campo de Makemake es de una sola pasada', () => {
    expect(resumenDePasadas(campo.epocas)).toEqual({ pasadas: [3], unaSola: true })
  })

  it('el de Barnard tiene tres', () => {
    expect(resumenDePasadas(barnard.epocas)).toEqual({ pasadas: [1, 2, 3], unaSola: false })
  })
})
