import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// IBM Plex (SIL OFL 1.1) empaquetada por Vite: las fuentes salen del propio
// sitio y la demo no depende de Google Fonts ni de la red (RNF-01).
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
// Tokens y base antes que App: así las hojas de cada página, que vienen con
// sus componentes, quedan después en el CSS final y pueden sobrescribir.
import './estilos/tokens.css'
import './estilos/base.css'
import App from './App.tsx'

const raiz = document.getElementById('raiz')
if (!raiz) {
  throw new Error('Falta el elemento #raiz en index.html')
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
