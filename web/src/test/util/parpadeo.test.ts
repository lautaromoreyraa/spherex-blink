import { describe, expect, it } from 'vitest'
import {
  CAMBIOS_POR_SEGUNDO_MAXIMO,
  epocasPorPasada,
  intervaloSeguro,
  siguienteEpoca,
} from '../../util/parpadeo.ts'
import { campoDeEjemplo } from '../fixture/ejemplos.ts'

describe('temporizador del parpadeo (RNF-04)', () => {
  it.each([3, 4, 10, 1000, Infinity, Number.NaN, -1, 0])(
    'con %s cambios por segundo pedidos, nunca pasa de 3 por segundo',
    (pedido) => {
      expect(1000 / intervaloSeguro(pedido)).toBeLessThanOrEqual(CAMBIOS_POR_SEGUNDO_MAXIMO)
    },
  )

  it('respeta las velocidades permitidas', () => {
    expect(intervaloSeguro(1)).toBe(1000)
    expect(intervaloSeguro(2)).toBe(500)
    expect(intervaloSeguro(3)).toBe(334)
  })
})

describe('orden del parpadeo (RF-11)', () => {
  it('avanza y retrocede por las elegidas dando la vuelta', () => {
    const elegidas = [0, 2, 5]
    expect(siguienteEpoca(elegidas, 0, 1)).toBe(2)
    expect(siguienteEpoca(elegidas, 5, 1)).toBe(0)
    expect(siguienteEpoca(elegidas, 0, -1)).toBe(5)
    expect(siguienteEpoca(elegidas, 2, -1)).toBe(0)
  })

  it('desde una época no elegida va a la elegida más cercana en esa dirección', () => {
    expect(siguienteEpoca([0, 2, 5], 3, 1)).toBe(5)
    expect(siguienteEpoca([0, 2, 5], 3, -1)).toBe(2)
  })

  it('sin épocas elegidas no se mueve', () => {
    expect(siguienteEpoca([], 4, 1)).toBe(4)
  })

  it('agrupa las épocas por pasada', () => {
    expect([...epocasPorPasada(campoDeEjemplo.epocas).entries()]).toEqual([
      [1, [0]],
      [2, [1]],
      [3, [2]],
    ])
  })
})
