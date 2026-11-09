import { describe, expect, it } from 'vitest'
import { direccion, llegadaDesdeLaEscena, rutaDe, rutaDeDatos } from '../../util/rutas.ts'

describe('llegadaDesdeLaEscena', () => {
  it('lee el estado que deja el vuelo (RF-36)', () => {
    expect(llegadaDesdeLaEscena({ desdeLaEscena: true, epoca: 'p3-x' })).toEqual({
      desdeLaEscena: true,
      epoca: 'p3-x',
    })
  })

  it.each([null, undefined, 'x', {}, { desdeLaEscena: true }, { desdeLaEscena: 'si', epoca: 'a' }])(
    'ignora %j',
    (estado) => {
      expect(llegadaDesdeLaEscena(estado)).toBeNull()
    },
  )
})

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

describe('escena del Sistema Solar', () => {
  it('reconoce /escena y /escena/<id> (RF-34)', () => {
    expect(rutaDe('/escena', '/')).toEqual({ pagina: 'escena', id: null })
    expect(rutaDe('/escena/makemake/', '/')).toEqual({ pagina: 'escena', id: 'makemake' })
    expect(rutaDe('/escena/Makemake', '/')).toEqual({ pagina: 'no-encontrada' })
    expect(rutaDe('/escena/a/b', '/')).toEqual({ pagina: 'no-encontrada' })
  })

  it('arma la dirección de ida y vuelta', () => {
    expect(direccion({ pagina: 'escena', id: null }, '/')).toBe('/escena')
    expect(direccion({ pagina: 'escena', id: 'makemake' }, '/demo')).toBe('/demo/escena/makemake')
    expect(rutaDe(direccion({ pagina: 'escena', id: 'makemake' }, '/'), '/')).toEqual({
      pagina: 'escena',
      id: 'makemake',
    })
    expect(() => direccion({ pagina: 'escena', id: '../x' }, '/')).toThrow()
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
