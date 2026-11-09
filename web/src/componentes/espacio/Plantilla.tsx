import { Fragment, type ReactNode } from 'react'

/**
 * Un texto traducido con variables que son nodos (una fecha en `<time>`, un
 * ángulo resaltado): `traducir` sólo arma cadenas, y partir la frase en
 * pedazos por idioma rompería el orden de las palabras en inglés (RNF-06).
 */
export default function Plantilla({
  texto,
  valores,
}: {
  texto: string
  valores: Record<string, ReactNode>
}) {
  const partes = texto.split(/(\{\w+\})/g)
  return (
    <>
      {partes.map((parte, i) => {
        const nombre = /^\{(\w+)\}$/.exec(parte)?.[1]
        return (
          <Fragment key={i}>{nombre !== undefined && nombre in valores ? valores[nombre] : parte}</Fragment>
        )
      })}
    </>
  )
}
