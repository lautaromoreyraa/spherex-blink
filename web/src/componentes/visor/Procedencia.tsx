import { useId, type Dispatch } from 'react'
import type { Campo } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import type { Accion, EstadoDelVisor } from '../../util/estadoDelVisor.ts'
import { enlaceDeIrsa, nombreDeArchivo, rangoDeLongitudDeOnda } from '../../util/procedencia.ts'
import { formatearFechaUtc, formatearNumero } from '../../util/textos.ts'

interface Props {
  campo: Campo
  estado: EstadoDelVisor
  despachar: Dispatch<Accion>
}

/**
 * De dónde sale cada imagen (RF-15): la ficha de la época visible y la tabla
 * de todas, donde además se elige qué épocas entran en el parpadeo (RF-11).
 */
export default function Procedencia({ campo, estado, despachar }: Props) {
  const { t, idioma } = useIdioma()
  const idTitulo = useId()
  const idTabla = useId()
  const epoca = campo.epocas[estado.indice]!
  const rango = rangoDeLongitudDeOnda(campo.epocas)
  const enlace = enlaceDeIrsa(epoca.fuente.uri)
  const pila = estado.vista === 'apilado' || estado.vista === 'rastro'

  return (
    <section className="procedencia" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="seccion__titulo">
        {t('procedencia.titulo')}
      </h2>

      {rango?.difiere ? (
        <p className="aviso" role="note">
          {t('procedencia.lambdaAviso', {
            min: formatearNumero(rango.minimo, idioma, 3),
            max: formatearNumero(rango.maximo, idioma, 3),
          })}
        </p>
      ) : null}

      <div className="tarjeta">
        <h3 className="tarjeta__titulo">{t('procedencia.visible')}</h3>
        {pila ? <p className="nota">{t('procedencia.pila')}</p> : null}
        <dl className="datos">
          <dt>{t('procedencia.fecha')}</dt>
          <dd data-prueba="procedencia-fecha">{formatearFechaUtc(epoca.fecha_utc, idioma)}</dd>
          <dt>{t('procedencia.mjd')}</dt>
          <dd className="mono">{epoca.mjd.toFixed(5)}</dd>
          <dt>{t('procedencia.pasada')}</dt>
          <dd>{epoca.pasada}</dd>
          <dt>{t('procedencia.detector')}</dt>
          <dd>{campo.detector}</dd>
          <dt>{t('procedencia.lambda')}</dt>
          <dd>{formatearNumero(epoca.longitud_onda_um, idioma, 3)} µm</dd>
          <dt>{t('procedencia.mala')}</dt>
          <dd>{formatearNumero(epoca.fraccion_mala * 100, idioma, 2)} %</dd>
          <dt>{t('procedencia.archivo')}</dt>
          <dd className="datos__archivo">
            {enlace ? (
              <a href={enlace} rel="noopener noreferrer" className="mono">
                {nombreDeArchivo(epoca.fuente.uri)}
              </a>
            ) : (
              <span>{t('procedencia.archivoInvalido')}</span>
            )}
          </dd>
          <dt>{t('procedencia.plano')}</dt>
          <dd className="mono">{epoca.fuente.planeid}</dd>
          <dt>{t('procedencia.version')}</dt>
          <dd className="mono">{epoca.fuente.version_proceso}</dd>
        </dl>
      </div>

      <h3 id={idTabla} className="tarjeta__titulo">
        {t('procedencia.tabla')}
      </h3>
      <div className="tabla-desplazable" role="region" aria-labelledby={idTabla} tabIndex={0}>
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">{t('procedencia.incluir')}</th>
              <th scope="col">{t('procedencia.fecha')}</th>
              <th scope="col">{t('procedencia.pasada')}</th>
              <th scope="col">{t('procedencia.lambda')}</th>
              <th scope="col">{t('procedencia.mala')}</th>
            </tr>
          </thead>
          <tbody>
            {campo.epocas.map((e, i) => {
              const fecha = formatearFechaUtc(e.fecha_utc, idioma)
              return (
                <tr key={e.id} className={i === estado.indice ? 'tabla__fila--actual' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${t('procedencia.incluir')}: ${fecha}`}
                      checked={estado.elegidas.includes(i)}
                      onChange={(ev) =>
                        despachar({ tipo: 'elegir', indices: [i], incluir: ev.target.checked })
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="enlace-boton"
                      aria-current={i === estado.indice ? 'true' : undefined}
                      onClick={() => despachar({ tipo: 'ir', indice: i })}
                    >
                      {fecha}
                    </button>
                  </td>
                  <td>{e.pasada}</td>
                  <td>{formatearNumero(e.longitud_onda_um, idioma, 3)} µm</td>
                  <td>{formatearNumero(e.fraccion_mala * 100, idioma, 2)} %</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="nota">
        {t('procedencia.pipeline', {
          version: campo.procedencia.version_pipeline,
          fecha: formatearFechaUtc(campo.procedencia.irsa_consultado_en, idioma),
        })}
      </p>
    </section>
  )
}
