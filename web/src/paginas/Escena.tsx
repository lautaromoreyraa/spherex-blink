import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { Campo, Indice } from '../api/tipos.ts'
import Enlace from '../componentes/Enlace.tsx'
import ImagenFijaDeLaEscena from '../componentes/espacio/ImagenFijaDeLaEscena.tsx'
import PanelDeParalaje from '../componentes/espacio/PanelDeParalaje.tsx'
import '../estilos/escena.css'
import { useDatosDeLaEscena } from '../hooks/useDatosDeLaEscena.ts'
import { useMovimientoReducido } from '../hooks/useMovimientoReducido.ts'
import { useNavegacion } from '../hooks/useRuta.ts'
import type { ModoDeEscala } from '../util/escalas.ts'
import { fechaUtc } from '../util/formatos.ts'
import { direccion, type LlegadaDesdeLaEscena } from '../util/rutas.ts'
import { hayWebGL } from '../util/webgl.ts'

// three, drei y astronomy-engine viven en este chunk: sin WebGL no se bajan
// y el resto del sitio no los espera (RNF-13).
const EscenaEspacial = lazy(() => import('../componentes/espacio/EscenaEspacial.tsx'))

export default function Escena({ id }: { id: string }) {
  const datos = useDatosDeLaEscena(id)

  useEffect(() => {
    document.title = 'Sistema Solar · spherex-blink'
  }, [])

  if (datos.estado === 'cargando') {
    return (
      <section className="escena" aria-busy="true">
        <p className="escena__estado">Cargando la escena…</p>
      </section>
    )
  }
  if (datos.estado === 'no-encontrado' || datos.estado === 'error') {
    return (
      <section className="escena">
        <h1 className="escena__titulo">El Sistema Solar en cada pasada</h1>
        <p className="escena__estado" role="alert">
          {datos.estado === 'no-encontrado'
            ? `No encontramos ese campo: «${id}» no es uno de los campos de la demo.`
            : `No se pudo cargar el campo «${id}»: ${datos.mensaje}`}
        </p>
        <p>
          <Enlace href={direccion({ pagina: 'escena', id: 'makemake' })}>
            Ver la escena de Makemake
          </Enlace>{' '}
          ·{' '}
          <Enlace href={direccion({ pagina: 'inicio' })}>Ver los campos</Enlace>
        </p>
      </section>
    )
  }
  // La key reinicia la época y el vuelo al cambiar de campo.
  return <EscenaDelCampo key={datos.campo.id} campo={datos.campo} indice={datos.indice} />
}

function EscenaDelCampo({ campo, indice }: { campo: Campo; indice: Indice }) {
  const { navegar } = useNavegacion()
  const movimientoReducido = useMovimientoReducido()
  const [conWebGL] = useState(() => hayWebGL())
  const [indiceDeEpoca, setIndiceDeEpoca] = useState(0)
  const [modo, setModo] = useState<ModoDeEscala>('ilustrativa')
  const [volando, setVolando] = useState(false)
  const saltear = useRef<HTMLButtonElement>(null)

  const epoca = campo.epocas[indiceDeEpoca]!
  const total = campo.epocas.length
  const esMakemake = campo.geometria?.objeto.nombre === 'Makemake'

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
          El Sistema Solar en cada pasada
        </h1>
        <p className="escena__bajada">
          Dónde estaban la Tierra y {campo.geometria?.objeto.nombre ?? 'los planetas'} cuando SPHEREx
          fotografió el campo {campo.nombre.es}.
        </p>
        <nav aria-label="Campos de la escena">
          <ul className="escena__campos">
            {indice.campos.map((c) => (
              <li key={c.id}>
                <Enlace
                  href={direccion({ pagina: 'escena', id: c.id })}
                  aria-current={c.id === campo.id ? 'page' : undefined}
                >
                  {c.nombre.es}
                </Enlace>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <p className="escena__aviso" role="note">
        {modo === 'ilustrativa'
          ? 'Tamaños y distancias no están a escala: las distancias están comprimidas y los cuerpos agrandados para que se vean. Las direcciones sí son las reales.'
          : 'Escala real de distancias y tamaños: los cuerpos son más chicos que un píxel y sólo se ven sus rótulos.'}
        {esMakemake &&
          ' La superficie de Makemake es una ilustración: nadie la fotografió. Su posición sí es la de JPL Horizons.'}
      </p>

      <div className="escena__lienzo">
        {conWebGL ? (
          <Suspense fallback={<p className="escena__estado">Cargando la escena 3D…</p>}>
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
            <span>Volando al campo {campo.nombre.es}…</span>
            <button ref={saltear} type="button" className="escena__boton" onClick={irAlCampo}>
              Saltear el vuelo (Esc)
            </button>
          </div>
        )}
      </div>

      <div className="escena__controles">
        <div className="escena__tiempo">
          <label htmlFor="escena-epoca">
            Época {indiceDeEpoca + 1} de {total}
          </label>
          <input
            id="escena-epoca"
            type="range"
            min={0}
            max={total - 1}
            step={1}
            value={indiceDeEpoca}
            disabled={volando}
            aria-valuetext={`${fechaUtc(epoca.fecha_utc)}, pasada ${epoca.pasada}`}
            onChange={(e) => setIndiceDeEpoca(Number(e.target.value))}
          />
          <p className="escena__fecha" aria-live="polite">
            <time dateTime={epoca.fecha_utc}>{fechaUtc(epoca.fecha_utc)}</time>
            <span className="escena__pasada"> · pasada {epoca.pasada}</span>
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
            Escala real
          </button>
          <button
            type="button"
            className="escena__boton escena__boton--principal"
            disabled={volando}
            onClick={volar}
          >
            Volar al campo {campo.nombre.es}
          </button>
        </div>
      </div>

      <PanelDeParalaje campo={campo} indiceDeEpoca={indiceDeEpoca} />

      <p className="escena__creditos">
        {campo.geometria
          ? `La Tierra y ${campo.geometria.objeto.nombre} salen de JPL Horizons; los demás planetas se calculan con astronomy-engine.`
          : 'La Tierra y los planetas se calculan con astronomy-engine.'}{' '}
        Texturas de{' '}
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
