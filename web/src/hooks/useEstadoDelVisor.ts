import { useEffect, useMemo, useReducer } from 'react'
import type { Campo } from '../api/tipos.ts'
import { crearReductor, estadoInicial, type Apertura } from '../util/estadoDelVisor.ts'
import { intervaloSeguro } from '../util/parpadeo.ts'

export function prefiereMovimientoReducido(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Estado del visor de un campo con el temporizador del parpadeo. El
 * intervalo sale siempre de `intervaloSeguro`: nunca más de 3 cambios por
 * segundo (RNF-04).
 */
export function useEstadoDelVisor(campo: Campo, apertura: Apertura | null = null) {
  const reducir = useMemo(() => crearReductor(campo), [campo])
  const [estado, despachar] = useReducer(reducir, campo, (c) =>
    estadoInicial(c, prefiereMovimientoReducido(), apertura),
  )

  useEffect(() => {
    if (!estado.reproduciendo) return
    const temporizador = window.setInterval(
      () => despachar({ tipo: 'avanzar' }),
      intervaloSeguro(estado.cambiosPorSegundo),
    )
    return () => window.clearInterval(temporizador)
  }, [estado.reproduciendo, estado.cambiosPorSegundo])

  return { estado, despachar }
}
