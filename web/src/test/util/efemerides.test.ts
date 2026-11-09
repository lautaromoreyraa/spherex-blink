import { describe, expect, it } from 'vitest'
import campoJson from '../../../public/datos/campos/makemake/campo.json'
import type { Campo } from '../../api/tipos.ts'
import {
  direccionDelCielo,
  distanciaUA,
  ELEMENTOS_DE_MAKEMAKE,
  orbitaDePlaneta,
  orbitaKepleriana,
  posicionHeliocentrica,
  posicionKepleriana,
} from '../../util/efemerides.ts'
import { vectoresDeHorizons } from '../fixture/horizons.ts'

const campo = campoJson as unknown as Campo

describe('posicionHeliocentrica', () => {
  it.each([
    ['tierra', vectoresDeHorizons.tierra],
    ['jupiter', vectoresDeHorizons.jupiter],
    ['marte', vectoresDeHorizons.marte],
    ['saturno', vectoresDeHorizons.saturno],
  ] as const)('%s coincide con Horizons con error menor a 0,01 UA', (planeta, grabados) => {
    for (const { fecha, ...esperado } of grabados) {
      const calculado = posicionHeliocentrica(planeta, new Date(fecha))
      expect(distanciaUA(calculado, esperado)).toBeLessThan(0.01)
    }
  })

  it('la Tierra coincide con la de geometria en cada época del campo de Makemake', () => {
    const geometria = campo.geometria
    expect(geometria).not.toBeNull()
    for (const epoca of campo.epocas) {
      const tierra = geometria!.tierra.find((p) => p.epoca_id === epoca.id)!
      const calculada = posicionHeliocentrica('tierra', new Date(epoca.fecha_utc))
      expect(distanciaUA(calculada, { x: tierra.x_ua, y: tierra.y_ua, z: tierra.z_ua })).toBeLessThan(
        0.01,
      )
    }
  })
})

describe('orbitaDePlaneta', () => {
  it('cierra la vuelta: el último punto vuelve cerca del primero', () => {
    const orbita = orbitaDePlaneta('marte', new Date('2026-06-09T00:00:00Z'))
    expect(orbita).toHaveLength(129)
    expect(distanciaUA(orbita[0]!, orbita[128]!)).toBeLessThan(0.05)
  })
})

describe('órbita de Makemake', () => {
  it('la posición kepleriana pasa por la de Horizons en las épocas de la demo', () => {
    for (const p of campo.geometria!.objeto.posiciones) {
      const epoca = campo.epocas.find((e) => e.id === p.epoca_id)!
      const kepler = posicionKepleriana(ELEMENTOS_DE_MAKEMAKE, new Date(epoca.fecha_utc))
      expect(distanciaUA(kepler, { x: p.x_ua, y: p.y_ua, z: p.z_ua })).toBeLessThan(0.01)
    }
  })

  it('la elipse queda entre el perihelio y el afelio', () => {
    const { semiejeUA: a, excentricidad: e } = ELEMENTOS_DE_MAKEMAKE
    for (const punto of orbitaKepleriana(ELEMENTOS_DE_MAKEMAKE, 64)) {
      const r = Math.hypot(punto.x, punto.y, punto.z)
      expect(r).toBeGreaterThan(a * (1 - e) - 1e-9)
      expect(r).toBeLessThan(a * (1 + e) + 1e-9)
    }
  })
})

describe('direccionDelCielo', () => {
  it('apunta de la Tierra a Makemake como dice geometria (a menos de 10″)', () => {
    // La diferencia que queda es el tiempo de luz (~7 h a 52 UA): Horizons
    // da la RA y Dec astrométricas y geometria la posición geométrica.
    const makemake = campo.conocidos.find((c) => c.nombre === 'Makemake')!
    const posicion = makemake.posiciones[0]!
    const tierra = campo.geometria!.tierra[0]!
    const objeto = campo.geometria!.objeto.posiciones[0]!
    const d = Math.hypot(objeto.x_ua - tierra.x_ua, objeto.y_ua - tierra.y_ua, objeto.z_ua - tierra.z_ua)
    const haciaObjeto = {
      x: (objeto.x_ua - tierra.x_ua) / d,
      y: (objeto.y_ua - tierra.y_ua) / d,
      z: (objeto.z_ua - tierra.z_ua) / d,
    }
    const delCielo = direccionDelCielo(posicion.ra, posicion.dec)
    const anguloSegundos = (distanciaUA(haciaObjeto, delCielo) * 180 * 3600) / Math.PI
    expect(anguloSegundos).toBeLessThan(10)
  })
})
