import { describe, expect, it } from 'vitest'
import { largo, resta } from '../../util/escalas.ts'
import {
  cuadroDelVuelo,
  DISTANCIA_FINAL,
  DURACION_DEL_VUELO_MS,
  suavizar,
  type Vuelo,
} from '../../util/vuelo.ts'

const vuelo: Vuelo = {
  inicio: [0, 40, 80],
  objetivoInicial: [0, 0, 0],
  tierra: [10, 0, 0],
  campo: [80, 10, 0],
}

describe('vuelo al campo', () => {
  it('dura 3 s o menos (RF-36)', () => {
    expect(DURACION_DEL_VUELO_MS).toBeLessThanOrEqual(3000)
  })

  it('empieza donde está la cámara', () => {
    const { posicion, mirarA } = cuadroDelVuelo(vuelo, 0)
    expect(posicion).toEqual(vuelo.inicio)
    expect(mirarA).toEqual(vuelo.objetivoInicial)
  })

  it('termina frente al campo, mirándolo', () => {
    const { posicion, mirarA } = cuadroDelVuelo(vuelo, 1)
    expect(largo(resta(vuelo.campo, posicion))).toBeCloseTo(DISTANCIA_FINAL, 9)
    expect(mirarA).toEqual(vuelo.campo)
  })

  it('la curva de aceleración va de 0 a 1 sin pasarse', () => {
    expect(suavizar(-1)).toBe(0)
    expect(suavizar(0.5)).toBeCloseTo(0.5, 9)
    expect(suavizar(2)).toBe(1)
  })
})
