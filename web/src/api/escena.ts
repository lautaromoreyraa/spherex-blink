import { rutaDeDatos } from '../util/rutas.ts'
import type { Campo, Indice } from './tipos.ts'

/**
 * Lo que la escena del Sistema Solar lee de `web/public/datos/` (RF-34):
 * el índice, para elegir el campo, y el `campo.json` con sus épocas y su
 * `geometria`. Son archivos estáticos: la escena anda sin red (RNF-01).
 */

const ID_DE_CAMPO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function pedirJson<T>(ruta: string, senal?: AbortSignal): Promise<T> {
  const respuesta = await fetch(rutaDeDatos(ruta), { signal: senal })
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (HTTP ${respuesta.status})`)
  }
  return (await respuesta.json()) as T
}

export function pedirIndice(senal?: AbortSignal): Promise<Indice> {
  return pedirJson<Indice>('indice.json', senal)
}

export function pedirCampo(id: string, senal?: AbortSignal): Promise<Campo> {
  // El id llega de la URL: se valida antes de armar la ruta del archivo.
  if (!ID_DE_CAMPO.test(id)) {
    return Promise.reject(new Error(`Identificador de campo inválido: «${id}»`))
  }
  return pedirJson<Campo>(`campos/${id}/campo.json`, senal)
}
