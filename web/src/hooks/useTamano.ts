import { useLayoutEffect, useState, type RefObject } from 'react'
import type { Tamano } from '../util/vista.ts'

/** Tamaño en píxeles CSS de un elemento, al día con ResizeObserver. */
export function useTamano(ref: RefObject<HTMLElement | null>): Tamano {
  const [tamano, setTamano] = useState<Tamano>({ ancho: 0, alto: 0 })

  useLayoutEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    const medir = () => {
      const caja = elemento.getBoundingClientRect()
      setTamano((previo) =>
        previo.ancho === caja.width && previo.alto === caja.height
          ? previo
          : { ancho: caja.width, alto: caja.height },
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [ref])

  return tamano
}
