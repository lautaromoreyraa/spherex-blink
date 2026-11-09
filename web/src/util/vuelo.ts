import { escalar, normalizar, resta, suma, type PuntoDeEscena } from './escalas.ts'

/**
 * Trayectoria del vuelo de la cámara de la escena al campo (RF-36).
 *
 * La cámara sale de donde está, pasa por detrás de la Tierra sobre la línea
 * de visión —el punto de vista de SPHEREx— y termina frente al recorte real
 * del campo. Es una curva de Bézier cuadrática recorrida con aceleración
 * suave; la duración queda por debajo de los 3 s que pide el requisito.
 */

export const DURACION_DEL_VUELO_MS = 2400

/** Distancia desde la que la cámara mira el recorte al final del vuelo. */
export const DISTANCIA_FINAL = 3

export interface Vuelo {
  inicio: PuntoDeEscena
  objetivoInicial: PuntoDeEscena
  tierra: PuntoDeEscena
  campo: PuntoDeEscena
}

export interface CuadroDelVuelo {
  posicion: PuntoDeEscena
  mirarA: PuntoDeEscena
}

export function suavizar(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

function interpolar(a: PuntoDeEscena, b: PuntoDeEscena, t: number): PuntoDeEscena {
  return suma(a, escalar(resta(b, a), t))
}

/** Dónde está la cámara y hacia dónde mira en la fracción `t` (0 a 1) del vuelo. */
export function cuadroDelVuelo(vuelo: Vuelo, t: number): CuadroDelVuelo {
  const direccion = normalizar(resta(vuelo.campo, vuelo.tierra))
  const detrasDeLaTierra = suma(vuelo.tierra, escalar(direccion, -4))
  const final = suma(vuelo.campo, escalar(direccion, -DISTANCIA_FINAL))

  const s = suavizar(t)
  const a = interpolar(vuelo.inicio, detrasDeLaTierra, s)
  const b = interpolar(detrasDeLaTierra, final, s)
  const posicion = interpolar(a, b, s)

  // La mirada llega al campo antes que la cámara, para que el último tramo
  // ya se vea como entrar en la imagen.
  const mirarA = interpolar(vuelo.objetivoInicial, vuelo.campo, suavizar(t * 1.6))
  return { posicion, mirarA }
}
