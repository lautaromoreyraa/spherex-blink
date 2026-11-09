import { useEffect, useState } from 'react'
import { pedirCampo, pedirIndice } from '../api/escena.ts'
import type { Campo, Indice } from '../api/tipos.ts'

export type DatosDeLaEscena =
  | { estado: 'cargando' }
  | { estado: 'no-encontrado' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; indice: Indice; campo: Campo }

/**
 * Carga el índice y el campo de la escena; vuelve a cargar si cambia el id.
 * Un id que no está en el índice es «no encontrado», no un error de red: la
 * página lo dice así en vez de mostrar un 404 técnico.
 */
export function useDatosDeLaEscena(id: string): DatosDeLaEscena {
  const [datos, setDatos] = useState<{ id: string; valor: DatosDeLaEscena } | null>(null)

  useEffect(() => {
    const control = new AbortController()
    const cargar = async (): Promise<DatosDeLaEscena> => {
      const indice = await pedirIndice(control.signal)
      if (!indice.campos.some((c) => c.id === id)) return { estado: 'no-encontrado' }
      const campo = await pedirCampo(id, control.signal)
      return { estado: 'listo', indice, campo }
    }
    cargar()
      .then((valor) => setDatos({ id, valor }))
      .catch((error: unknown) => {
        if (control.signal.aborted) return
        const mensaje = error instanceof Error ? error.message : String(error)
        setDatos({ id, valor: { estado: 'error', mensaje } })
      })
    return () => control.abort()
  }, [id])

  // Mientras llega el campo nuevo no se muestra el anterior con otro id.
  return datos && datos.id === id ? datos.valor : { estado: 'cargando' }
}
