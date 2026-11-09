import { describe, expect, it } from 'vitest'
import type { Campo } from '../../api/tipos.ts'
import { crearReductor, estadoInicial, vistaDisponible } from '../../util/estadoDelVisor.ts'
import { CAMBIOS_POR_SEGUNDO_MAXIMO } from '../../util/parpadeo.ts'
import { campoDeEjemplo } from '../fixture/ejemplos.ts'

const campo = campoDeEjemplo
const reducir = crearReductor(campo)

describe('estado del visor', () => {
  it('abre reproduciendo, salvo con movimiento reducido (RNF-04)', () => {
    expect(estadoInicial(campo, false).reproduciendo).toBe(true)
    expect(estadoInicial(campo, true).reproduciendo).toBe(false)
  })

  it('llegando desde la escena abre en la época del vuelo y en pausa (RF-36)', () => {
    const ultima = campo.epocas.at(-1)!
    const e = estadoInicial(campo, false, { epocaId: ultima.id, enPausa: true })
    expect(e.indice).toBe(campo.epocas.length - 1)
    expect(e.reproduciendo).toBe(false)
  })

  it('una época del vuelo que no existe abre en la primera', () => {
    const e = estadoInicial(campo, false, { epocaId: 'no-esta', enPausa: false })
    expect(e.indice).toBe(0)
    expect(e.reproduciendo).toBe(true)
  })

  it('arranca con el rango y el límite del pipeline, en inferno y con los marcadores de Gaia apagados', () => {
    const e = estadoInicial(campo, true)
    expect(e.rango).toEqual({ minimo: 0.5, maximo: 40 })
    expect(e.limite).toBe(2.5)
    expect(e.mapa).toBe('inferno')
    expect(e.marcadores).toBe(true)
    expect(e.control).toBe(false)
  })

  it('el paso manual avanza, retrocede y detiene la reproducción (RF-11)', () => {
    let e = estadoInicial(campo, false)
    e = reducir(e, { tipo: 'paso', direccion: 1 })
    expect(e).toMatchObject({ indice: 1, reproduciendo: false })
    e = reducir(e, { tipo: 'paso', direccion: -1 })
    e = reducir(e, { tipo: 'paso', direccion: -1 })
    expect(e.indice).toBe(2)
  })

  it('la velocidad nunca pasa de 3 cambios por segundo', () => {
    const e = reducir(estadoInicial(campo, true), { tipo: 'velocidad', cambiosPorSegundo: 20 })
    expect(e.cambiosPorSegundo).toBe(CAMBIOS_POR_SEGUNDO_MAXIMO)
  })

  it('el parpadeo recorre sólo las épocas elegidas', () => {
    let e = estadoInicial(campo, true)
    e = reducir(e, { tipo: 'elegir', indices: [1], incluir: false })
    expect(e.elegidas).toEqual([0, 2])
    e = reducir(e, { tipo: 'avanzar' })
    expect(e.indice).toBe(2)
    e = reducir(e, { tipo: 'avanzar' })
    expect(e.indice).toBe(0)
  })

  it('con una sola época elegida no hay nada que reproducir', () => {
    let e = estadoInicial(campo, false)
    e = reducir(e, { tipo: 'elegir', indices: [1, 2], incluir: false })
    expect(e.reproduciendo).toBe(false)
    expect(reducir(e, { tipo: 'reproducir' }).reproduciendo).toBe(false)
  })

  it('si la época visible deja de estar elegida, salta a una elegida', () => {
    let e = reducir(estadoInicial(campo, true), { tipo: 'ir', indice: 1 })
    e = reducir(e, { tipo: 'elegir', indices: [1], incluir: false })
    expect(e.elegidas).toContain(e.indice)
    expect(e.indice).toBe(2)
  })

  it('cambiar de vista conserva la época (RF-12)', () => {
    let e = reducir(estadoInicial(campo, true), { tipo: 'ir', indice: 2 })
    e = reducir(e, { tipo: 'vista', vista: 'diferencia' })
    expect(e).toMatchObject({ vista: 'diferencia', indice: 2 })
  })

  it('una vista que el campo no tiene no se puede elegir', () => {
    const sinDiferencia: Campo = {
      ...campo,
      epocas: campo.epocas.map((ep) => ({ ...ep, diferencia: null })),
      escala_diferencia: null,
      rastro: null,
    }
    expect(vistaDisponible(sinDiferencia, 'diferencia')).toBe(false)
    expect(vistaDisponible(sinDiferencia, 'rastro')).toBe(false)
    const r = crearReductor(sinDiferencia)
    expect(
      r(estadoInicial(sinDiferencia, true), { tipo: 'vista', vista: 'diferencia' }).vista,
    ).toBe('imagen')
  })
})
