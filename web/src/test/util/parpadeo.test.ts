import { describe, expect, it } from 'vitest'
import {
  CAMBIOS_POR_SEGUNDO_MAXIMO,
  epocasPorPasada,
  INTERVALO_MINIMO_MS,
  intervaloSeguro,
  siguienteEpoca,
} from '../../util/parpadeo.ts'
import { campoDeEjemplo } from '../fixture/ejemplos.ts'

describe('temporizador del parpadeo (RNF-04)', () => {
  it.each([2.5, 3, 4, 10, 1000, Infinity, Number.NaN, -1, 0])(
    'con %s cambios por segundo pedidos, el intervalo nunca baja de 400 ms',
    (pedido) => {
      expect(intervaloSeguro(pedido)).toBeGreaterThanOrEqual(400)
      expect(1000 / intervaloSeguro(pedido)).toBeLessThanOrEqual(CAMBIOS_POR_SEGUNDO_MAXIMO)
    },
  )

  it('el tope deja margen para el jitter del temporizador (WCAG 2.3.1)', () => {
    expect(INTERVALO_MINIMO_MS).toBe(400)
    expect(CAMBIOS_POR_SEGUNDO_MAXIMO).toBe(2.5)
    // Cambios que entran en una ventana de 1 s con un hueco mínimo dado.
    const cambiosEnUnSegundo = (hueco: number) => Math.floor(999 / hueco) + 1
    // Con el tope anterior (334 ms) y el hueco medido de 322 ms entraban 4.
    expect(cambiosEnUnSegundo(322)).toBe(4)
    // Con 400 ms, aun con cada cuadro 60 ms antes de lo pedido, entran 3.
    expect(cambiosEnUnSegundo(INTERVALO_MINIMO_MS - 60)).toBeLessThanOrEqual(3)
  })

  it('respeta las velocidades permitidas', () => {
    expect(intervaloSeguro(0.5)).toBe(2000)
    expect(intervaloSeguro(1)).toBe(1000)
    expect(intervaloSeguro(2)).toBe(500)
    expect(intervaloSeguro(2.5)).toBe(400)
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
