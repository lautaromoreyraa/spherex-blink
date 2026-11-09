import { describe, expect, it } from 'vitest'
import type { Estiramiento } from '../../api/tipos.ts'
import {
  acotarRango,
  CODIFICACION_DIFERENCIA,
  CODIFICACION_IMAGEN,
  grisAMjySr,
  grisDeDiferenciaAMjySr,
  marcasDeEscala,
  marcasDivergentes,
  parametrosDeEstiramiento,
  posicionDivergente,
  posicionEnElMapa,
  uniformeDeDiferencia,
  uniformeDeImagen,
  valorEnLaPosicion,
} from '../../util/estiramiento.ts'
import { campoDeEjemplo } from '../fixture/ejemplos.ts'

const asinh: Estiramiento = { tipo: 'asinh', minimo: -1.29, maximo: 10.33, parametro_asinh: 0.1 }

describe('parametrosDeEstiramiento (RF-37)', () => {
  it('arma los parámetros del shader desde el estiramiento del contrato', () => {
    const p = parametrosDeEstiramiento(campoDeEjemplo.estiramiento)

    expect(p).toEqual({ minimo: 0.5, maximo: 40, a: 0.1 })
    expect(uniformeDeImagen(p)).toEqual([0.5, 40, 0.1, CODIFICACION_IMAGEN])
  })

  it('el lineal no lleva parámetro y el shader lo recibe como a = 0', () => {
    const p = parametrosDeEstiramiento({
      tipo: 'lineal',
      minimo: 0,
      maximo: 2,
      parametro_asinh: null,
    })

    expect(p.a).toBeNull()
    expect(uniformeDeImagen(p)[2]).toBe(0)
  })

  it('rechaza un asinh sin parámetro y un rango vacío', () => {
    expect(() =>
      parametrosDeEstiramiento({ tipo: 'asinh', minimo: 0, maximo: 1, parametro_asinh: null }),
    ).toThrow()
    expect(() =>
      parametrosDeEstiramiento({ tipo: 'lineal', minimo: 1, maximo: 1, parametro_asinh: null }),
    ).toThrow()
  })

  it('la diferencia viaja al shader con su límite y su tipo', () => {
    expect(uniformeDeDiferencia({ tipo: 'lineal-simetrica', limite: 2.5 })).toEqual([
      2.5,
      0,
      0,
      CODIFICACION_DIFERENCIA,
    ])
  })
})

describe('del gris a MJy/sr y de vuelta', () => {
  const p = parametrosDeEstiramiento(asinh)

  it('0 es el mínimo y 255 el máximo', () => {
    expect(grisAMjySr(0, p)).toBeCloseTo(-1.29, 10)
    expect(grisAMjySr(255, p)).toBeCloseTo(10.33, 10)
  })

  it('con el rango del pipeline, cada gris vuelve a su lugar en el mapa', () => {
    // Si esto falla, el visor mostraría las épocas con otro brillo que el
    // que les dio el pipeline (RF-05).
    for (let g = 0; g <= 255; g += 15) {
      const valor = grisAMjySr(g, p)
      expect(posicionEnElMapa(valor, p, p.a)).toBeCloseTo(g / 255, 9)
    }
  })

  it('asinh realza lo débil: la mitad del gris queda muy por debajo de la mitad del brillo', () => {
    const mitad = grisAMjySr(127.5, p)
    expect((mitad - p.minimo) / (p.maximo - p.minimo)).toBeLessThan(0.25)
  })

  it('valorEnLaPosicion es la inversa de posicionEnElMapa', () => {
    for (const t of [0, 0.1, 0.5, 0.9, 1]) {
      expect(posicionEnElMapa(valorEnLaPosicion(t, p, p.a), p, p.a)).toBeCloseTo(t, 9)
    }
  })

  it('la diferencia: 128 es sin cambio, 255 es +límite y 1 es −límite', () => {
    const escala = { tipo: 'lineal-simetrica' as const, limite: 0.16 }
    expect(grisDeDiferenciaAMjySr(128, escala)).toBe(0)
    expect(grisDeDiferenciaAMjySr(255, escala)).toBeCloseTo(0.16, 12)
    expect(grisDeDiferenciaAMjySr(1, escala)).toBeCloseTo(-0.16, 12)
    expect(posicionDivergente(0, 0.16)).toBe(0.5)
    expect(posicionDivergente(1, 0.16)).toBe(1)
  })
})

describe('rango visible', () => {
  const p = parametrosDeEstiramiento(asinh)

  it('no sale del rango del pipeline ni queda vacío', () => {
    const r = acotarRango({ minimo: -50, maximo: 50 }, p)
    expect(r).toEqual({ minimo: p.minimo, maximo: p.maximo })

    const invertido = acotarRango({ minimo: 5, maximo: 1 }, p)
    expect(invertido.maximo).toBeGreaterThan(invertido.minimo)
  })
})

describe('marcas de la escala en MJy/sr', () => {
  it('son números redondos, en orden, dentro del rango e incluyen el cero', () => {
    const marcas = marcasDeEscala({ minimo: -1.29, maximo: 10.33 }, 0.1)
    const valores = marcas.map((m) => m.valor)

    expect(valores).toContain(0)
    expect(valores).toEqual([...valores].sort((a, b) => a - b))
    for (const m of marcas) {
      expect(m.valor).toBeGreaterThanOrEqual(-1.29)
      expect(m.valor).toBeLessThanOrEqual(10.33)
      expect(m.posicion).toBeGreaterThanOrEqual(0)
      expect(m.posicion).toBeLessThanOrEqual(1)
    }
  })

  it('las divergentes van de −límite a +límite con el cero en el medio', () => {
    expect(marcasDivergentes(2).map((m) => [m.valor, m.posicion])).toEqual([
      [-2, 0],
      [-1, 0.25],
      [0, 0.5],
      [1, 0.75],
      [2, 1],
    ])
  })
})
