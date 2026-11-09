import { useEffect, useId, useState, type ReactNode } from 'react'
import type { Campo as DatosDelCampo } from '../api/tipos.ts'
import EstadoDeCarga from '../componentes/EstadoDeCarga.tsx'
import Enlace from '../componentes/Enlace.tsx'
import Comparador from '../componentes/visor/Comparador.tsx'
import ObjetosConocidos from '../componentes/visor/ObjetosConocidos.tsx'
import Procedencia from '../componentes/visor/Procedencia.tsx'
import Visor from '../componentes/visor/Visor.tsx'
import { useCampo, useImagenesDelCampo } from '../hooks/useDatos.ts'
import { useEstadoDelVisor } from '../hooks/useEstadoDelVisor.ts'
import { useIdioma } from '../hooks/useIdioma.ts'
import '../estilos/campo.css'
import type { Pixeles } from '../util/pintura.ts'
import { direccion, llegadaDesdeLaEscena } from '../util/rutas.ts'
import { formatearNumero } from '../util/textos.ts'
import { formatearDec, formatearRa } from '../util/wcs.ts'

/**
 * La página de un campo: todo se recorre bajando, sin pestañas (preferencia
 * de UI del proyecto). Primero el visor, enseguida los avisos (RNF-07) y
 * después la comparación, la procedencia y los objetos conocidos.
 */
export default function Campo({ id }: { id: string }) {
  const { carga, reintentar } = useCampo(id)
  const { t, idioma } = useIdioma()
  const campo = carga.estado === 'listo' ? carga.datos : null
  const imagenes = useImagenesDelCampo(campo)

  useEffect(() => {
    document.title = campo ? `${campo.nombre[idioma]} · spherex-blink` : 'spherex-blink'
  }, [campo, idioma])

  if (carga.estado === 'cargando') return <EstadoDeCarga estado="cargando" />
  if (carga.estado === 'error') {
    return <EstadoDeCarga estado="error" mensaje={carga.mensaje} alReintentar={reintentar} />
  }
  const datos = carga.datos

  const cabecera = (
    <header className="campo__cabecera">
      <Enlace href={direccion({ pagina: 'inicio' })} className="campo__volver">
        <span aria-hidden="true">← </span>
        {t('campo.volver')}
      </Enlace>
      <h1 className="campo__titulo">{datos.nombre[idioma]}</h1>
      <p className="campo__descripcion">{datos.descripcion[idioma]}</p>
      <dl className="campo__hechos" aria-label={t('campo.ficha')}>
        <div>
          <dt>{t('campo.centro')}</dt>
          <dd className="mono">
            {formatearRa(datos.centro.ra, idioma === 'es' ? ',' : '.')}{' '}
            {formatearDec(datos.centro.dec)}
          </dd>
        </div>
        <div>
          <dt>{t('campo.lado')}</dt>
          <dd>
            {t('campo.ladoValor', {
              n: formatearNumero(datos.tamano_grados, idioma, 2),
              px: datos.rejilla.ancho_px,
              escala: formatearNumero(datos.rejilla.escala_arcsec_px, idioma, 2),
            })}
          </dd>
        </div>
        <div>
          <dt>{t('campo.detector')}</dt>
          <dd>{datos.detector}</dd>
        </div>
        <div>
          <dt>{t('campo.epocas')}</dt>
          <dd>{datos.epocas.length}</dd>
        </div>
      </dl>
      <p className="campo__enlaces">
        {datos.avisos.length > 0 ? (
          <a href="#avisos-del-campo" className="campo__avisos">
            {t('campo.cantidadDeAvisos', { n: datos.avisos.length })}
          </a>
        ) : null}
        <Enlace href={direccion({ pagina: 'limites' })}>{t('campo.limites')}</Enlace>
      </p>
    </header>
  )

  // Con las imágenes listas, la cabecera va al lado del visor en pantallas
  // anchas: así la imagen entra entera en el proyector sin bajar.
  return (
    <article className="campo">
      {imagenes.carga.estado !== 'listo' ? cabecera : null}
      {imagenes.carga.estado === 'cargando' ? (
        <EstadoDeCarga
          estado="cargando"
          texto={t('cargando.imagenes', { n: imagenes.listas, total: imagenes.total })}
        />
      ) : imagenes.carga.estado === 'error' ? (
        <EstadoDeCarga
          estado="error"
          mensaje={imagenes.carga.mensaje}
          alReintentar={imagenes.reintentar}
        />
      ) : (
        <CampoListo
          key={datos.id}
          campo={datos}
          pixeles={imagenes.carga.datos}
          cabecera={cabecera}
        />
      )}
    </article>
  )
}

function CampoListo({
  campo,
  pixeles,
  cabecera,
}: {
  campo: DatosDelCampo
  pixeles: Map<string, Pixeles>
  cabecera: ReactNode
}) {
  // Si se llega con el vuelo de la escena, el visor abre quieto en la época
  // que trae el vuelo y el lienzo toma el foco (RF-36).
  const [llegada] = useState(() => llegadaDesdeLaEscena(window.history.state))
  const { estado, despachar } = useEstadoDelVisor(
    campo,
    llegada ? { epocaId: llegada.epoca, enPausa: true } : null,
  )
  const { t, idioma } = useIdioma()
  const idAvisos = useId()
  const idCreditos = useId()
  const pila = estado.vista === 'apilado' || estado.vista === 'rastro'

  return (
    <>
      <Visor
        campo={campo}
        pixeles={pixeles}
        estado={estado}
        despachar={despachar}
        cabecera={cabecera}
        enfocarAlMontar={llegada !== null}
      />

      {campo.avisos.length > 0 ? (
        <section id="avisos-del-campo" className="avisos" aria-labelledby={idAvisos}>
          <h2 id={idAvisos} className="seccion__titulo">
            {t('avisos.titulo')}
          </h2>
          <ul className="avisos__lista">
            {campo.avisos.map((aviso) => (
              <li key={aviso.es} className="aviso">
                {aviso[idioma]}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Comparador campo={campo} pixeles={pixeles} mapa={estado.mapa} rango={estado.rango} />
      <Procedencia campo={campo} estado={estado} despachar={despachar} />
      <ObjetosConocidos campo={campo} epocaId={pila ? null : campo.epocas[estado.indice]!.id} />

      <section className="creditos" aria-labelledby={idCreditos}>
        <h2 id={idCreditos} className="seccion__titulo">
          {t('creditos.titulo')}
        </h2>
        <p lang="es">{campo.creditos}</p>
      </section>
    </>
  )
}
