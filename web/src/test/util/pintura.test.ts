import { describe, expect, it } from 'vitest'
import { uniformeDeDiferencia, uniformeDeImagen } from '../../util/estiramiento.ts'
import { colorCss, tablaRgba } from '../../util/mapasDeColor.ts'
import {
  COLOR_SIN_DATO,
  decodificar,
  pintarPixeles,
  valorDelPixel,
  type Pixeles,
} from '../../util/pintura.ts'

function capa(grises: number[], alfas: number[] = grises.map(() => 255)): Pixeles {
  const datos = new Uint8ClampedArray(grises.length * 4)
  grises.forEach((g, i) => {
    datos.set([g, g, g, alfas[i]!], i * 4)
  })
  return { ancho: grises.length, alto: 1, datos }
}

const imagen = uniformeDeImagen({ minimo: 0, maximo: 10, a: 0.1 })
const diferencia = uniformeDeDiferencia({ tipo: 'lineal-simetrica', limite: 2 })
const inferno = tablaRgba('inferno')
const berlin = tablaRgba('berlin')
const color = (salida: Uint8ClampedArray, i: number) => [...salida.slice(i * 4, i * 4 + 3)]
const deTabla = (tabla: Uint8Array, t: number) => {
  const i = Math.round(t * 255) * 4
  return [tabla[i], tabla[i + 1], tabla[i + 2]]
}

describe('mapas de color (RF-37)', () => {
  it('inferno y cividis son los de matplotlib', () => {
    expect(colorCss('inferno', 0)).toBe('#000004')
    expect(colorCss('inferno', 1)).toBe('#fcffa4')
    expect(colorCss('cividis', 0)).toBe('#00224e')
    expect(colorCss('cividis', 1)).toBe('#fee838')
  })

  it('berlin es divergente con el centro oscuro: sin cambio se apaga', () => {
    const [r, g, b] = deTabla(berlin, 0.5) as number[]
    expect(r! + g! + b!).toBeLessThan(80)
  })

  it('el color de sin dato no aparece en ninguno de los mapas', () => {
    for (const tabla of [inferno, tablaRgba('cividis'), berlin]) {
      for (let i = 0; i < 256; i++) {
        const distancia = Math.hypot(
          tabla[i * 4]! - COLOR_SIN_DATO[0],
          tabla[i * 4 + 1]! - COLOR_SIN_DATO[1],
          tabla[i * 4 + 2]! - COLOR_SIN_DATO[2],
        )
        expect(distancia).toBeGreaterThan(30)
      }
    }
  })
})

describe('pintura píxel a píxel (lo mismo que el shader)', () => {
  const visible = { minimo: 0, maximo: 10, a: 0.1 }

  it('con el rango del pipeline, cada gris cae en su mismo lugar del mapa', () => {
    const a = capa([0, 64, 255])
    const salida = new Uint8ClampedArray(12)
    pintarPixeles(
      a,
      null,
      {
        codificacionA: imagen,
        codificacionB: null,
        visible,
        limite: 2,
        modo: 'simple',
        mapa: inferno,
        divergente: berlin,
      },
      salida,
    )
    expect(color(salida, 0)).toEqual(deTabla(inferno, 0))
    expect(color(salida, 1)).toEqual(deTabla(inferno, 64 / 255))
    expect(color(salida, 2)).toEqual(deTabla(inferno, 1))
  })

  it('los píxeles sin dato salen con el gris fijo', () => {
    const salida = new Uint8ClampedArray(4)
    pintarPixeles(
      capa([200], [0]),
      null,
      {
        codificacionA: imagen,
        codificacionB: null,
        visible,
        limite: 2,
        modo: 'simple',
        mapa: inferno,
        divergente: berlin,
      },
      salida,
    )
    expect(color(salida, 0)).toEqual([...COLOR_SIN_DATO])
  })

  it('la diferencia usa el mapa divergente: 128 es el centro', () => {
    const salida = new Uint8ClampedArray(12)
    pintarPixeles(
      capa([1, 128, 255]),
      null,
      {
        codificacionA: diferencia,
        codificacionB: null,
        visible,
        limite: 2,
        modo: 'simple',
        mapa: inferno,
        divergente: berlin,
      },
      salida,
    )
    expect(color(salida, 0)).toEqual(deTabla(berlin, 0))
    expect(color(salida, 1)).toEqual(deTabla(berlin, 0.5))
    expect(color(salida, 2)).toEqual(deTabla(berlin, 1))
  })

  it('la resta A − B: igual da el centro y más brillo en A va hacia el extremo cálido', () => {
    const a = capa([100, 200])
    const b = capa([100, 100])
    const salida = new Uint8ClampedArray(8)
    pintarPixeles(
      a,
      b,
      {
        codificacionA: imagen,
        codificacionB: imagen,
        visible,
        limite: 2,
        modo: 'resta',
        mapa: inferno,
        divergente: berlin,
      },
      salida,
    )
    expect(color(salida, 0)).toEqual(deTabla(berlin, 0.5))
    expect(color(salida, 1)).toEqual(deTabla(berlin, 1))
  })

  it('el valor bajo el cursor sale en MJy/sr, o null sin dato', () => {
    const c = capa([255, 0], [255, 0])
    expect(valorDelPixel(c, imagen, 0, 0)).toBeCloseTo(10, 9)
    expect(valorDelPixel(c, imagen, 1, 0)).toBeNull()
    expect(valorDelPixel(c, imagen, 5, 0)).toBeNull()
    expect(decodificar(128, diferencia)).toBe(0)
  })
})
