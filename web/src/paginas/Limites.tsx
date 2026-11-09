import { useEffect, useState } from 'react'
import { cargarCampo } from '../api/campos.ts'
import type { Campo } from '../api/tipos.ts'
import EstadoDeCarga from '../componentes/EstadoDeCarga.tsx'
import { useIndice } from '../hooks/useDatos.ts'
import { useIdioma } from '../hooks/useIdioma.ts'
import '../estilos/limites.css'
import { corrimientoTotalPx, esDeControl, origenDeLaPosicion } from '../util/conocidos.ts'
import { TEXTOS_DE_LIMITES } from '../util/textosDeLimites.ts'
import { formatearNumero, traducir, type Idioma } from '../util/textos.ts'

const HORAS_POR_DIA = 24

function completar(plantilla: string, valores: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (entero, nombre: string) =>
    nombre in valores ? String(valores[nombre]) : entero,
  )
}

/** Lo que midió la herramienta en un campo, en una frase por objeto destacado. */
function medicionesDelCampo(campo: Campo, idioma: Idioma): string[] {
  const textos = TEXTOS_DE_LIMITES[idioma]
  const escala = campo.rejilla.escala_arcsec_px
  const fechas = new Map(campo.epocas.map((e) => [e.id, e.mjd]))
  return campo.conocidos
    .filter((o) => !esDeControl(o))
    .map((objeto) => {
      const dentro = objeto.posiciones.filter((p) => p.dentro_del_campo)
      const mjds = dentro.map((p) => fechas.get(p.epoca_id) ?? 0)
      const lapso = mjds.length > 1 ? Math.max(...mjds) - Math.min(...mjds) : 0
      const px = corrimientoTotalPx(objeto)
      const comunes = {
        nombre: objeto.nombre,
        campo: campo.nombre[idioma],
        fuente: objeto.fuente,
        px: formatearNumero(px, idioma, 1),
        arcsec: formatearNumero(px * escala, idioma, 1),
      }
      if (origenDeLaPosicion(objeto) === 'efemeride' && objeto.deteccion.length > 0) {
        const snr = objeto.deteccion.map((d) => d.snr)
        return completar(textos.medidoCuerpo, {
          ...comunes,
          horas: formatearNumero(lapso * HORAS_POR_DIA, idioma, 0),
          medidas: objeto.deteccion.length,
          epocas: campo.epocas.length,
          snrMin: formatearNumero(Math.min(...snr), idioma, 1),
          snrMax: formatearNumero(Math.max(...snr), idioma, 1),
        })
      }
      return completar(textos.medidoEstrella, {
        ...comunes,
        dias: formatearNumero(lapso, idioma, 0),
      })
    })
}

/**
 * «Qué puede y qué no» (RF-26): cómo se hicieron las imágenes y cuánto
 * creerles, con la fuente de cada cifra y lo medido sobre los campos reales,
 * incluidos sus avisos (RNF-07).
 */
export default function Limites() {
  const { idioma } = useIdioma()
  const textos = TEXTOS_DE_LIMITES[idioma]
  const { carga, reintentar } = useIndice()
  const [campos, setCampos] = useState<Campo[] | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    document.title = `${textos.titulo} · spherex-blink`
  }, [textos.titulo])

  useEffect(() => {
    if (carga.estado !== 'listo') return
    const control = new AbortController()
    Promise.all(carga.datos.campos.map((c) => cargarCampo(c.id, control.signal))).then(
      setCampos,
      () => {
        if (!control.signal.aborted) setFallo(true)
      },
    )
    return () => control.abort()
  }, [carga])

  return (
    <article className="limites">
      <header className="limites__cabecera">
        <h1 className="limites__titulo">{textos.titulo}</h1>
        <p className="limites__bajada">{textos.bajada}</p>
      </header>

      {textos.secciones.map((seccion) => (
        <section
          key={seccion.id}
          className="limites__seccion"
          aria-labelledby={`limites-${seccion.id}`}
        >
          <h2 id={`limites-${seccion.id}`} className="seccion__titulo">
            {seccion.titulo}
          </h2>
          {seccion.parrafos.map((parrafo) => (
            <p key={parrafo}>{parrafo}</p>
          ))}
          <p className="limites__fuentes">
            <span className="limites__fuentes-titulo">{textos.fuentesTitulo}:</span>{' '}
            {seccion.fuentes.map((fuente, i) => (
              <span key={fuente.enlace + fuente.texto}>
                {i > 0 ? ' · ' : null}
                <a href={fuente.enlace} rel="noopener noreferrer">
                  {fuente.texto}
                </a>
              </span>
            ))}
          </p>
        </section>
      ))}

      <section
        className="limites__seccion limites__seccion--medido"
        aria-labelledby="limites-medido"
      >
        <h2 id="limites-medido" className="seccion__titulo">
          {textos.medidoTitulo}
        </h2>
        <p>{textos.medidoIntro}</p>
        {carga.estado === 'error' ? (
          <EstadoDeCarga estado="error" mensaje={carga.mensaje} alReintentar={reintentar} />
        ) : fallo ? (
          <p>{textos.medidoSinDatos}</p>
        ) : campos === null ? (
          <EstadoDeCarga estado="cargando" texto={traducir(idioma, 'cargando')} />
        ) : (
          campos.map((campo) => (
            <div key={campo.id} className="limites__campo">
              <ul>
                {medicionesDelCampo(campo, idioma).map((frase) => (
                  <li key={frase}>{frase}</li>
                ))}
              </ul>
              {campo.avisos.length > 0 ? (
                <>
                  <h3 className="tarjeta__titulo">
                    {completar(textos.medidoAvisos, { campo: campo.nombre[idioma] })}
                  </h3>
                  <ul className="avisos__lista">
                    {campo.avisos.map((aviso) => (
                      <li key={aviso.es} className="aviso">
                        {aviso[idioma]}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ))
        )}
      </section>
    </article>
  )
}
