import { describe, expect, it } from 'vitest'
import barnard from '../../../public/datos/campos/estrella-de-barnard/campo.json'
import makemake from '../../../public/datos/campos/makemake/campo.json'
import type { Campo } from '../../api/tipos.ts'
import { crearWcs, formatearDec, formatearRa } from '../../util/wcs.ts'

const campos = [barnard, makemake] as unknown as Campo[]

describe('WCS de la rejilla (RF-16)', () => {
  it.each(campos.map((c) => [c.id, c] as const))(
    'en %s, el píxel de cada estrella de catálogo da su RA/Dec a menos de 1 píxel',
    (_, campo) => {
      // Las posiciones de conocidos[] las calculó el pipeline con astropy:
      // son la referencia contra la que se compara esta proyección.
      const wcs = crearWcs(campo.rejilla)
      const escala = campo.rejilla.escala_arcsec_px
      let comparadas = 0
      for (const objeto of campo.conocidos) {
        for (const p of objeto.posiciones) {
          if (!p.dentro_del_campo) continue
          const cielo = wcs.aCielo(p.x, p.y)
          const dRa = (cielo.ra - p.ra) * Math.cos((p.dec * Math.PI) / 180) * 3600
          const dDec = (cielo.dec - p.dec) * 3600
          expect(Math.hypot(dRa, dDec)).toBeLessThan(escala * 0.01)
          comparadas += 1
        }
      }
      expect(comparadas).toBeGreaterThan(9)
    },
  )

  it('aPixel es la inversa de aCielo', () => {
    const wcs = crearWcs(campos[0]!.rejilla)
    for (const [x, y] of [
      [0, 0],
      [43.5, 43.5],
      [87, 12.25],
    ] as const) {
      const cielo = wcs.aCielo(x, y)
      const pixel = wcs.aPixel(cielo.ra, cielo.dec)
      expect(pixel.x).toBeCloseTo(x, 8)
      expect(pixel.y).toBeCloseTo(y, 8)
    }
  })

  it('el norte queda arriba y el este a la izquierda', () => {
    const wcs = crearWcs(campos[0]!.rejilla)
    const centro = wcs.aCielo(43.5, 43.5)
    expect(wcs.aCielo(43.5, 10).dec).toBeGreaterThan(centro.dec)
    expect(wcs.aCielo(10, 43.5).ra).toBeGreaterThan(centro.ra)
  })

  it('rechaza una proyección que no es TAN', () => {
    const rejilla = {
      ...campos[0]!.rejilla,
      wcs: { ...campos[0]!.rejilla.wcs, CTYPE1: 'RA---SIN' },
    }
    expect(() => crearWcs(rejilla)).toThrow(/TAN/)
  })
})

describe('formato de coordenadas', () => {
  it('RA en horas y Dec en grados', () => {
    expect(formatearRa(269.446259)).toBe('17h 57m 47,1s')
    expect(formatearRa(269.446259, '.')).toBe('17h 57m 47.1s')
    expect(formatearDec(4.768324)).toBe('+04° 46′ 06″')
    expect(formatearDec(-0.5)).toBe('−00° 30′ 00″')
  })
})
