import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type ComponentRef } from 'react'
import { Vector3 } from 'three'
import type { ModoDeEscala, PuntoDeEscena } from '../../util/escalas.ts'
import { cuadroDelVuelo, DURACION_DEL_VUELO_MS, type Vuelo } from '../../util/vuelo.ts'
import type { Encuadre } from './modelo.ts'

export interface Enfoque {
  posicion: PuntoDeEscena
  radio: number
}

interface Props {
  modo: ModoDeEscala
  /** Vista con la que abre; cambia con el campo y con la escala. */
  encuadre: Encuadre
  enfoque: Enfoque | null
  /** Tierra y campo de la época actual mientras se vuela; null si no. */
  vuelo: Pick<Vuelo, 'tierra' | 'campo'> | null
  movimientoReducido: boolean
  onVueloTerminado: () => void
}

/**
 * La cámara: órbita con mouse, tacto o teclado; se acerca al cuerpo elegido
 * y, cuando se pide, vuela por la línea de visión hasta el recorte (RF-36).
 * Con movimiento reducido, los acercamientos son saltos.
 */
export default function Camara({ modo, encuadre, enfoque, vuelo, movimientoReducido, onVueloTerminado }: Props) {
  const controles = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camara = useThree((estado) => estado.camera)
  const destino = useRef<{ posicion: Vector3; objetivo: Vector3 } | null>(null)
  const enVuelo = useRef<{ desde: number; vuelo: Vuelo } | null>(null)
  const avisado = useRef(false)

  useEffect(() => {
    const c = controles.current
    if (!c) return
    destino.current = null
    // El encuadre está pensado para una pantalla apaisada; en un celular
    // vertical la cámara se aleja para que el campo horizontal alcance.
    const aspecto = 'aspect' in c.object ? c.object.aspect : 1.6
    const alejar = Math.max(1, 1.6 / aspecto)
    const objetivo = new Vector3(...encuadre.objetivo)
    const desde = new Vector3(...encuadre.posicion).sub(objetivo).multiplyScalar(alejar)
    c.object.position.copy(objetivo).add(desde)
    c.target.copy(objetivo)
    c.update()
  }, [encuadre])

  useEffect(() => {
    const c = controles.current
    if (!enfoque || !c) return
    const objetivo = new Vector3(...enfoque.posicion)
    const separacion = new Vector3(0, enfoque.radio * 3 + 1.2, enfoque.radio * 7 + 3)
    destino.current = { posicion: objetivo.clone().add(separacion), objetivo }
    if (movimientoReducido) {
      c.object.position.copy(destino.current.posicion)
      c.target.copy(objetivo)
      c.update()
      destino.current = null
    }
  }, [enfoque, movimientoReducido])

  useEffect(() => {
    const c = controles.current
    if (!vuelo || !c) {
      enVuelo.current = null
      return
    }
    avisado.current = false
    enVuelo.current = {
      desde: performance.now(),
      vuelo: {
        inicio: c.object.position.toArray(),
        objetivoInicial: c.target.toArray(),
        tierra: vuelo.tierra,
        campo: vuelo.campo,
      },
    }
  }, [vuelo])

  useFrame((_, delta) => {
    const c = controles.current
    if (!c) return
    const activo = enVuelo.current
    if (activo) {
      const t = (performance.now() - activo.desde) / DURACION_DEL_VUELO_MS
      const { posicion, mirarA } = cuadroDelVuelo(activo.vuelo, t)
      camara.position.set(...posicion)
      c.target.set(...mirarA)
      camara.lookAt(c.target)
      if (t >= 1 && !avisado.current) {
        avisado.current = true
        enVuelo.current = null
        onVueloTerminado()
      }
      return
    }
    const d = destino.current
    if (d) {
      // Acercamiento exponencial: igual de suave a cualquier tasa de cuadros.
      const k = 1 - Math.exp(-delta * 5)
      camara.position.lerp(d.posicion, k)
      c.target.lerp(d.objetivo, k)
      if (camara.position.distanceTo(d.posicion) < 0.01) destino.current = null
    }
  })

  return (
    <OrbitControls
      ref={controles}
      makeDefault
      enabled={vuelo === null}
      enableDamping={!movimientoReducido}
      minDistance={0.05}
      maxDistance={modo === 'real' ? 3000 : 400}
      onStart={() => {
        destino.current = null
      }}
    />
  )
}
