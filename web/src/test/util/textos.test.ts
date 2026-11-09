import { describe, expect, it } from 'vitest'
import { TEXTOS_DE_LIMITES } from '../../util/textosDeLimites.ts'
import {
  formatearFechaUtc,
  formatearMarca,
  formatearNumero,
  idiomaDelNavegador,
  TEXTOS,
  traducir,
} from '../../util/textos.ts'

// RNF-07: los textos nunca llaman descubrimiento a lo que muestra la herramienta.
const PROHIBIDAS = /descubri|nuevo objeto|nuevos objetos|discover|new object/i

function todosLosTextos(): string[] {
  const textos: string[] = []
  for (const idioma of ['es', 'en'] as const) {
    textos.push(...Object.values(TEXTOS[idioma]))
    const limites = TEXTOS_DE_LIMITES[idioma]
    for (const [clave, valor] of Object.entries(limites)) {
      if (typeof valor === 'string') textos.push(valor)
      else if (clave === 'secciones')
        for (const s of limites.secciones) textos.push(s.titulo, ...s.parrafos)
    }
  }
  return textos
}

describe('textos de la interfaz (RNF-06)', () => {
  it('español e inglés tienen las mismas claves y ninguna vacía', () => {
    expect(Object.keys(TEXTOS.en).sort()).toEqual(Object.keys(TEXTOS.es).sort())
    for (const idioma of ['es', 'en'] as const) {
      for (const [clave, valor] of Object.entries(TEXTOS[idioma])) {
        expect(valor.trim(), `${idioma}:${clave}`).not.toBe('')
      }
    }
  })

  it('cada texto usa las mismas variables en los dos idiomas', () => {
    const variables = (texto: string) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const clave of Object.keys(TEXTOS.es) as (keyof typeof TEXTOS.es)[]) {
      expect(variables(TEXTOS.en[clave]), clave).toEqual(variables(TEXTOS.es[clave]))
    }
  })

  it('la página de límites tiene las mismas secciones y fuentes en los dos idiomas', () => {
    const forma = (idioma: 'es' | 'en') =>
      TEXTOS_DE_LIMITES[idioma].secciones.map((s) => [s.id, s.parrafos.length, s.fuentes.length])
    expect(forma('en')).toEqual(forma('es'))
  })

  it('toda sección de la página de límites cita al menos una fuente', () => {
    for (const idioma of ['es', 'en'] as const) {
      for (const seccion of TEXTOS_DE_LIMITES[idioma].secciones) {
        expect(seccion.fuentes.length, seccion.id).toBeGreaterThan(0)
        for (const fuente of seccion.fuentes) expect(fuente.enlace).toMatch(/^https:\/\//)
      }
    }
  })

  it('la página de límites cubre lo que pide RF-26', () => {
    expect(TEXTOS_DE_LIMITES.es.secciones.map((s) => s.id)).toEqual([
      'datos',
      'cadencia',
      'mascara',
      'longitud-de-onda',
      'saturacion',
      'sistema-solar',
      'efemeride',
      'candidatos',
      'planeta-x',
      'creditos',
    ])
  })

  it('ningún texto habla de descubrimientos ni de objetos nuevos (RNF-07)', () => {
    for (const texto of todosLosTextos()) expect(texto).not.toMatch(PROHIBIDAS)
  })
})

describe('traducir y formatear', () => {
  it('completa las variables', () => {
    expect(traducir('es', 'inicio.epocas', { n: 9 })).toBe('9 épocas')
    expect(traducir('en', 'inicio.epocas', { n: 9 })).toBe('9 epochs')
  })

  it('el idioma inicial sigue al navegador y si no es español va en inglés', () => {
    expect(idiomaDelNavegador(['es-AR', 'en'])).toBe('es')
    expect(idiomaDelNavegador(['en-US'])).toBe('en')
    expect(idiomaDelNavegador(['fr-FR', 'es'])).toBe('es')
    expect(idiomaDelNavegador(['fr-FR'])).toBe('en')
  })

  it('fechas en UTC y números según el idioma', () => {
    expect(formatearFechaUtc('2026-06-09T09:44:15Z', 'en')).toMatch(/9 Jun 2026.*09:44 UTC/)
    expect(formatearFechaUtc('2026-06-09T09:44:15Z', 'es')).toMatch(/9 de jun.* 2026.*09:44 UTC/)
    expect(formatearNumero(0.7576, 'es', 3)).toBe('0,758')
    expect(formatearNumero(0.7576, 'en', 3)).toBe('0.758')
    expect(formatearMarca(-2.5, 'es')).toBe('−2,5')
  })
})
