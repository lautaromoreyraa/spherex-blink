/**
 * Índice, campos e imágenes de la demo, con la forma del contrato.
 */
import type { Pixeles } from '../util/pintura.ts'
import { ErrorDeDatos, leerBinario, leerJson } from './cliente.ts'
import type { Campo, Indice } from './tipos.ts'

/** Mayor del contrato que entiende esta web: con otra, la forma puede no ser la esperada. */
export const MAYOR_DEL_CONTRATO = 0

export function contratoCompatible(version: string): boolean {
  const mayor = Number(version.split('.')[0])
  return mayor === MAYOR_DEL_CONTRATO
}

export async function cargarIndice(senal?: AbortSignal): Promise<Indice> {
  const indice = await leerJson<Indice>('indice.json', senal)
  if (!contratoCompatible(indice.version_contrato)) {
    throw new ErrorDeDatos(`contrato ${indice.version_contrato} no compatible con esta web`)
  }
  return indice
}

export async function cargarCampo(id: string, senal?: AbortSignal): Promise<Campo> {
  const campo = await leerJson<Campo>(`campos/${id}/campo.json`, senal)
  if (campo.id !== id) throw new ErrorDeDatos(`campos/${id}/campo.json: el id no coincide`)
  return campo
}

/**
 * Baja un WebP del contrato y lo deja como RGBA en memoria.
 *
 * Se decodifica sin premultiplicar el alfa ni convertir el espacio de color:
 * el gris del archivo es un dato (MJy/sr estirados), no un color, y tiene que
 * llegar al shader tal cual.
 */
export async function cargarPixeles(ruta: string, senal?: AbortSignal): Promise<Pixeles> {
  const blob = await leerBinario(ruta, senal)
  const mapa = await createImageBitmap(blob, {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
  })
  try {
    const lienzo = document.createElement('canvas')
    lienzo.width = mapa.width
    lienzo.height = mapa.height
    const ctx = lienzo.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new ErrorDeDatos(`${ruta}: el navegador no puede leer la imagen`)
    ctx.drawImage(mapa, 0, 0)
    const { data } = ctx.getImageData(0, 0, mapa.width, mapa.height)
    return { ancho: mapa.width, alto: mapa.height, datos: data }
  } finally {
    mapa.close()
  }
}
