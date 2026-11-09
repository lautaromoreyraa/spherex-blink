import { useContext } from 'react'
import { IdiomaContexto, type ContextoDeIdioma } from '../contexto/contextos.ts'

export function useIdioma(): ContextoDeIdioma {
  const contexto = useContext(IdiomaContexto)
  if (!contexto) throw new Error('useIdioma necesita <ProveedorDeIdioma>')
  return contexto
}
