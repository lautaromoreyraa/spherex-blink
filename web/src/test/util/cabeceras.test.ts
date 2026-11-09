import { describe, expect, it } from 'vitest'
import texto from '../../../public/_headers?raw'
import { directivasCsp, leerCabeceras } from '../../util/cabeceras.ts'

describe('cabeceras de seguridad (RNF-08)', () => {
  const todas = leerCabeceras(texto).get('/*')

  it('el sitio sale con CSP, nosniff y Referrer-Policy', () => {
    expect(todas).toBeDefined()
    expect(todas!['X-Content-Type-Options']).toBe('nosniff')
    expect(todas!['Referrer-Policy']).toBeTruthy()
    expect(todas!['Content-Security-Policy']).toBeTruthy()
  })

  it('la CSP sólo deja cargar del propio sitio (RNF-01: la demo no pide nada afuera)', () => {
    const csp = directivasCsp(todas!['Content-Security-Policy']!)
    expect(csp.get('default-src')).toEqual(["'none'"])
    for (const directiva of ['script-src', 'style-src', 'img-src', 'font-src', 'connect-src']) {
      expect(csp.get(directiva), directiva).toEqual(["'self'"])
    }
    expect(csp.get('frame-ancestors')).toEqual(["'none'"])
    expect(csp.get('object-src')).toEqual(["'none'"])
  })

  it('el lector rechaza cabeceras sueltas', () => {
    expect(() => leerCabeceras('  X-Uno: 1')).toThrow()
    expect(leerCabeceras('# c\n/a\n  X: 1\n/b\n  Y: 2').get('/b')).toEqual({ Y: '2' })
  })
})
