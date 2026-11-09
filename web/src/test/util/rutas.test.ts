import { describe, expect, it } from 'vitest'
import { direccion, rutaDe, rutaDeDatos } from '../../util/rutas.ts'

describe('páginas del sitio', () => {
  it('reconoce inicio, campo y límites, con o sin barra final', () => {
    expect(rutaDe('/', '/')).toEqual({ pagina: 'inicio' })
    expect(rutaDe('/campo/makemake', '/')).toEqual({ pagina: 'campo', id: 'makemake' })
    expect(rutaDe('/campo/estrella-de-barnard/', '/')).toEqual({
      pagina: 'campo',
      id: 'estrella-de-barnard',
    })
    expect(rutaDe('/limites', '/')).toEqual({ pagina: 'limites' })
  })

  it('lo que no reconoce es «no encontrada»', () => {
    for (const ruta of ['/campo', '/campo/Makemake', '/campo/a/b', '/otra', '/campo/%E0%A4%A']) {
      expect(rutaDe(ruta, '/')).toEqual({ pagina: 'no-encontrada' })
    }
  })

  it('la escena entra al visor por /campo/<id> (RF-36)', () => {
    expect(direccion({ pagina: 'campo', id: 'makemake' }, '/')).toBe('/campo/makemake')
    expect(direccion({ pagina: 'limites' }, '/demo')).toBe('/demo/limites')
    expect(rutaDe(direccion({ pagina: 'campo', id: 'makemake' }, '/demo/'), '/demo/')).toEqual({
      pagina: 'campo',
      id: 'makemake',
    })
    expect(() => direccion({ pagina: 'campo', id: '../x' }, '/')).toThrow()
  })
})

describe('rutaDeDatos', () => {
  it('cuelga la ruta del contrato de datos/ en la raíz del sitio', () => {
    expect(rutaDeDatos('indice.json', '/')).toBe('/datos/indice.json')
  })

  it('respeta un base sin barra final', () => {
    expect(rutaDeDatos('campos/barnard/p1.webp', '/demo')).toBe(
      '/demo/datos/campos/barnard/p1.webp',
    )
  })

  it.each(['', '/indice.json', 'https://otro.sitio/x.webp', '../secreto.json', 'campos/../../x'])(
    'rechaza «%s»',
    (ruta) => {
      expect(() => rutaDeDatos(ruta, '/')).toThrow()
    },
  )
})
