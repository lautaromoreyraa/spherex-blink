import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { Campo, Indice } from '../api/tipos.ts'
import Enlace from '../componentes/Enlace.tsx'
import ImagenFijaDeLaEscena from '../componentes/espacio/ImagenFijaDeLaEscena.tsx'
import PanelDeParalaje from '../componentes/espacio/PanelDeParalaje.tsx'
import '../estilos/escena.css'
import { useDatosDeLaEscena } from '../hooks/useDatosDeLaEscena.ts'
import { useIdioma } from '../hooks/useIdioma.ts'
import { useMovimientoReducido } from '../hooks/useMovimientoReducido.ts'
import { useNavegacion } from '../hooks/useRuta.ts'
import type { ModoDeEscala } from '../util/escalas.ts'
import { direccion, type LlegadaDesdeLaEscena } from '../util/rutas.ts'
import { formatearFechaUtc } from '../util/textos.ts'
import { hayWebGL } from '../util/webgl.ts'

// three, drei y astronomy-engine viven en este chunk: sin WebGL no se bajan
// y el resto del sitio no los espera (RNF-13).
const EscenaEspacial = lazy(() => import('../componentes/espacio/EscenaEspacial.tsx'))

export default function Escena({ id }: { id: string }) {
  const datos = useDatosDeLaEscena(id)
  const { t } = useIdioma()

  useEffect(() => {
    document.title = `${t('escena.documento')} · spherex-blink`
  }, [t])

  if (datos.estado === 'cargando') {
    return (
      <section className="escena" aria-busy="true">
        <p className="escena__estado">{t('cargando')}</p>
      </section>
    )
  }
  if (datos.estado === 'no-encontrado' || datos.estado === 'error') {
    return (
      <section className="escena">
        <h1 className="escena__titulo">{t('escena.titulo')}</h1>
        <p className="escena__estado" role="alert">
          {datos.estado === 'no-encontrado'
            ? t('escena.noEncontrado', { id })
            : t('escena.errorDeCarga', { id, detalle: datos.mensaje })}
        </p>
        <p>
          <Enlace href={direccion({ pagina: 'escena', id: 'makemake' })}>
            {t('escena.verMakemake')}
          </Enlace>{' '}
          ·{' '}
          <Enlace href={direccion({ pagina: 'inicio' })}>{t('noEncontrada.volver')}</Enlace>
        </p>
      </section>
    )
  }
  // La key reinicia la época y el vuelo al cambiar de campo.
  return <EscenaDelCampo key={datos.campo.id} campo={datos.campo} indice={datos.indice} />
}

function EscenaDelCampo({ campo, indice }: { campo: Campo; indice: Indice }) {
  const { navegar } = useNavegacion()
  const { t, idioma } = useIdioma()
  const movimientoReducido = useMovimientoReducido()
  const [conWebGL] = useState(() => hayWebGL())
  const [indiceDeEpoca, setIndiceDeEpoca] = useState(0)
  const [modo, setModo] = useState<ModoDeEscala>('ilustrativa')
  const [volando, setVolando] = useState(false)
  const saltear = useRef<HTMLButtonElement>(null)

  const epoca = campo.epocas[indiceDeEpoca]!
  const total = campo.epocas.length
  const esMakemake = campo.geometria?.objeto.nombre === 'Makemake'
  const nombreDelCampo = campo.nombre[idioma]
  const fecha = formatearFechaUtc(epoca.fecha_utc, idioma)

  const irAlCampo = useCallback(() => {
    // El visor abre en la primera época; el estado le dice de dónde viene
    // para que tome el foco (RF-36).
    const llegada: LlegadaDesdeLaEscena = { desdeLaEscena: true, epoca: campo.epocas[0]!.id }
    navegar(direccion({ pagina: 'campo', id: campo.id }), llegada)
  }, [navegar, campo])

  const volar = () => {
    if (movimientoReducido || !conWebGL) irAlCampo()
    else setVolando(true)
  }

  useEffect(() => {
    if (!volando) return
    saltear.current?.focus()
    const alApretar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') irAlCampo()
    }
    window.addEventListener('keydown', alApretar)
    return () => window.removeEventListener('keydown', alApretar)
  }, [volando, irAlCampo])

  return (
    <section className="escena" aria-labelledby="escena-titulo">
      <header className="escena__encabezado">
        <h1 id="escena-titulo" className="escena__titulo">
          {t('escena.titulo')}
        </h1>
        <p className="escena__bajada">
          {campo.geometria
            ? t('escena.bajadaObjeto', { objeto: campo.geometria.objeto.nombre, campo: nombreDelCampo })
            : t('escena.bajadaSinObjeto', { campo: nombreDelCampo })}
        </p>
        <nav aria-label={t('escena.campos')}>
          <ul className="escena__campos">
            {indice.campos.map((c) => (
              <li key={c.id}>
                <Enlace
                  href={direccion({ pagina: 'escena', id: c.id })}
                  aria-current={c.id === campo.id ? 'page' : undefined}
                >
                  {c.nombre[idioma]}
                </Enlace>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <p className="escena__aviso" role="note">
        {t(modo === 'ilustrativa' ? 'escena.avisoIlustrativa' : 'escena.avisoReal')}
        {esMakemake && ` ${t('escena.avisoMakemake')}`}
      </p>

      <div className="escena__lienzo">
        {conWebGL ? (
          <Suspense fallback={<p className="escena__estado">{t('escena.cargando3d')}</p>}>
            <EscenaEspacial
              campo={campo}
              indiceDeEpoca={indiceDeEpoca}
              modo={modo}
              volando={volando}
              movimientoReducido={movimientoReducido}
              onVolar={volar}
              onVueloTerminado={irAlCampo}
            />
          </Suspense>
        ) : (
          <ImagenFijaDeLaEscena esMakemake={esMakemake} />
        )}
        {volando && (
          <div className="escena__vuelo" role="status">
            <span>{t('escena.volando', { campo: nombreDelCampo })}</span>
            <button ref={saltear} type="button" className="escena__boton" onClick={irAlCampo}>
              {t('escena.saltear')}
            </button>
          </div>
        )}
      </div>

      <div className="escena__controles">
        <div className="escena__tiempo">
          <label htmlFor="escena-epoca">
            {t('escena.epoca', { n: indiceDeEpoca + 1, total })}
          </label>
          <input
            id="escena-epoca"
            type="range"
            min={0}
            max={total - 1}
            step={1}
            value={indiceDeEpoca}
            disabled={volando}
            aria-valuetext={t('escena.epocaValor', { fecha, pasada: epoca.pasada })}
            onChange={(e) => setIndiceDeEpoca(Number(e.target.value))}
          />
          <p className="escena__fecha" aria-live="polite">
            <time dateTime={epoca.fecha_utc}>{fecha}</time>
            <span className="escena__pasada"> · {t('escena.pasada', { n: epoca.pasada })}</span>
          </p>
        </div>
        <div className="escena__acciones">
          <button
            type="button"
            className="escena__boton"
            aria-pressed={modo === 'real'}
            disabled={volando || !conWebGL}
            onClick={() => setModo((m) => (m === 'real' ? 'ilustrativa' : 'real'))}
          >
            {t('escena.escalaReal')}
          </button>
          <button
            type="button"
            className="escena__boton escena__boton--principal"
            disabled={volando}
            onClick={volar}
          >
            {t('escena.volar', { campo: nombreDelCampo })}
          </button>
        </div>
      </div>

      <PanelDeParalaje campo={campo} indiceDeEpoca={indiceDeEpoca} />

      <p className="escena__creditos">
        {campo.geometria
          ? t('escena.origenConObjeto', { objeto: campo.geometria.objeto.nombre })
          : t('escena.origenSinObjeto')}{' '}
        {t('escena.texturas')}{' '}
        <a href="https://www.solarsystemscope.com/textures/" rel="noopener noreferrer">
          Solar System Scope
        </a>{' '}
        (
        <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener noreferrer">
          CC BY 4.0
        </a>
        ).
      </p>
    </section>
  )
}
