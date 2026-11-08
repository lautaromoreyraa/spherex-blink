import { describe, expect, it } from 'vitest'
import campoJson from '../../../../contrato/ejemplos/campo.json'
import indiceJson from '../../../../contrato/ejemplos/indice.json'
import { campoDeEjemplo, indiceDeEjemplo } from '../fixture/ejemplos.ts'

describe('ejemplos del contrato', () => {
  it('la copia tipada de campo.json es igual al JSON', () => {
    expect(campoDeEjemplo).toEqual(campoJson)
  })

  it('la copia tipada de indice.json es igual al JSON', () => {
    expect(indiceDeEjemplo).toEqual(indiceJson)
  })
})
