/**
 * Zoom y desplazamiento del visor (RF-16): la cuenta entre un punto del
 * lienzo y un píxel de la imagen.
 *
 * El shader, el dibujo en canvas 2D, los marcadores y la lectura de
 * coordenadas usan estas mismas funciones; si cada uno hiciera su propia
 * cuenta, un marcador podría quedar medio píxel corrido de su estrella.
 *
 * Píxeles de imagen con la convención del contrato: centro del píxel de
 * arriba a la izquierda en (0, 0), y hacia abajo.
 */

export interface Vista {
  /** 1 = la imagen entera entra en el lienzo. */
  zoom: number
  /** Píxel de la imagen que queda en el centro del lienzo. */
  centroX: number
  centroY: number
}

export interface Tamano {
  ancho: number
  alto: number
}

export const ZOOM_MINIMO = 1
export const ZOOM_MAXIMO = 32

export function vistaInicial(imagen: Tamano): Vista {
  return { zoom: 1, centroX: (imagen.ancho - 1) / 2, centroY: (imagen.alto - 1) / 2 }
}

/** Píxeles de lienzo por píxel de imagen con zoom 1: la imagen entra entera. */
export function escalaBase(lienzo: Tamano, imagen: Tamano): number {
  if (imagen.ancho <= 0 || imagen.alto <= 0) return 1
  return Math.min(lienzo.ancho / imagen.ancho, lienzo.alto / imagen.alto)
}

export function escala(vista: Vista, lienzo: Tamano, imagen: Tamano): number {
  return escalaBase(lienzo, imagen) * vista.zoom
}

export function lienzoAImagen(
  vista: Vista,
  lienzo: Tamano,
  imagen: Tamano,
  x: number,
  y: number,
): { x: number; y: number } {
  const e = escala(vista, lienzo, imagen)
  return {
    x: vista.centroX + (x - lienzo.ancho / 2) / e,
    y: vista.centroY + (y - lienzo.alto / 2) / e,
  }
}

export function imagenALienzo(
  vista: Vista,
  lienzo: Tamano,
  imagen: Tamano,
  x: number,
  y: number,
): { x: number; y: number } {
  const e = escala(vista, lienzo, imagen)
  return {
    x: lienzo.ancho / 2 + (x - vista.centroX) * e,
    y: lienzo.alto / 2 + (y - vista.centroY) * e,
  }
}

/** El centro no se va más allá del borde de la imagen: siempre queda algo a la vista. */
export function acotar(vista: Vista, imagen: Tamano): Vista {
  const zoom = Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, vista.zoom))
  return {
    zoom,
    centroX: Math.min(imagen.ancho - 0.5, Math.max(-0.5, vista.centroX)),
    centroY: Math.min(imagen.alto - 0.5, Math.max(-0.5, vista.centroY)),
  }
}

/**
 * Zoom por un factor dejando quieto el punto del lienzo `ancla` (el cursor o
 * el centro del pellizco); sin ancla, el centro del lienzo.
 */
export function acercar(
  vista: Vista,
  factor: number,
  lienzo: Tamano,
  imagen: Tamano,
  ancla?: { x: number; y: number },
): Vista {
  const zoom = Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, vista.zoom * factor))
  if (!ancla) return acotar({ ...vista, zoom }, imagen)
  const fijo = lienzoAImagen(vista, lienzo, imagen, ancla.x, ancla.y)
  const e = escalaBase(lienzo, imagen) * zoom
  return acotar(
    {
      zoom,
      centroX: fijo.x - (ancla.x - lienzo.ancho / 2) / e,
      centroY: fijo.y - (ancla.y - lienzo.alto / 2) / e,
    },
    imagen,
  )
}

/** Desplaza la imagen lo que se arrastró en el lienzo (la imagen sigue al dedo). */
export function desplazar(
  vista: Vista,
  dx: number,
  dy: number,
  lienzo: Tamano,
  imagen: Tamano,
): Vista {
  const e = escala(vista, lienzo, imagen)
  return acotar(
    { ...vista, centroX: vista.centroX - dx / e, centroY: vista.centroY - dy / e },
    imagen,
  )
}

/** Píxel entero de la imagen bajo un punto, o null si cae afuera. */
export function pixelEntero(
  punto: { x: number; y: number },
  imagen: Tamano,
): { x: number; y: number } | null {
  const x = Math.floor(punto.x + 0.5)
  const y = Math.floor(punto.y + 0.5)
  if (x < 0 || y < 0 || x >= imagen.ancho || y >= imagen.alto) return null
  return { x, y }
}
