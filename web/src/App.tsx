import { useEffect, useMemo, useRef } from 'react'
import { NavegacionContexto } from './contexto/contextos.ts'
import ProveedorDeIdioma from './contexto/ProveedorDeIdioma.tsx'
import { useRutaActual } from './hooks/useRuta.ts'
import Layout from './layout/Layout.tsx'
import Campo from './paginas/Campo.tsx'
import Inicio from './paginas/Inicio.tsx'
import Limites from './paginas/Limites.tsx'
import NoEncontrada from './paginas/NoEncontrada.tsx'

// Arranque: idioma, ruta y layout. Cada página carga sus propios datos.
export default function App() {
  const { ruta, navegar } = useRutaActual()
  const navegacion = useMemo(() => ({ navegar }), [navegar])
  const primera = useRef(true)

  // Al cambiar de página el foco va al contenido, como en una carga normal:
  // si no, el lector de pantalla se queda en el enlace que ya no está.
  useEffect(() => {
    if (primera.current) {
      primera.current = false
      return
    }
    document.getElementById('contenido')?.focus({ preventScroll: true })
  }, [ruta])

  let pagina
  switch (ruta.pagina) {
    case 'inicio':
      pagina = <Inicio />
      break
    case 'campo':
      pagina = <Campo key={ruta.id} id={ruta.id} />
      break
    case 'limites':
      pagina = <Limites />
      break
    case 'no-encontrada':
      pagina = <NoEncontrada />
      break
  }

  return (
    <ProveedorDeIdioma>
      <NavegacionContexto.Provider value={navegacion}>
        <Layout ruta={ruta}>{pagina}</Layout>
      </NavegacionContexto.Provider>
    </ProveedorDeIdioma>
  )
}
