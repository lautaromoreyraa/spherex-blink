import { useId } from 'react'
import type { Campo } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import { esDeControl } from '../../util/conocidos.ts'
import { formatearNumero } from '../../util/textos.ts'
import FichaDeObjeto from './FichaDeObjeto.tsx'

interface Props {
  campo: Campo
  /** Época visible, para el S/N de cada ficha; null si la vista combina varias. */
  epocaId: string | null
}

/**
 * Todos los objetos conocidos del campo (RF-14), a la vista sin tener que
 * tocar un marcador: los destacados con su ficha completa y las estrellas de
 * control de Gaia en una tabla.
 */
export default function ObjetosConocidos({ campo, epocaId }: Props) {
  const { t, idioma } = useIdioma()
  const idTitulo = useId()
  const idControl = useId()
  const destacados = campo.conocidos.filter((o) => !esDeControl(o))
  const control = campo.conocidos.filter(esDeControl)
  const total = campo.epocas.length

  return (
    <section className="conocidos" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="seccion__titulo">
        {t('conocidos.titulo')}
      </h2>
      <p className="seccion__intro">{t('conocidos.intro')}</p>
      <div className="conocidos__fichas">
        {destacados.map((objeto) => (
          <FichaDeObjeto
            key={objeto.nombre}
            objeto={objeto}
            epocaId={epocaId}
            totalDeEpocas={total}
          />
        ))}
      </div>

      {control.length > 0 ? (
        <>
          <h3 id={idControl} className="tarjeta__titulo">
            {t('conocidos.control')}
          </h3>
          <p className="nota">{t('conocidos.controlIntro')}</p>
          <div className="tabla-desplazable" role="region" aria-labelledby={idControl} tabIndex={0}>
            <table className="tabla">
              <thead>
                <tr>
                  <th scope="col">Gaia DR3</th>
                  <th scope="col">{t('conocido.magnitudTitulo')}</th>
                  <th scope="col">{t('conocido.mediciones')}</th>
                </tr>
              </thead>
              <tbody>
                {control.map((o) => {
                  const snr = o.deteccion.map((d) => d.snr)
                  return (
                    <tr key={o.nombre}>
                      <td className="mono">{o.nombre.replace('Gaia DR3 ', '')}</td>
                      <td>
                        {o.magnitud
                          ? `${formatearNumero(o.magnitud.valor, idioma, 2)} ${o.magnitud.banda}`
                          : '—'}
                      </td>
                      <td>
                        {o.deteccion.length} / {total}
                        {snr.length > 0
                          ? ` · S/N ${formatearNumero(Math.min(...snr), idioma, 0)}–${formatearNumero(Math.max(...snr), idioma, 0)}`
                          : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  )
}
