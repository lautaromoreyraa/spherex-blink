import type { Campo } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import { lineasDeVision, paralajeEntre, resumenDePasadas, SEGUNDOS_POR_PIXEL } from '../../util/paralaje.ts'
import { formatearFechaUtc, formatearNumero, TEXTOS } from '../../util/textos.ts'
import Plantilla from './Plantilla.tsx'

interface Props {
  campo: Campo
  indiceDeEpoca: number
}

/**
 * El texto de las líneas de visión (RF-35). Es DOM, no lienzo: se lee igual
 * sin WebGL, con lector de pantalla y en la imagen fija (RNF-13).
 */
export default function PanelDeParalaje({ campo, indiceDeEpoca }: Props) {
  const { t, idioma } = useIdioma()
  const { pasadas, unaSola } = resumenDePasadas(campo.epocas)
  const lista = new Intl.ListFormat(idioma, { type: 'conjunction' }).format(pasadas.map(String))

  return (
    <section className="escena__panel" aria-labelledby="escena-paralaje">
      <h2 id="escena-paralaje">{t('escena.paralajeTitulo')}</h2>
      {campo.geometria ? (
        <ConObjeto campo={campo} indiceDeEpoca={indiceDeEpoca} />
      ) : (
        <p>{t('escena.sinObjeto')}</p>
      )}
      <p className="escena__nota">
        {unaSola
          ? t('escena.unaSola', { n: pasadas[0]! })
          : t('escena.variasPasadas', { lista })}
      </p>
    </section>
  )
}

function ConObjeto({ campo, indiceDeEpoca }: Props) {
  const { t, idioma } = useIdioma()
  const geometria = campo.geometria!
  const lineas = lineasDeVision(geometria, campo.epocas)
  const objeto = geometria.objeto.nombre
  // Se compara la primera época con la elegida; si la elegida es la primera,
  // con la última, para que siempre haya dos líneas que mirar.
  const elegida = campo.epocas[indiceDeEpoca]?.id
  const a = lineas[0]
  const b = lineas.find((l) => l.epocaId === elegida && l !== a) ?? lineas.at(-1)
  if (!a || !b || a === b) return <p>{t('escena.unaEpoca')}</p>

  const fechaDe = (id: string) => {
    const iso = campo.epocas.find((e) => e.id === id)!.fecha_utc
    return (
      <time className="escena__dato" dateTime={iso}>
        {formatearFechaUtc(iso, idioma)}
      </time>
    )
  }
  const p = paralajeEntre(a, b)
  const numero = (valor: number, decimales = 1) => formatearNumero(valor, idioma, decimales)

  return (
    <>
      <p>
        <Plantilla
          texto={TEXTOS[idioma]['escena.lineas']}
          valores={{
            objeto,
            fechaA: fechaDe(a.epocaId),
            fechaB: fechaDe(b.epocaId),
            base: numero(p.baseUA, 3),
            segundos: (
              <strong className="escena__dato">
                {t('escena.segundos', { n: numero(p.segundos) })}
              </strong>
            ),
            pixeles: (
              <strong className="escena__dato">
                {t('escena.pixeles', { n: numero(p.pixeles) })}
              </strong>
            ),
            escala: numero(SEGUNDOS_POR_PIXEL, 2),
          }}
        />
      </p>
      <p>
        {t('escena.paralajeTierra', {
          objeto,
          segundos: numero(p.segundosPorLaTierra),
          distancia: numero(b.distanciaUA),
        })}
      </p>
      <p>{t('escena.estrella', { objeto })}</p>
    </>
  )
}
