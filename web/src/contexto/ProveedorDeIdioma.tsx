import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { esIdioma, idiomaDelNavegador, traducir, type Idioma } from '../util/textos.ts'
import { IdiomaContexto } from './contextos.ts'

const CLAVE_GUARDADA = 'spherex-blink.idioma'

// El idioma elegido se recuerda en el navegador (RNF-06). localStorage puede
// no estar (ventana privada, sitio bloqueado): entonces sólo no se recuerda.
function idiomaInicial(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE_GUARDADA)
    if (esIdioma(guardado)) return guardado
  } catch {
    // sin almacenamiento: se usa el del navegador
  }
  return idiomaDelNavegador(
    navigator.languages?.length ? navigator.languages : [navigator.language],
  )
}

export default function ProveedorDeIdioma({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial)

  useEffect(() => {
    document.documentElement.lang = idioma
  }, [idioma])

  const cambiarIdioma = useCallback((nuevo: Idioma) => {
    setIdioma(nuevo)
    try {
      localStorage.setItem(CLAVE_GUARDADA, nuevo)
    } catch {
      // sin almacenamiento: el cambio vale hasta recargar
    }
  }, [])

  const valor = useMemo(
    () => ({
      idioma,
      cambiarIdioma,
      t: (clave: Parameters<typeof traducir>[1], valores?: Parameters<typeof traducir>[2]) =>
        traducir(idioma, clave, valores),
    }),
    [idioma, cambiarIdioma],
  )

  return <IdiomaContexto.Provider value={valor}>{children}</IdiomaContexto.Provider>
}
