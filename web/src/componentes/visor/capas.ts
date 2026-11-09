/**
 * Qué capa de imagen corresponde a cada vista del visor, con su codificación.
 */
import type { Campo, Epoca } from '../../api/tipos.ts'
import {
  parametrosDeEstiramiento,
  uniformeDeDiferencia,
  uniformeDeImagen,
} from '../../util/estiramiento.ts'
import type { VistaDelVisor } from '../../util/estadoDelVisor.ts'
import type { Pixeles } from '../../util/pintura.ts'
import type { Capa } from './pintor.ts'

export function capaDeImagen(
  campo: Campo,
  ruta: string,
  pixeles: Map<string, Pixeles>,
): Capa | null {
  const datos = pixeles.get(ruta)
  if (!datos) return null
  return {
    clave: ruta,
    pixeles: datos,
    codificacion: uniformeDeImagen(parametrosDeEstiramiento(campo.estiramiento)),
  }
}

export function capaDeLaVista(
  campo: Campo,
  epoca: Epoca,
  vista: VistaDelVisor,
  pixeles: Map<string, Pixeles>,
): Capa | null {
  if (vista === 'diferencia' && epoca.diferencia && campo.escala_diferencia) {
    const datos = pixeles.get(epoca.diferencia)
    if (!datos) return null
    return {
      clave: epoca.diferencia,
      pixeles: datos,
      codificacion: uniformeDeDiferencia(campo.escala_diferencia),
    }
  }
  if (vista === 'apilado' && campo.referencia) return capaDeImagen(campo, campo.referencia, pixeles)
  if (vista === 'rastro' && campo.rastro) return capaDeImagen(campo, campo.rastro, pixeles)
  return capaDeImagen(campo, epoca.imagen, pixeles)
}
