import { describe, expect, it } from 'vitest'
import { fechaUtc, numero } from '../../util/formatos.ts'

describe('fechaUtc', () => {
  it('muestra la fecha en UTC sin depender del huso local', () => {
    expect(fechaUtc('2026-06-09T09:44:15Z')).toBe('2026-06-09 09:44:15 UTC')
  })

  it('rechaza una fecha inválida', () => {
    expect(() => fechaUtc('ayer')).toThrow('Fecha inválida')
  })
})

describe('numero', () => {
  it('usa coma decimal', () => {
    expect(numero(137.3676)).toBe('137,4')
    expect(numero(22.336, 2)).toBe('22,34')
  })
})
