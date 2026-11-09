/**
 * Pintor con canvas 2D, para cuando no hay WebGL (RF-37, RNF-13).
 *
 * Pinta cada capa en un canvas del tamaño de la imagen con la misma cuenta
 * del shader (`util/pintura.ts`) y lo agranda sin suavizar. La cortina y el
 * fundido se arman con recorte y transparencia del contexto 2D.
 */
import { tablaRgba } from '../../util/mapasDeColor.ts'
import { pintarPixeles } from '../../util/pintura.ts'
import { imagenALienzo, escala, type Tamano } from '../../util/vista.ts'
import { COLOR_FONDO, type Capa, type Cuadro, type Pintor } from './pintor.ts'

export function crearPintor2d(lienzo: HTMLCanvasElement): Pintor | null {
  const contexto = lienzo.getContext('2d')
  if (!contexto) return null
  const ctx = contexto
  const auxiliar = document.createElement('canvas')
  const ctxAuxiliar = auxiliar.getContext('2d')
  if (!ctxAuxiliar) return null
  const auxiliarB = document.createElement('canvas')
  const ctxAuxiliarB = auxiliarB.getContext('2d')
  if (!ctxAuxiliarB) return null

  function pintarEn(
    destino: CanvasRenderingContext2D,
    lienzoDestino: HTMLCanvasElement,
    a: Capa,
    b: Capa | null,
    cuadro: Cuadro,
    modo: 'simple' | 'resta',
  ) {
    const { ancho, alto } = a.pixeles
    if (lienzoDestino.width !== ancho || lienzoDestino.height !== alto) {
      lienzoDestino.width = ancho
      lienzoDestino.height = alto
    }
    const salida = destino.createImageData(ancho, alto)
    pintarPixeles(
      a.pixeles,
      b?.pixeles ?? null,
      {
        codificacionA: a.codificacion,
        codificacionB: b?.codificacion ?? null,
        visible: cuadro.visible,
        limite: cuadro.limite,
        modo,
        mapa: tablaRgba(cuadro.mapa),
        divergente: tablaRgba('berlin'),
      },
      salida.data,
    )
    destino.putImageData(salida, 0, 0)
  }

  return {
    tipo: '2d',
    dibujar(cuadro: Cuadro, tamano: Tamano, densidad: number) {
      const ancho = Math.max(1, Math.round(tamano.ancho * densidad))
      const alto = Math.max(1, Math.round(tamano.alto * densidad))
      if (lienzo.width !== ancho || lienzo.height !== alto) {
        lienzo.width = ancho
        lienzo.height = alto
      }
      const imagen = { ancho: cuadro.a.pixeles.ancho, alto: cuadro.a.pixeles.alto }
      const b = cuadro.b
      const modo = b ? cuadro.modo : 'simple'
      pintarEn(ctxAuxiliar!, auxiliar, cuadro.a, b, cuadro, modo === 'resta' ? 'resta' : 'simple')
      if (b && (modo === 'cortina' || modo === 'fundido')) {
        pintarEn(ctxAuxiliarB!, auxiliarB, b, null, cuadro, 'simple')
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = `rgb(${COLOR_FONDO.join(',')})`
      ctx.fillRect(0, 0, ancho, alto)
      ctx.imageSmoothingEnabled = false
      // Esquina de arriba a la izquierda del píxel (0, 0), que tiene el centro en (0, 0).
      const origen = imagenALienzo(cuadro.vista, tamano, imagen, -0.5, -0.5)
      const e = escala(cuadro.vista, tamano, imagen)
      ctx.setTransform(e * densidad, 0, 0, e * densidad, origen.x * densidad, origen.y * densidad)
      ctx.drawImage(auxiliar, 0, 0)
      if (b && modo === 'fundido') {
        ctx.globalAlpha = cuadro.mezcla
        ctx.drawImage(auxiliarB, 0, 0)
        ctx.globalAlpha = 1
      } else if (b && modo === 'cortina') {
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.beginPath()
        ctx.rect(cuadro.mezcla * ancho, 0, ancho, alto)
        ctx.clip()
        ctx.setTransform(e * densidad, 0, 0, e * densidad, origen.x * densidad, origen.y * densidad)
        ctx.drawImage(auxiliarB, 0, 0)
        ctx.restore()
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    },
    destruir() {
      auxiliar.width = 0
      auxiliarB.width = 0
    },
  }
}
