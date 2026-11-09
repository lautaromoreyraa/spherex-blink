/**
 * Qué objetos conocidos se marcan y dónde (RF-14).
 *
 * Las estrellas de Gaia DR3 están en el campo para controlar la alineación
 * (RF-04), no porque haya que mirarlas: van en una capa aparte, apagada al
 * abrir, para no tapar el objeto destacado.
 */
import type { Campo, DeteccionDeConocido, ObjetoConocido, PosicionEsperada } from '../api/tipos.ts'

export function esDeControl(objeto: ObjetoConocido): boolean {
  return objeto.fuente === 'Gaia DR3'
}

/**
 * Cómo se sabe dónde está el objeto. Se dice siempre, para que nadie tome una
 * posición de catálogo o de efeméride por una detección a ciegas (RNF-07).
 */
export type OrigenDeLaPosicion = 'efemeride' | 'catalogo'

export function origenDeLaPosicion(objeto: ObjetoConocido): OrigenDeLaPosicion {
  return objeto.fuente === 'Horizons' || objeto.fuente === 'SkyBoT' ? 'efemeride' : 'catalogo'
}

export interface Marcador {
  /** Índice en `campo.conocidos`, estable entre épocas. */
  indice: number
  objeto: ObjetoConocido
  posicion: PosicionEsperada
  deteccion: DeteccionDeConocido | null
  control: boolean
}

/** Los marcadores de una época: sólo los objetos que están dentro del campo en ella. */
export function marcadoresDeLaEpoca(
  campo: Campo,
  epocaId: string,
  opciones: { control: boolean },
): Marcador[] {
  const marcadores: Marcador[] = []
  campo.conocidos.forEach((objeto, indice) => {
    const control = esDeControl(objeto)
    if (control && !opciones.control) return
    const posicion = objeto.posiciones.find((p) => p.epoca_id === epocaId)
    if (!posicion || !posicion.dentro_del_campo) return
    const deteccion = objeto.deteccion.find((d) => d.epoca_id === epocaId) ?? null
    marcadores.push({ indice, objeto, posicion, deteccion, control })
  })
  return marcadores
}

/**
 * El trazo que une las posiciones esperadas de un objeto en las épocas
 * elegidas, en orden de fecha. Sin al menos dos puntos no hay trazo.
 */
export function recorrido(
  objeto: ObjetoConocido,
  idsEnOrden: readonly string[],
): PosicionEsperada[] {
  const porEpoca = new Map(objeto.posiciones.map((p) => [p.epoca_id, p]))
  const puntos = idsEnOrden
    .map((id) => porEpoca.get(id))
    .filter((p): p is PosicionEsperada => p !== undefined && p.dentro_del_campo)
  return puntos.length >= 2 ? puntos : []
}

/** Cuánto se corre la posición esperada entre la primera y la última época, en píxeles. */
export function corrimientoTotalPx(objeto: ObjetoConocido): number {
  const dentro = objeto.posiciones.filter((p) => p.dentro_del_campo)
  const primera = dentro[0]
  const ultima = dentro[dentro.length - 1]
  if (!primera || !ultima) return 0
  return Math.hypot(ultima.x - primera.x, ultima.y - primera.y)
}
