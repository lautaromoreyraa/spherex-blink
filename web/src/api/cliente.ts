/**
 * Lectura de los archivos estáticos de `datos/` (capa estática del SRS 4.1).
 *
 * Todo sale del mismo origen que el sitio: la demo no pide nada afuera
 * (RNF-01). Los errores se traducen a un mensaje que se puede mostrar.
 */
import { rutaDeDatos } from '../util/rutas.ts'

export class ErrorDeDatos extends Error {
  readonly estado: number | null

  constructor(message: string, estado: number | null = null) {
    super(message)
    this.name = 'ErrorDeDatos'
    this.estado = estado
  }
}

async function pedir(relativa: string, senal?: AbortSignal): Promise<Response> {
  let respuesta: Response
  try {
    respuesta = await fetch(rutaDeDatos(relativa), { signal: senal ?? null })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ErrorDeDatos(`${relativa}: sin respuesta del servidor`)
  }
  if (!respuesta.ok) {
    throw new ErrorDeDatos(`${relativa}: HTTP ${respuesta.status}`, respuesta.status)
  }
  return respuesta
}

export async function leerJson<T>(relativa: string, senal?: AbortSignal): Promise<T> {
  const respuesta = await pedir(relativa, senal)
  try {
    return (await respuesta.json()) as T
  } catch {
    throw new ErrorDeDatos(`${relativa}: no es JSON válido`)
  }
}

export async function leerBinario(relativa: string, senal?: AbortSignal): Promise<Blob> {
  return (await pedir(relativa, senal)).blob()
}
