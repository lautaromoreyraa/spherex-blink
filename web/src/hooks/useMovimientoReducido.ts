import { useSyncExternalStore } from 'react'

const CONSULTA = '(prefers-reduced-motion: reduce)'

function suscribir(avisar: () => void): () => void {
  const lista = window.matchMedia(CONSULTA)
  lista.addEventListener('change', avisar)
  return () => lista.removeEventListener('change', avisar)
}

/**
 * Si la persona pidió menos movimiento al sistema (RF-36, RNF-13): la escena
 * corta en vez de volar y la cámara salta en vez de deslizarse.
 */
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  )
}
