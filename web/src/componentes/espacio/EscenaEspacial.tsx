import { Line, PerformanceMonitor, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { BackSide } from 'three'
import type { Campo } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import type { ModoDeEscala } from '../../util/escalas.ts'
import { rutaDeDatos } from '../../util/rutas.ts'
import Camara, { type Enfoque } from './Camara.tsx'
import Cuerpo from './Cuerpo.tsx'
import { rotuloDelCuerpo, rutaDeTextura } from './cuerpos.ts'
import { armarModelo, encuadreInicial, type CuerpoEnEscena } from './modelo.ts'
import RecorteDelCampo from './RecorteDelCampo.tsx'

export interface PropsDeLaEscena {
  campo: Campo
  indiceDeEpoca: number
  modo: ModoDeEscala
  volando: boolean
  movimientoReducido: boolean
  /** Id del cuerpo elegido en la lista de la página; la cámara lo sigue. */
  elegido: string | null
  onVueloTerminado: () => void
}

/** Colores de la escena: salen de las variables CSS de `.escena`. */
interface Colores {
  orbita: string
  orbitaDelObjeto: string
  linea: string
  lineaActual: string
  liso: string
  marco: string
}

function leerColores(elemento: HTMLElement): Colores {
  const estilo = getComputedStyle(elemento)
  const variable = (nombre: string) => estilo.getPropertyValue(nombre).trim()
  return {
    orbita: variable('--escena-orbita'),
    orbitaDelObjeto: variable('--escena-orbita-objeto'),
    linea: variable('--escena-linea'),
    lineaActual: variable('--escena-linea-actual'),
    liso: variable('--escena-cuerpo-liso'),
    marco: variable('--escena-marco'),
  }
}

const DPR_MINIMO = 0.75

/**
 * La escena 3D del Sistema Solar (RF-34, RF-35, RF-36). Va en su propio
 * chunk: la página la carga con React.lazy sólo si hay WebGL (RNF-13).
 */
export default function EscenaEspacial({
  campo,
  indiceDeEpoca,
  modo,
  volando,
  movimientoReducido,
  onVueloTerminado,
  elegido,
}: PropsDeLaEscena) {
  const [colores, setColores] = useState<Colores | null>(null)
  const dprMaximo = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio, 2)
  const [dpr, setDpr] = useState(dprMaximo)
  const { t, idioma } = useIdioma()

  // Los rótulos se traducen acá, fuera del lienzo: los de `Html` viven en
  // otra raíz de React y no ven el contexto de idioma (RNF-06).
  const rotuloDe = (cuerpo: CuerpoEnEscena): string =>
    rotuloDelCuerpo(
      t,
      cuerpo.id,
      cuerpo.nombre ? { nombre: cuerpo.nombre, ilustracion: cuerpo.ilustracion } : null,
    )

  const contenedor = useCallback((elemento: HTMLDivElement | null) => {
    if (elemento) setColores(leerColores(elemento))
  }, [])

  const modelo = useMemo(() => armarModelo(campo, indiceDeEpoca, modo), [campo, indiceDeEpoca, modo])
  // El encuadre sale de la primera época: la cámara no salta al mover el tiempo.
  const encuadre = useMemo(() => encuadreInicial(armarModelo(campo, 0, modo).campo), [campo, modo])

  // El enfoque sigue al cuerpo elegido cuando cambia la época o la escala.
  const actual = elegido ? modelo.cuerpos.find((c) => c.id === elegido) : undefined
  const posicionActual = actual?.posicion
  const radioActual = actual?.radio
  const enfoque = useMemo<Enfoque | null>(
    () =>
      posicionActual && radioActual !== undefined
        ? { posicion: posicionActual, radio: radioActual }
        : null,
    [posicionActual, radioActual],
  )
  const vuelo = useMemo(
    () => (volando ? { tierra: modelo.campo.tierra, campo: modelo.campo.posicion } : null),
    [volando, modelo.campo.tierra, modelo.campo.posicion],
  )

  const primera = campo.epocas[0]!

  return (
    <div ref={contenedor} className="escena__lienzo-3d" data-volando={volando || undefined}>
      {colores && (
        <Canvas
          dpr={dpr}
          camera={{ fov: 45, near: 0.01, far: 20_000, position: [0, 38, 82] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          {/*
           * Si la tasa de cuadros cae debajo de 50, baja la resolución de a
           * pasos; si sobra, la vuelve a subir (RNF-13).
           */}
          <PerformanceMonitor
            bounds={(refresco) => (refresco > 90 ? [50, 90] : [50, 60])}
            flipflops={4}
            onDecline={() => setDpr((d) => Math.max(DPR_MINIMO, d - 0.25))}
            onIncline={() => setDpr((d) => Math.min(dprMaximo, d + 0.25))}
            onFallback={() => setDpr(DPR_MINIMO)}
          />
          <ambientLight intensity={0.12} />
          <pointLight position={[0, 0, 0]} intensity={3} decay={0} />
          <Camara
            modo={modo}
            encuadre={encuadre}
            enfoque={enfoque}
            vuelo={vuelo}
            movimientoReducido={movimientoReducido}
            onVueloTerminado={onVueloTerminado}
          />

          {modelo.orbitas.map((orbita) => (
            <Line
              key={orbita.id}
              points={orbita.puntos as [number, number, number][]}
              color={orbita.id === 'objeto' ? colores.orbitaDelObjeto : colores.orbita}
              lineWidth={1}
              transparent
              opacity={orbita.id === 'objeto' ? 0.9 : 0.45}
            />
          ))}

          {modelo.lineas.map((linea) => (
            <Line
              key={linea.epocaId}
              points={[linea.desde as [number, number, number], linea.hasta as [number, number, number]]}
              color={linea.actual ? colores.lineaActual : colores.linea}
              lineWidth={linea.actual ? 2.5 : 1}
              transparent
              opacity={linea.actual ? 1 : 0.5}
            />
          ))}

          <Suspense fallback={null}>
            <Fondo />
            {modelo.cuerpos.map((cuerpo) => (
              <Cuerpo
                key={cuerpo.id}
                cuerpo={cuerpo}
                rotulo={rotuloDe(cuerpo)}
                elegido={elegido === cuerpo.id}
                colorLiso={colores.liso}
              />
            ))}
            <RecorteDelCampo
              imagen={rutaDeDatos(primera.imagen)}
              texto={campo.nombre[idioma]}
              posicion={modelo.campo.posicion}
              tierra={modelo.campo.tierra}
              tamano={modelo.campo.tamano}
              colorDelMarco={colores.marco}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}

function Fondo() {
  const mapa = useTexture(rutaDeTextura('estrellas'))
  return (
    <mesh>
      <sphereGeometry args={[9_000, 48, 24]} />
      <meshBasicMaterial map={mapa} side={BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
