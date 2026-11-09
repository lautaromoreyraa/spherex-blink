import { describe, expect, it } from 'vitest'
import barnard from '../../../public/datos/campos/estrella-de-barnard/campo.json'
import makemake from '../../../public/datos/campos/makemake/campo.json'
import type { Campo } from '../../api/tipos.ts'
import {
  corrimientoTotalPx,
  esDeControl,
  marcadoresDeLaEpoca,
  origenDeLaPosicion,
  recorrido,
} from '../../util/conocidos.ts'

const campoDeMakemake = makemake as unknown as Campo
const campoDeBarnard = barnard as unknown as Campo

describe('marcadores de objetos conocidos (RF-14)', () => {
  it('en cada época de Makemake, el marcador está en su posición esperada de esa época', () => {
    const objeto = campoDeMakemake.conocidos.find((o) => o.nombre === 'Makemake')!
    for (const epoca of campoDeMakemake.epocas) {
      const marcadores = marcadoresDeLaEpoca(campoDeMakemake, epoca.id, { control: false })
      const esperado = objeto.posiciones.find((p) => p.epoca_id === epoca.id)!
      expect(marcadores).toHaveLength(1)
      expect(marcadores[0]!.posicion).toEqual(esperado)
      expect(marcadores[0]!.deteccion?.epoca_id).toBe(epoca.id)
    }
  })

  it('las estrellas de control de Gaia sólo aparecen si se piden', () => {
    const id = campoDeBarnard.epocas[0]!.id
    const sin = marcadoresDeLaEpoca(campoDeBarnard, id, { control: false })
    const con = marcadoresDeLaEpoca(campoDeBarnard, id, { control: true })
    expect(sin.every((m) => !m.control)).toBe(true)
    expect(sin.map((m) => m.objeto.nombre)).toEqual(['Estrella de Barnard'])
    expect(con.length).toBeGreaterThan(sin.length)
    expect(con.filter((m) => m.control).every((m) => esDeControl(m.objeto))).toBe(true)
  })

  it('un objeto fuera del campo en una época no se dibuja en ella', () => {
    const copia = structuredClone(campoDeMakemake)
    copia.conocidos[0]!.posiciones[2]!.dentro_del_campo = false
    const id = copia.epocas[2]!.id
    expect(marcadoresDeLaEpoca(copia, id, { control: false })).toEqual([])
  })

  it('el trazo une las posiciones de las épocas elegidas en orden', () => {
    const objeto = campoDeMakemake.conocidos[0]!
    const ids = campoDeMakemake.epocas.map((e) => e.id)
    expect(recorrido(objeto, ids).map((p) => p.epoca_id)).toEqual(ids)
    expect(recorrido(objeto, ids.slice(0, 1))).toEqual([])
  })

  it('dice si la posición es de efeméride o de catálogo (RNF-07)', () => {
    expect(origenDeLaPosicion(campoDeMakemake.conocidos[0]!)).toBe('efemeride')
    expect(origenDeLaPosicion(campoDeBarnard.conocidos[0]!)).toBe('catalogo')
  })

  it('Makemake se corre más de 2 píxeles en la pasada (RF-32)', () => {
    expect(corrimientoTotalPx(campoDeMakemake.conocidos[0]!)).toBeGreaterThan(2)
  })
})
