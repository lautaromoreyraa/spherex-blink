/**
 * Estado que cruza todas las páginas: el idioma (RNF-06) y la navegación.
 */
import { createContext } from 'react'
import type { Clave, Idioma, Valores } from '../util/textos.ts'

export interface ContextoDeIdioma {
  idioma: Idioma
  cambiarIdioma: (idioma: Idioma) => void
  t: (clave: Clave, valores?: Valores) => string
}

export const IdiomaContexto = createContext<ContextoDeIdioma | null>(null)

export interface ContextoDeNavegacion {
  /**
   * Va a una dirección del sitio sin recargar, como un enlace común. El
   * estado opcional viaja en `history.state` (por ejemplo, la escena le dice
   * al visor con qué época abrir, RF-36).
   */
  navegar: (href: string, estado?: unknown) => void
}

export const NavegacionContexto = createContext<ContextoDeNavegacion | null>(null)
