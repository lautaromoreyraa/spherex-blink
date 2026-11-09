import type { Campo } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import { marcadoresDeLaEpoca, origenDeLaPosicion, recorrido } from '../../util/conocidos.ts'
import { escala, imagenALienzo, type Tamano, type Vista } from '../../util/vista.ts'

interface Props {
  campo: Campo
  /** Época visible; null en el apilado y el rastro, que combinan varias. */
  epocaId: string | null
  idsElegidos: readonly string[]
  vista: Vista
  lienzo: Tamano
  control: boolean
  seleccionado: number | null
  alSeleccionar: (indice: number | null) => void
}

/** Radio del círculo en píxeles de la imagen: 2 px de 6,15″ rodean la PSF sin taparla. */
const RADIO_EN_PIXELES = 2.2

/**
 * Marcadores de los objetos conocidos sobre el lienzo (RF-14): un círculo
 * donde tenía que estar cada uno en la época visible, una cruz donde lo midió
 * la herramienta y una línea con su recorrido. Los círculos son botones: se
 * enfocan con Tab y muestran la ficha del objeto.
 */
export default function CapaDeMarcadores({
  campo,
  epocaId,
  idsElegidos,
  vista,
  lienzo,
  control,
  seleccionado,
  alSeleccionar,
}: Props) {
  const { t } = useIdioma()
  const imagen = { ancho: campo.rejilla.ancho_px, alto: campo.rejilla.alto_px }
  const e = escala(vista, lienzo, imagen)
  const radio = Math.max(12, RADIO_EN_PIXELES * e)
  const aLienzo = (x: number, y: number) => imagenALienzo(vista, lienzo, imagen, x, y)

  // Sin época visible (apilado, rastro) se marcan todas las posiciones de las elegidas.
  const ids = epocaId ? [epocaId] : idsElegidos
  const marcadores = ids.flatMap((id) =>
    marcadoresDeLaEpoca(campo, id, { control }).map((m) => ({ ...m, epocaId: id })),
  )
  const trazos = campo.conocidos
    .map((objeto, indice) => ({ objeto, indice, puntos: recorrido(objeto, idsElegidos) }))
    .filter(({ objeto, puntos }) => puntos.length > 0 && (control || objeto.fuente !== 'Gaia DR3'))

  return (
    <>
      <svg
        className="marcadores__trazos"
        width={lienzo.ancho}
        height={lienzo.alto}
        aria-hidden="true"
        focusable="false"
      >
        {trazos.map(({ indice, puntos }) => (
          <polyline
            key={indice}
            className="marcadores__trazo"
            points={puntos
              .map((p) => {
                const q = aLienzo(p.x, p.y)
                return `${q.x},${q.y}`
              })
              .join(' ')}
          />
        ))}
        {marcadores.map((m) => {
          if (!m.deteccion) return null
          const q = aLienzo(m.deteccion.x, m.deteccion.y)
          const brazo = Math.max(5, radio * 0.45)
          return (
            <path
              key={`medida-${m.indice}-${m.epocaId}`}
              className="marcadores__medida"
              d={`M${q.x - brazo},${q.y}H${q.x + brazo}M${q.x},${q.y - brazo}V${q.y + brazo}`}
            />
          )
        })}
      </svg>
      {marcadores.map((m) => {
        const q = aLienzo(m.posicion.x, m.posicion.y)
        if (
          q.x < -radio ||
          q.y < -radio ||
          q.x > lienzo.ancho + radio ||
          q.y > lienzo.alto + radio
        ) {
          return null
        }
        const origen = origenDeLaPosicion(m.objeto)
        const etiqueta = t('marcador.etiqueta', {
          nombre: m.objeto.nombre,
          origen: t(origen === 'efemeride' ? 'origen.efemeride' : 'origen.catalogo', {
            fuente: m.objeto.fuente,
          }),
        })
        const activo = seleccionado === m.indice
        return (
          <button
            // Con una sola época la clave no cambia al parpadear: el botón
            // enfocado sigue enfocado mientras su objeto se corre.
            key={epocaId ? String(m.indice) : `${m.indice}-${m.epocaId}`}
            type="button"
            className={`marcador${m.control ? ' marcador--control' : ''}${activo ? ' marcador--activo' : ''}`}
            style={{ left: q.x - radio, top: q.y - radio, width: radio * 2, height: radio * 2 }}
            aria-label={etiqueta}
            aria-pressed={activo}
            onClick={() => alSeleccionar(activo ? null : m.indice)}
            onFocus={() => alSeleccionar(m.indice)}
          >
            {!m.control && epocaId ? (
              <span className="marcador__nombre">{m.objeto.nombre}</span>
            ) : null}
          </button>
        )
      })}
    </>
  )
}
