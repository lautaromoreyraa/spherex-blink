import { describe, expect, it } from 'vitest'
import { enlaceDeIrsa, nombreDeArchivo, rangoDeLongitudDeOnda } from '../../util/procedencia.ts'
import { campoDeEjemplo } from '../fixture/ejemplos.ts'

describe('procedencia de cada época (RF-15)', () => {
  it('advierte si la longitud de onda difiere en más de 0,05 µm', () => {
    const epocas = campoDeEjemplo.epocas
    expect(rangoDeLongitudDeOnda(epocas)).toEqual({ minimo: 1.41, maximo: 1.45, difiere: false })

    const otra = epocas.map((e, i) => ({ ...e, longitud_onda_um: 1.4 + i * 0.03 }))
    expect(rangoDeLongitudDeOnda(otra)?.difiere).toBe(true)

    const justo = epocas.map((e, i) => ({ ...e, longitud_onda_um: i === 0 ? 1.4 : 1.45 }))
    expect(rangoDeLongitudDeOnda(justo)?.difiere).toBe(false)
  })

  it('sólo enlaza archivos https de IRSA', () => {
    const uri =
      'https://irsa.ipac.caltech.edu/ibe/data/spherex/qr2/level2/2026W24_1A/l2b-v25-2026-163/1/level2_2026W24_1A_0324_1D1_spx_l2b-v25-2026-163.fits'
    expect(enlaceDeIrsa(uri)).toBe(uri)
    expect(enlaceDeIrsa('javascript:alert(1)')).toBeNull()
    expect(enlaceDeIrsa('http://irsa.ipac.caltech.edu/x.fits')).toBeNull()
    expect(enlaceDeIrsa('https://irsa.ipac.caltech.edu.otro.sitio/x.fits')).toBeNull()
    expect(enlaceDeIrsa('no es una url')).toBeNull()
    expect(nombreDeArchivo(uri)).toBe('level2_2026W24_1A_0324_1D1_spx_l2b-v25-2026-163.fits')
  })
})
