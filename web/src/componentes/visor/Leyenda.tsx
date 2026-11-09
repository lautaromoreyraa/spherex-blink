import { useIdioma } from '../../hooks/useIdioma.ts'
import { marcasDeEscala, marcasDivergentes, type RangoVisible } from '../../util/estiramiento.ts'
import { colorCss, type MapaDeColor, type MapaDivergente } from '../../util/mapasDeColor.ts'
import { COLOR_SIN_DATO } from '../../util/pintura.ts'
import { formatearMarca } from '../../util/textos.ts'

type Props =
  | { tipo: 'secuencial'; mapa: MapaDeColor; rango: RangoVisible; a: number | null }
  | { tipo: 'divergente'; limite: number; explicacion: 'diferencia' | 'resta' }

const PARADAS = 24

function degradado(mapa: MapaDeColor | MapaDivergente): string {
  const paradas = Array.from({ length: PARADAS + 1 }, (_, i) => {
    const t = i / PARADAS
    return `${colorCss(mapa, t)} ${(t * 100).toFixed(1)}%`
  })
  return `linear-gradient(to right, ${paradas.join(', ')})`
}

/**
 * Barra de color con su escala en MJy/sr (RF-37) y qué significan los colores
 * (RF-12). Las marcas se ubican con el mismo estiramiento que el shader.
 */
export default function Leyenda(props: Props) {
  const { t, idioma } = useIdioma()
  const divergente = props.tipo === 'divergente'
  const marcas = divergente
    ? marcasDivergentes(props.limite)
    : marcasDeEscala(props.rango, props.a, 4)
  const mapa = divergente ? 'berlin' : props.mapa
  const texto = divergente
    ? t(props.explicacion === 'resta' ? 'leyenda.resta' : 'leyenda.diferencia')
    : t('leyenda.imagen')

  return (
    <figure className="leyenda">
      <figcaption className="leyenda__titulo">
        {t('leyenda.titulo')} <span className="leyenda__unidad">({t('leyenda.unidad')})</span>
      </figcaption>
      <div
        className="leyenda__barra"
        style={{ backgroundImage: degradado(mapa) }}
        aria-hidden="true"
      />
      <ul className="leyenda__marcas">
        {marcas.map((m) => (
          <li
            key={m.valor}
            // En los bordes el número se alinea hacia adentro para no salirse
            // de la barra (y no abrir desplazamiento horizontal en el celular).
            className={`leyenda__marca${m.posicion < 0.06 ? ' leyenda__marca--inicio' : m.posicion > 0.94 ? ' leyenda__marca--fin' : ''}`}
            style={{ left: `${m.posicion * 100}%` }}
          >
            {formatearMarca(m.valor, idioma)}
          </li>
        ))}
      </ul>
      <p className="leyenda__texto">{texto}</p>
      <p className="leyenda__sin-dato">
        <span
          className="leyenda__muestra"
          style={{ backgroundColor: `rgb(${COLOR_SIN_DATO.join(',')})` }}
          aria-hidden="true"
        />
        {t('leyenda.sinDato')}
      </p>
    </figure>
  )
}
