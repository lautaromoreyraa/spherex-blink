import { describe, expect, it } from 'vitest'
import { rutaDeDatos } from '../../util/rutas.ts'

describe('rutaDeDatos', () => {
  it('cuelga la ruta del contrato de datos/ en la raíz del sitio', () => {
    expect(rutaDeDatos('indice.json', '/')).toBe('/datos/indice.json')
  })

  it('respeta un base sin barra final', () => {
    expect(rutaDeDatos('campos/barnard/p1.webp', '/demo')).toBe('/demo/datos/campos/barnard/p1.webp')
  })

  it.each(['', '/indice.json', 'https://otro.sitio/x.webp', '../secreto.json', 'campos/../../x'])(
    'rechaza «%s»',
    (ruta) => {
      expect(() => rutaDeDatos(ruta, '/')).toThrow()
    },
  )
})
