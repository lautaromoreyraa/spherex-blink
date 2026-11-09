import { describe, expect, it } from 'vitest'
import {
  acercar,
  desplazar,
  escalaBase,
  imagenALienzo,
  lienzoAImagen,
  pixelEntero,
  vistaInicial,
  ZOOM_MAXIMO,
} from '../../util/vista.ts'

const imagen = { ancho: 88, alto: 88 }
const lienzo = { ancho: 880, alto: 660 }

describe('vista del visor (RF-16)', () => {
  it('con zoom 1 la imagen entra entera y queda centrada', () => {
    const v = vistaInicial(imagen)
    expect(escalaBase(lienzo, imagen)).toBe(7.5)
    // Esquinas de los píxeles de los extremos.
    expect(imagenALienzo(v, lienzo, imagen, -0.5, -0.5)).toEqual({ x: 110, y: 0 })
    expect(imagenALienzo(v, lienzo, imagen, 87.5, 87.5)).toEqual({ x: 770, y: 660 })
  })

  it('lienzo → imagen → lienzo vuelve al mismo punto', () => {
    const v = { zoom: 3.2, centroX: 30, centroY: 51 }
    const p = lienzoAImagen(v, lienzo, imagen, 123, 456)
    const q = imagenALienzo(v, lienzo, imagen, p.x, p.y)
    expect(q.x).toBeCloseTo(123, 9)
    expect(q.y).toBeCloseTo(456, 9)
  })

  it('el zoom con ancla deja quieto el punto bajo el cursor', () => {
    const v = vistaInicial(imagen)
    const ancla = { x: 300, y: 200 }
    const antes = lienzoAImagen(v, lienzo, imagen, ancla.x, ancla.y)
    const nueva = acercar(v, 2, lienzo, imagen, ancla)
    const despues = lienzoAImagen(nueva, lienzo, imagen, ancla.x, ancla.y)
    expect(nueva.zoom).toBe(2)
    expect(despues.x).toBeCloseTo(antes.x, 9)
    expect(despues.y).toBeCloseTo(antes.y, 9)
  })

  it('el zoom tiene tope y no baja de la imagen entera', () => {
    const v = vistaInicial(imagen)
    expect(acercar(v, 1000, lienzo, imagen).zoom).toBe(ZOOM_MAXIMO)
    expect(acercar(v, 0.01, lienzo, imagen).zoom).toBe(1)
  })

  it('arrastrar mueve la imagen con el dedo y no la deja irse del todo', () => {
    const v = { zoom: 4, centroX: 44, centroY: 44 }
    const e = escalaBase(lienzo, imagen) * 4
    const movida = desplazar(v, e * 10, 0, lienzo, imagen)
    expect(movida.centroX).toBeCloseTo(34, 9)
    expect(desplazar(v, 1e6, 1e6, lienzo, imagen)).toMatchObject({ centroX: -0.5, centroY: -0.5 })
  })

  it('el píxel entero bajo un punto, o nada fuera de la imagen', () => {
    expect(pixelEntero({ x: 0.49, y: -0.49 }, imagen)).toEqual({ x: 0, y: 0 })
    expect(pixelEntero({ x: 87.4, y: 3 }, imagen)).toEqual({ x: 87, y: 3 })
    expect(pixelEntero({ x: -0.6, y: 3 }, imagen)).toBeNull()
    expect(pixelEntero({ x: 87.6, y: 3 }, imagen)).toBeNull()
  })
})
