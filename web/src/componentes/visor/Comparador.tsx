import { useId, useMemo, useState } from 'react'
import type { Campo } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import { parametrosDeEstiramiento, type RangoVisible } from '../../util/estiramiento.ts'
import type { MapaDeColor } from '../../util/mapasDeColor.ts'
import type { Pixeles } from '../../util/pintura.ts'
import { formatearFechaUtc } from '../../util/textos.ts'
import { vistaInicial, type Vista } from '../../util/vista.ts'
import { capaDeImagen } from './capas.ts'
import Escenario from './Escenario.tsx'
import Leyenda from './Leyenda.tsx'
import type { Capa, Cuadro } from './pintor.ts'

type Modo = 'cortina' | 'fundido' | 'lado' | 'resta'
const MODOS: Modo[] = ['cortina', 'fundido', 'lado', 'resta']

interface Props {
  campo: Campo
  pixeles: Map<string, Pixeles>
  mapa: MapaDeColor
  rango: RangoVisible
}

/**
 * Dos fechas elegidas, comparadas con cortina, fundido, lado a lado o resta
 * (RF-13). Las dos comparten zoom y desplazamiento; la cortina y el fundido
 * se mueven con un deslizador, que responde a mouse, toque y flechas.
 */
export default function Comparador({ campo, pixeles, mapa, rango }: Props) {
  const { t, idioma } = useIdioma()
  const idTitulo = useId()
  const total = campo.epocas.length
  const [indiceA, setIndiceA] = useState(0)
  const [indiceB, setIndiceB] = useState(Math.max(0, total - 1))
  const [modo, setModo] = useState<Modo>('cortina')
  const [mezcla, setMezcla] = useState(0.5)
  const imagen = useMemo(
    () => ({ ancho: campo.rejilla.ancho_px, alto: campo.rejilla.alto_px }),
    [campo],
  )
  const [vista, setVista] = useState<Vista>(() => vistaInicial(imagen))
  const estiramiento = useMemo(() => parametrosDeEstiramiento(campo.estiramiento), [campo])

  const epocaA = campo.epocas[indiceA]!
  const epocaB = campo.epocas[indiceB]!
  const capaA = useMemo(() => capaDeImagen(campo, epocaA.imagen, pixeles), [campo, epocaA, pixeles])
  const capaB = useMemo(() => capaDeImagen(campo, epocaB.imagen, pixeles), [campo, epocaB, pixeles])
  // La resta se rotula con la misma escala que la diferencia del pipeline.
  const limite =
    campo.escala_diferencia?.limite ?? (campo.estiramiento.maximo - campo.estiramiento.minimo) / 8
  const visible = useMemo(() => ({ ...rango, a: estiramiento.a }), [rango, estiramiento])

  function cuadroCon(a: Capa | null, b: Capa | null, modoDePintura: Cuadro['modo']) {
    if (!a) return null
    return { a, b, modo: modoDePintura, mezcla, mapa, visible, limite }
  }

  const fechaA = formatearFechaUtc(epocaA.fecha_utc, idioma)
  const fechaB = formatearFechaUtc(epocaB.fecha_utc, idioma)
  const nombreDelModo = t(`comparar.${modo}` as const)
  const etiqueta = t('comparar.alt', {
    campo: campo.nombre[idioma],
    modo: nombreDelModo,
    a: fechaA,
    b: fechaB,
  })

  const selector = (cual: 'a' | 'b', valor: number, cambiar: (i: number) => void) => (
    <label className="control">
      <span className="control__etiqueta">{t(cual === 'a' ? 'comparar.a' : 'comparar.b')}</span>
      <select className="selector" value={valor} onChange={(e) => cambiar(Number(e.target.value))}>
        {campo.epocas.map((epoca, i) => (
          <option key={epoca.id} value={i}>
            {formatearFechaUtc(epoca.fecha_utc, idioma)} · {t('procedencia.pasada')} {epoca.pasada}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <section className="comparador" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="seccion__titulo">
        {t('comparar.titulo')}
      </h2>
      <p className="seccion__intro">{t('comparar.intro')}</p>

      <div className="comparador__controles">
        {selector('a', indiceA, setIndiceA)}
        {selector('b', indiceB, setIndiceB)}
        <fieldset className="grupo grupo--en-linea">
          <legend className="grupo__titulo">{t('comparar.modo')}</legend>
          {MODOS.map((m) => (
            <label key={m} className="opcion">
              <input
                type="radio"
                name={`comparar-${campo.id}`}
                value={m}
                checked={modo === m}
                onChange={() => setModo(m)}
              />
              <span className="opcion__nombre">{t(`comparar.${m}` as const)}</span>
            </label>
          ))}
        </fieldset>
      </div>

      {modo === 'lado' ? (
        <div className="comparador__paneles">
          {[
            { cual: 'a', capa: capaA, rotulo: t('comparar.rotuloA', { fecha: fechaA }) },
            { cual: 'b', capa: capaB, rotulo: t('comparar.rotuloB', { fecha: fechaB }) },
          ].map(({ cual, capa, rotulo }) => (
            <figure key={cual} className="comparador__panel">
              <figcaption className="comparador__rotulo">{rotulo}</figcaption>
              <Escenario
                cuadro={cuadroCon(capa, null, 'simple')}
                imagen={imagen}
                vista={vista}
                alCambiarVista={setVista}
                etiqueta={`${campo.nombre[idioma]}: ${rotulo}`}
                nombre={rotulo}
              />
            </figure>
          ))}
        </div>
      ) : (
        <div className="comparador__unico">
          <div className="comparador__rotulos" aria-hidden="true">
            <span>{t('comparar.rotuloA', { fecha: fechaA })}</span>
            {modo !== 'resta' ? <span>{t('comparar.rotuloB', { fecha: fechaB })}</span> : null}
          </div>
          <Escenario
            cuadro={cuadroCon(capaA, capaB, modo)}
            imagen={imagen}
            vista={vista}
            alCambiarVista={setVista}
            etiqueta={etiqueta}
            nombre={etiqueta}
            superposicion={(lienzo) =>
              modo === 'cortina' ? (
                <div
                  className="cortina__linea"
                  style={{ left: mezcla * lienzo.ancho }}
                  aria-hidden="true"
                />
              ) : null
            }
          />
          {modo === 'cortina' || modo === 'fundido' ? (
            <label className="control control--ancho">
              <span className="control__etiqueta">
                {t(modo === 'cortina' ? 'comparar.posicionCortina' : 'comparar.mezcla')}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={mezcla}
                onChange={(e) => setMezcla(Number(e.target.value))}
              />
            </label>
          ) : null}
        </div>
      )}

      {modo === 'resta' ? (
        <Leyenda tipo="divergente" limite={limite} explicacion="resta" />
      ) : (
        <Leyenda tipo="secuencial" mapa={mapa} rango={rango} a={estiramiento.a} />
      )}
    </section>
  )
}
