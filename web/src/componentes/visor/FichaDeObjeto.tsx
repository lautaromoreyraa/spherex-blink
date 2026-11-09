import type { ObjetoConocido } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import { corrimientoTotalPx, origenDeLaPosicion } from '../../util/conocidos.ts'
import { formatearFechaUtc, formatearNumero } from '../../util/textos.ts'

interface Props {
  objeto: ObjetoConocido
  /** Época visible, o null si la vista combina varias. */
  epocaId: string | null
  totalDeEpocas: number
  alCerrar?: () => void
  titulo?: 'h3' | 'h4'
}

/**
 * Ficha de un objeto conocido (RF-14): nombre, tipo, de dónde sale su
 * posición y, si se midió, el S/N. Siempre dice si la posición es de
 * catálogo o de efeméride (RNF-07).
 */
export default function FichaDeObjeto({
  objeto,
  epocaId,
  totalDeEpocas,
  alCerrar,
  titulo = 'h3',
}: Props) {
  const { t, idioma } = useIdioma()
  const Titulo = titulo
  const posicion = epocaId ? objeto.posiciones.find((p) => p.epoca_id === epocaId) : undefined
  const deteccion = epocaId ? objeto.deteccion.find((d) => d.epoca_id === epocaId) : undefined
  const origen = origenDeLaPosicion(objeto)
  const distancia =
    posicion?.distancia_ua ?? objeto.posiciones.find((p) => p.distancia_ua !== null)?.distancia_ua

  return (
    <div className="ficha" aria-live="polite">
      <div className="ficha__cabecera">
        <Titulo className="ficha__titulo">{objeto.nombre}</Titulo>
        {alCerrar ? (
          <button type="button" className="boton boton--secundario" onClick={alCerrar}>
            {t('conocido.cerrar')}
          </button>
        ) : null}
      </div>
      <p className="ficha__origen">
        {t(origen === 'efemeride' ? 'origen.efemeride' : 'origen.catalogo', {
          fuente: objeto.fuente,
        })}
      </p>
      <dl className="ficha__datos">
        <dt>{t('conocido.tipo')}</dt>
        <dd>{t(`tipo.${objeto.tipo}` as const)}</dd>
        <dt>{t('conocido.fuente')}</dt>
        <dd>{objeto.fuente}</dd>
        <dt>{t('conocido.consultado')}</dt>
        <dd>{formatearFechaUtc(objeto.consultado_en, idioma)}</dd>
        {distancia ? (
          <>
            <dt>{t('conocido.distancia')}</dt>
            <dd>{t('conocido.distanciaValor', { n: formatearNumero(distancia, idioma, 2) })}</dd>
          </>
        ) : null}
        {objeto.magnitud ? (
          <>
            <dt>{t('conocido.magnitudTitulo')}</dt>
            <dd>
              {t('conocido.magnitud', {
                valor: formatearNumero(objeto.magnitud.valor, idioma, 2),
                banda: objeto.magnitud.banda,
              })}
            </dd>
          </>
        ) : null}
        {epocaId ? (
          <>
            <dt>{t('conocido.snr')}</dt>
            <dd>
              {deteccion
                ? `${formatearNumero(deteccion.snr, idioma, 1)} · ${t('conocido.desvio', {
                    n: formatearNumero(deteccion.distancia_px, idioma, 2),
                  })}`
                : t('conocido.sinMedicion')}
            </dd>
          </>
        ) : null}
      </dl>
      <p className="nota">
        {t('conocido.medido', { n: objeto.deteccion.length, total: totalDeEpocas })} ·{' '}
        {t('conocido.corrimiento', { n: formatearNumero(corrimientoTotalPx(objeto), idioma, 1) })}
      </p>
    </div>
  )
}
