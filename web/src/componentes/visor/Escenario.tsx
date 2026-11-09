import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useTamano } from '../../hooks/useTamano.ts'
import {
  acercar,
  desplazar,
  lienzoAImagen,
  vistaInicial,
  type Tamano,
  type Vista,
} from '../../util/vista.ts'
import type { Cuadro, Pintor, TipoDePintor } from './pintor.ts'
import { crearPintor2d } from './pintor2d.ts'
import { crearPintorWebgl } from './pintorWebgl.ts'

interface Props {
  cuadro: Omit<Cuadro, 'vista'> | null
  imagen: Tamano
  vista: Vista
  alCambiarVista: (vista: Vista) => void
  /** Texto alternativo de la imagen: campo, época y vista (RNF-03). */
  etiqueta: string
  /** Nombre del grupo que se enfoca para usar el teclado. */
  nombre: string
  descripcionId?: string
  alPuntero?: (pixel: { x: number; y: number } | null) => void
  alPintor?: (tipo: TipoDePintor) => void
  /** Teclas propias del visor (cambiar de época); devuelve true si la usó. */
  alTecla?: (evento: KeyboardEvent<HTMLDivElement>) => boolean
  superposicion?: (lienzo: Tamano) => ReactNode
  claseExtra?: string
  /** Toma el foco al aparecer: el visor viene del vuelo de la escena (RF-36). */
  enfocarAlMontar?: boolean
}

const FACTOR_DE_TECLA = 1.5
const PASO_DE_DESPLAZAMIENTO = 0.1

/**
 * El lienzo del visor con su zoom y desplazamiento (RF-16): rueda (con el
 * visor enfocado o con Ctrl, para no robarle el scroll a la página),
 * arrastre, pellizco y teclado. Elige WebGL y, si no hay, canvas 2D (RF-37).
 */
export default function Escenario({
  cuadro,
  imagen,
  vista,
  alCambiarVista,
  etiqueta,
  nombre,
  descripcionId,
  alPuntero,
  alPintor,
  alTecla,
  superposicion,
  claseExtra,
  enfocarAlMontar = false,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (enfocarAlMontar) contenedor.current?.focus({ preventScroll: true })
    // Sólo al montarse: si después se vuelve a pintar, el foco no se mueve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const lienzo = useRef<HTMLCanvasElement>(null)
  const pintor = useRef<Pintor | null>(null)
  const tamano = useTamano(contenedor)
  const punteros = useRef(new Map<number, { x: number; y: number }>())
  const [arrastrando, setArrastrando] = useState(false)
  const ultimaVista = useRef(vista)
  useLayoutEffect(() => {
    ultimaVista.current = vista
  })

  useEffect(() => {
    const elemento = lienzo.current
    if (!elemento) return
    // El pintor se elige una vez por lienzo: WebGL 2 si el navegador lo da.
    const elegido = crearPintorWebgl(elemento) ?? crearPintor2d(elemento)
    pintor.current = elegido
    if (elegido) alPintor?.(elegido.tipo)
    return () => {
      elegido?.destruir()
      pintor.current = null
    }
    // alPintor sólo avisa; no tiene que volver a crear el pintor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!cuadro || !pintor.current || tamano.ancho === 0 || tamano.alto === 0) return
    const cuadroCompleto: Cuadro = { ...cuadro, vista }
    const id = requestAnimationFrame(() => {
      pintor.current?.dibujar(cuadroCompleto, tamano, window.devicePixelRatio || 1)
    })
    return () => cancelAnimationFrame(id)
  }, [cuadro, vista, tamano])

  // La rueda va con un listener propio porque React registra `wheel` como
  // pasivo y no deja frenar el scroll de la página.
  useEffect(() => {
    const elemento = contenedor.current
    if (!elemento) return
    const alGirar = (evento: WheelEvent) => {
      const enfocado = elemento.contains(document.activeElement)
      if (!enfocado && !evento.ctrlKey && !evento.metaKey) return
      evento.preventDefault()
      const caja = elemento.getBoundingClientRect()
      const factor = Math.exp(-evento.deltaY * (evento.deltaMode === 1 ? 0.05 : 0.0015))
      alCambiarVista(
        acercar(ultimaVista.current, factor, tamano, imagen, {
          x: evento.clientX - caja.left,
          y: evento.clientY - caja.top,
        }),
      )
    }
    elemento.addEventListener('wheel', alGirar, { passive: false })
    return () => elemento.removeEventListener('wheel', alGirar)
  }, [alCambiarVista, tamano, imagen])

  function local(evento: PointerEvent<HTMLDivElement>) {
    const caja = evento.currentTarget.getBoundingClientRect()
    return { x: evento.clientX - caja.left, y: evento.clientY - caja.top }
  }

  function alApoyar(evento: PointerEvent<HTMLDivElement>) {
    // Los marcadores son botones: el toque es para ellos, no para arrastrar.
    if ((evento.target as HTMLElement).closest('button')) return
    evento.currentTarget.setPointerCapture(evento.pointerId)
    punteros.current.set(evento.pointerId, local(evento))
    setArrastrando(true)
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    const punto = local(evento)
    alPuntero?.(lienzoAImagen(vista, tamano, imagen, punto.x, punto.y))
    const previo = punteros.current.get(evento.pointerId)
    if (!previo) return
    const otros = [...punteros.current.entries()].filter(([id]) => id !== evento.pointerId)
    if (otros.length === 0) {
      alCambiarVista(desplazar(vista, punto.x - previo.x, punto.y - previo.y, tamano, imagen))
    } else {
      // Pellizco: el zoom sigue a la distancia entre los dos dedos.
      const otro = otros[0]![1]
      const antes = Math.hypot(previo.x - otro.x, previo.y - otro.y)
      const ahora = Math.hypot(punto.x - otro.x, punto.y - otro.y)
      if (antes > 0) {
        alCambiarVista(
          acercar(vista, ahora / antes, tamano, imagen, {
            x: (punto.x + otro.x) / 2,
            y: (punto.y + otro.y) / 2,
          }),
        )
      }
    }
    punteros.current.set(evento.pointerId, punto)
  }

  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    punteros.current.delete(evento.pointerId)
    if (punteros.current.size === 0) setArrastrando(false)
  }

  function alPresionar(evento: KeyboardEvent<HTMLDivElement>) {
    if (alTecla?.(evento)) return
    const paso = (Math.max(tamano.ancho, tamano.alto) || 1) * PASO_DE_DESPLAZAMIENTO
    let nueva: Vista | null = null
    if (evento.key === '+' || evento.key === '=')
      nueva = acercar(vista, FACTOR_DE_TECLA, tamano, imagen)
    else if (evento.key === '-' || evento.key === '_')
      nueva = acercar(vista, 1 / FACTOR_DE_TECLA, tamano, imagen)
    else if (evento.key === '0') nueva = vistaInicial(imagen)
    else if (evento.shiftKey && evento.key.startsWith('Arrow')) {
      const dx = evento.key === 'ArrowLeft' ? paso : evento.key === 'ArrowRight' ? -paso : 0
      const dy = evento.key === 'ArrowUp' ? paso : evento.key === 'ArrowDown' ? -paso : 0
      nueva = desplazar(vista, dx, dy, tamano, imagen)
    }
    if (nueva) {
      evento.preventDefault()
      alCambiarVista(nueva)
    }
  }

  const ampliado = vista.zoom > 1.001
  return (
    <div
      ref={contenedor}
      className={`escenario${ampliado ? ' escenario--ampliado' : ''}${arrastrando ? ' escenario--arrastrando' : ''}${claseExtra ? ` ${claseExtra}` : ''}`}
      tabIndex={0}
      role="group"
      aria-label={nombre}
      aria-describedby={descripcionId}
      onPointerDown={alApoyar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onPointerLeave={() => alPuntero?.(null)}
      onKeyDown={alPresionar}
    >
      <canvas ref={lienzo} className="escenario__lienzo" role="img" aria-label={etiqueta} />
      {superposicion && tamano.ancho > 0 ? (
        <div className="escenario__superposicion">{superposicion(tamano)}</div>
      ) : null}
    </div>
  )
}
