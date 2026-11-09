import type { ReactNode } from 'react'
import Enlace from '../componentes/Enlace.tsx'
import { useIdioma } from '../hooks/useIdioma.ts'
import '../estilos/layout.css'
import { direccion, type Ruta } from '../util/rutas.ts'
import { IDIOMAS } from '../util/textos.ts'
import Pie from './Pie.tsx'

const NOMBRES_DE_IDIOMA = { es: 'Español', en: 'English' } as const

export default function Layout({ ruta, children }: { ruta: Ruta; children: ReactNode }) {
  const { t, idioma, cambiarIdioma } = useIdioma()

  return (
    <div className="layout">
      <a className="saltar" href="#contenido">
        {t('sitio.saltar')}
      </a>
      <header className="barra">
        <Enlace href={direccion({ pagina: 'inicio' })} className="barra__marca">
          spherex-blink
        </Enlace>
        <nav className="barra__nav" aria-label={t('sitio.navegacion')}>
          <Enlace
            href={direccion({ pagina: 'inicio' })}
            aria-current={ruta.pagina === 'inicio' ? 'page' : undefined}
          >
            {t('nav.campos')}
          </Enlace>
          <Enlace
            href={direccion({ pagina: 'limites' })}
            aria-current={ruta.pagina === 'limites' ? 'page' : undefined}
          >
            {t('nav.limites')}
          </Enlace>
        </nav>
        <div className="barra__idioma" role="group" aria-label={t('idioma.etiqueta')}>
          {IDIOMAS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="barra__idioma-boton"
              lang={opcion}
              aria-pressed={idioma === opcion}
              onClick={() => cambiarIdioma(opcion)}
            >
              {NOMBRES_DE_IDIOMA[opcion]}
            </button>
          ))}
        </div>
      </header>
      <main id="contenido" className="layout__contenido" tabIndex={-1}>
        {children}
      </main>
      <Pie titulo={t('pie.titulo')} />
    </div>
  )
}
