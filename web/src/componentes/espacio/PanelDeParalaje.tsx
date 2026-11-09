import type { Campo } from '../../api/tipos.ts'
import { fechaUtc, numero } from '../../util/formatos.ts'
import { lineasDeVision, paralajeEntre, resumenDePasadas, SEGUNDOS_POR_PIXEL } from '../../util/paralaje.ts'

interface Props {
  campo: Campo
  indiceDeEpoca: number
}

/**
 * El texto de las líneas de visión (RF-35). Es DOM, no lienzo: se lee igual
 * sin WebGL, con lector de pantalla y en la imagen fija (RNF-13).
 */
export default function PanelDeParalaje({ campo, indiceDeEpoca }: Props) {
  const { pasadas, unaSola } = resumenDePasadas(campo.epocas)
  const listaDePasadas = pasadas.join(', ').replace(/, (\d+)$/, ' y $1')

  return (
    <section className="escena__panel" aria-labelledby="escena-paralaje">
      <h2 id="escena-paralaje">Líneas de visión y paralaje</h2>
      {campo.geometria ? (
        <ConObjeto campo={campo} indiceDeEpoca={indiceDeEpoca} />
      ) : (
        <p>
          Este campo no sigue a un cuerpo del Sistema Solar. Cada línea sale de la Tierra hacia el
          centro del campo en una época, y todas son paralelas: para algo tan lejano como una
          estrella, el ángulo entre ellas es prácticamente 0″ aunque la Tierra haya cambiado de lado
          del Sol. Lo que se ve moverse en este campo es el movimiento propio de la estrella, no un
          paralaje del Sistema Solar.
        </p>
      )}
      {unaSola ? (
        <p className="escena__nota">
          Todas las épocas de este campo son de la pasada {pasadas[0]} de SPHEREx: las líneas son las
          de esas épocas, separadas por días y no por los seis meses que hay entre pasadas. Por eso
          el ángulo es chico y, a esta escala, las líneas se superponen.
        </p>
      ) : (
        <p className="escena__nota">Las épocas de este campo son de las pasadas {listaDePasadas} de SPHEREx.</p>
      )}
    </section>
  )
}

function ConObjeto({ campo, indiceDeEpoca }: Props) {
  const geometria = campo.geometria!
  const lineas = lineasDeVision(geometria, campo.epocas)
  const objeto = geometria.objeto.nombre
  // Se compara la primera época con la elegida; si la elegida es la primera,
  // con la última, para que siempre haya dos líneas que mirar.
  const elegida = campo.epocas[indiceDeEpoca]?.id
  const a = lineas[0]
  const b = lineas.find((l) => l.epocaId === elegida && l !== a) ?? lineas.at(-1)
  if (!a || !b || a === b) {
    return <p>Este campo tiene una sola época con geometría: no hay dos líneas que comparar.</p>
  }
  const fechaDe = (id: string) => fechaUtc(campo.epocas.find((e) => e.id === id)!.fecha_utc)
  const p = paralajeEntre(a, b)

  return (
    <>
      <p>
        Cada línea sale de la Tierra hacia {objeto} en una época. Entre el{' '}
        <time className="escena__dato">{fechaDe(a.epocaId)}</time> y el{' '}
        <time className="escena__dato">{fechaDe(b.epocaId)}</time>, la Tierra se movió{' '}
        {numero(p.baseUA, 3)} UA y las dos líneas forman un ángulo de{' '}
        <strong className="escena__dato">{numero(p.segundos)}″</strong>, o sea{' '}
        <strong className="escena__dato">{numero(p.pixeles)} píxeles</strong> de SPHEREx (
        {numero(SEGUNDOS_POR_PIXEL, 2)}″ por píxel).
      </p>
      <p>
        Si {objeto} se hubiera quedado quieto, sólo el cambio de punto de vista lo habría corrido{' '}
        {numero(p.segundosPorLaTierra)}″: eso es el paralaje. La diferencia es su propio movimiento
        en la órbita. {objeto} está a {numero(b.distanciaUA)} UA de la Tierra.
      </p>
      <p>
        Una estrella lejana, en cambio, se ve en la misma dirección desde las dos posiciones de la
        Tierra: su ángulo es prácticamente 0″. Por eso en las imágenes las estrellas quedan quietas
        y {objeto} salta: así se delata un cuerpo lejano del Sistema Solar.
      </p>
    </>
  )
}
