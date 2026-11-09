import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { useNavegacion } from '../hooks/useRuta.ts'

/**
 * Enlace interno: un `<a>` de verdad (se abre en otra pestaña, se copia, lo
 * lee el lector de pantalla) que navega sin recargar con el clic común.
 */
export default function Enlace({
  href,
  onClick,
  ...resto
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navegar } = useNavegacion()

  function alHacerClic(evento: MouseEvent<HTMLAnchorElement>) {
    onClick?.(evento)
    if (
      evento.defaultPrevented ||
      evento.button !== 0 ||
      evento.metaKey ||
      evento.ctrlKey ||
      evento.shiftKey ||
      evento.altKey
    ) {
      return
    }
    evento.preventDefault()
    navegar(href)
  }

  return <a href={href} onClick={alHacerClic} {...resto} />
}
