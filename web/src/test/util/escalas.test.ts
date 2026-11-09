import { describe, expect, it } from 'vitest'
import { aEscena, distanciaEnEscena, ejesDeEscena, largo, radioEnEscena } from '../../util/escalas.ts'

describe('aEscena', () => {
  it('en escala real respeta las proporciones entre distancias', () => {
    const tierra = largo(aEscena({ x: 1, y: 0, z: 0 }, 'real'))
    const makemake = largo(aEscena({ x: -45.95, y: -9.39, z: 24.09 }, 'real'))
    expect(makemake / tierra).toBeCloseTo(52.7, 1)
  })

  it('en ilustrativa comprime las distancias pero no cambia la dirección', () => {
    const v = { x: -45.95, y: -9.39, z: 24.09 }
    const p = aEscena(v, 'ilustrativa')
    const r = Math.hypot(v.x, v.y, v.z)
    expect(largo(p)).toBeCloseTo(distanciaEnEscena(r, 'ilustrativa'), 9)
    const eje = ejesDeEscena(v)
    for (let i = 0; i < 3; i++) {
      expect(p[i]! / largo(p)).toBeCloseTo(eje[i]! / r, 9)
    }
  })

  it('pone el polo norte de la eclíptica hacia arriba', () => {
    expect(ejesDeEscena({ x: 0, y: 0, z: 1 })).toEqual([0, 1, -0])
  })

  it('deja el Sol en el origen', () => {
    expect(aEscena({ x: 0, y: 0, z: 0 }, 'ilustrativa')).toEqual([0, 0, 0])
  })
})

describe('radioEnEscena', () => {
  it('en ilustrativa Júpiter es más grande que la Tierra y Makemake se ve', () => {
    expect(radioEnEscena(69_911, 'ilustrativa')).toBeGreaterThan(radioEnEscena(6371, 'ilustrativa'))
    expect(radioEnEscena(715, 'ilustrativa')).toBeGreaterThanOrEqual(0.25)
  })

  it('en real la Tierra mide su radio en UA', () => {
    expect(radioEnEscena(6371, 'real')).toBeCloseTo((6371 / 149_597_870.7) * 10, 12)
  })
})
