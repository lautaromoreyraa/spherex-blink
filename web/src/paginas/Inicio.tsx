import { useEffect } from 'react'
import Enlace from '../componentes/Enlace.tsx'
import EstadoDeCarga from '../componentes/EstadoDeCarga.tsx'
import { useIndice } from '../hooks/useDatos.ts'
import { useIdioma } from '../hooks/useIdioma.ts'
import '../estilos/inicio.css'
import { direccion, rutaDeDatos } from '../util/rutas.ts'

/**
 * Inicio: qué es esto y los campos de la demo para abrir (RF-10). Cada campo
 * es un enlace entero: se abre con clic, con toque o con Tab + Enter.
 */
export default function Inicio() {
  const { t, idioma } = useIdioma()
  const { carga, reintentar } = useIndice()

  useEffect(() => {
    document.title = 'spherex-blink'
  }, [])

  return (
    <div className="inicio">
      <header className="inicio__cabecera">
        <h1 className="inicio__titulo">spherex-blink</h1>
        <p className="inicio__bajada">{t('inicio.bajada')}</p>
        <p className="inicio__explicacion">{t('inicio.explicacion')}</p>
        <p className="inicio__nota">{t('inicio.sinRed')}</p>
      </header>

      <section className="inicio__campos" aria-labelledby="titulo-campos">
        <h2 id="titulo-campos" className="seccion__titulo">
          {t('inicio.camposTitulo')}
        </h2>
        {carga.estado === 'cargando' ? <EstadoDeCarga estado="cargando" /> : null}
        {carga.estado === 'error' ? (
          <EstadoDeCarga estado="error" mensaje={carga.mensaje} alReintentar={reintentar} />
        ) : null}
        {carga.estado === 'listo' ? (
          carga.datos.campos.length === 0 ? (
            <p>{t('inicio.sinCampos')}</p>
          ) : (
            <ul className="tarjetas">
              {carga.datos.campos.map((campo) => (
                <li key={campo.id} className="tarjeta-de-campo">
                  <Enlace
                    href={direccion({ pagina: 'campo', id: campo.id })}
                    className="tarjeta-de-campo__enlace"
                  >
                    <img
                      className="tarjeta-de-campo__miniatura"
                      src={rutaDeDatos(campo.miniatura)}
                      alt={t('inicio.miniaturaAlt', { nombre: campo.nombre[idioma] })}
                      width={160}
                      height={160}
                    />
                    <span className="tarjeta-de-campo__texto">
                      <span className="tarjeta-de-campo__nombre">{campo.nombre[idioma]}</span>
                      <span className="tarjeta-de-campo__dato">
                        {t('inicio.epocas', { n: campo.cantidad_epocas })} ·{' '}
                        {t('inicio.detector', { d: campo.detector })}
                      </span>
                      {campo.objeto_destacado ? (
                        <span className="tarjeta-de-campo__dato">
                          {t('inicio.queMirar', {
                            // objeto_destacado viene sólo en español en el contrato; si es
                            // el mismo nombre del campo, se usa su traducción.
                            objeto:
                              campo.objeto_destacado === campo.nombre.es
                                ? campo.nombre[idioma]
                                : campo.objeto_destacado,
                          })}
                        </span>
                      ) : null}
                    </span>
                  </Enlace>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      <p className="inicio__limites">
        <Enlace href={direccion({ pagina: 'limites' })}>{t('inicio.limites')}</Enlace>
      </p>
    </div>
  )
}
