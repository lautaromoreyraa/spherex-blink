import Layout from './layout/Layout.tsx'
import Inicio from './paginas/Inicio.tsx'

// Arranque de la aplicación. El router entra con el visor (H3); hasta
// entonces hay una sola página, siempre dentro del layout común.
export default function App() {
  return (
    <Layout>
      <Inicio />
    </Layout>
  )
}
