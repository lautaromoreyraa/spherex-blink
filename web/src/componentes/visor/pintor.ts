/**
 * Lo que necesita el lienzo para dibujar un cuadro, sea con WebGL o con
 * canvas 2D (RF-37). Los dos pintores reciben exactamente lo mismo.
 */
import type { Uniforme4 } from '../../util/estiramiento.ts'
import type { MapaDeColor } from '../../util/mapasDeColor.ts'
import type { ModoDePintura, Pixeles, Visible } from '../../util/pintura.ts'
import type { Tamano, Vista } from '../../util/vista.ts'

export interface Capa {
  /** Ruta del WebP: identifica la textura para no volver a subirla. */
  clave: string
  pixeles: Pixeles
  codificacion: Uniforme4
}

export interface Cuadro {
  a: Capa
  b: Capa | null
  modo: ModoDePintura
  mezcla: number
  mapa: MapaDeColor
  visible: Visible
  limite: number
  vista: Vista
}

export type TipoDePintor = 'webgl' | '2d'

export interface Pintor {
  tipo: TipoDePintor
  /** `lienzo` en píxeles CSS; el pintor multiplica por la densidad de la pantalla. */
  dibujar(cuadro: Cuadro, lienzo: Tamano, densidad: number): void
  destruir(): void
}

/** Color del fondo fuera de la imagen; igual a `--color-fondo-visor` de tokens.css. */
export const COLOR_FONDO: readonly [number, number, number] = [0x05, 0x07, 0x0c]
