import { useCallback, useContext, useEffect, useState } from 'react'
import { NavegacionContexto, type ContextoDeNavegacion } from '../contexto/contextos.ts'
import { rutaDe, type Ruta } from '../util/rutas.ts'

/**
 * La página actual según la dirección del navegador, con atrás y adelante.
 *
 * Un router propio de veinte líneas alcanza para cuatro páginas y no suma una
 * dependencia al presupuesto de JS inicial (RNF-13). Cloudflare Pages y
 * `vite preview` sirven index.html para cualquier ruta, así que un enlace
 * directo a /campo/<id> también abre.
 */
export function useRutaActual(): { ruta: Ruta; navegar: ContextoDeNavegacion['navegar'] } {
  const [ruta, setRuta] = useState<Ruta>(() => rutaDe(window.location.pathname))

  useEffect(() => {
    const alVolver = () => setRuta(rutaDe(window.location.pathname))
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [])

  const navegar = useCallback((href: string, estado: unknown = null) => {
    const destino = new URL(href, window.location.href)
    if (destino.origin !== window.location.origin) {
      window.location.assign(destino.href)
      return
    }
    window.history.pushState(estado, '', destino.pathname + destino.search + destino.hash)
    setRuta(rutaDe(destino.pathname))
    window.scrollTo({ top: 0 })
  }, [])

  return { ruta, navegar }
}

export function useNavegacion(): ContextoDeNavegacion {
  const contexto = useContext(NavegacionContexto)
  if (!contexto) throw new Error('useNavegacion necesita el proveedor de App')
  return contexto
}
