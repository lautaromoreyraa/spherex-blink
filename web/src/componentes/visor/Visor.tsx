import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type { Campo } from '../../api/tipos.ts'
import { useIdioma } from '../../hooks/useIdioma.ts'
import { parametrosDeEstiramiento } from '../../util/estiramiento.ts'
import {
  limitesDelRango,
  vistaDisponible,
  type Accion,
  type EstadoDelVisor,
  type VistaDelVisor,
} from '../../util/estadoDelVisor.ts'
import {
  CAMBIOS_POR_SEGUNDO_MAXIMO,
  CAMBIOS_POR_SEGUNDO_MINIMO,
  epocasPorPasada,
} from '../../util/parpadeo.ts'
import { valorDelPixel, type Pixeles } from '../../util/pintura.ts'
import { formatearFechaUtc, formatearNumero } from '../../util/textos.ts'
import { acercar, pixelEntero, vistaInicial, type Vista } from '../../util/vista.ts'
import { crearWcs, formatearDec, formatearRa } from '../../util/wcs.ts'
import { capaDeLaVista } from './capas.ts'
import CapaDeMarcadores from './CapaDeMarcadores.tsx'
import Escenario from './Escenario.tsx'
import FichaDeObjeto from './FichaDeObjeto.tsx'
import Leyenda from './Leyenda.tsx'
import type { TipoDePintor } from './pintor.ts'

interface Props {
  campo: Campo
  pixeles: Map<string, Pixeles>
  estado: EstadoDelVisor
  despachar: Dispatch<Accion>
  /** Cabecera de la página: en pantallas anchas va a la derecha de la imagen. */
  cabecera?: ReactNode
}

const VISTAS: VistaDelVisor[] = ['imagen', 'diferencia', 'apilado', 'rastro']

function esCampoDeTexto(elemento: EventTarget | null): boolean {
  return (
    elemento instanceof HTMLElement &&
    elemento.closest('input, select, textarea, button, a, [contenteditable="true"]') !== null
  )
}

/**
 * El parpadeo entre fechas (RF-11) con sus vistas (RF-12, RF-17), los
 * objetos conocidos (RF-14), el zoom y las coordenadas (RF-16), dibujado en
 * WebGL (RF-37).
 */
export default function Visor({ campo, pixeles, estado, despachar, cabecera }: Props) {
  const { t, idioma } = useIdioma()
  const idAyuda = useId()
  const idTitulo = useId()
  const imagen = useMemo(
    () => ({ ancho: campo.rejilla.ancho_px, alto: campo.rejilla.alto_px }),
    [campo],
  )
  const [vista, setVista] = useState<Vista>(() => vistaInicial(imagen))
  const [pintor, setPintor] = useState<TipoDePintor | null>(null)
  const [puntero, setPuntero] = useState<{ x: number; y: number } | null>(null)
  const wcs = useMemo(() => crearWcs(campo.rejilla), [campo])
  const estiramiento = useMemo(() => parametrosDeEstiramiento(campo.estiramiento), [campo])
  const limites = useMemo(() => limitesDelRango(campo), [campo])
  const pasadas = useMemo(() => epocasPorPasada(campo.epocas), [campo])

  const epoca = campo.epocas[estado.indice]!
  const pila = estado.vista === 'apilado' || estado.vista === 'rastro'
  const capa = useMemo(
    () => capaDeLaVista(campo, epoca, estado.vista, pixeles),
    [campo, epoca, estado.vista, pixeles],
  )
  const divergente = estado.vista === 'diferencia'
  const cuadro = useMemo(
    () =>
      capa
        ? {
            a: capa,
            b: null,
            modo: 'simple' as const,
            mezcla: 0,
            mapa: estado.mapa,
            visible: { ...estado.rango, a: estiramiento.a },
            limite: estado.limite,
          }
        : null,
    [capa, estado.mapa, estado.rango, estado.limite, estiramiento],
  )

  const fecha = formatearFechaUtc(epoca.fecha_utc, idioma)
  const nombreDeVista = t(`vista.${estado.vista}` as const)
  const etiqueta = pila
    ? t('visor.altPila', { campo: campo.nombre[idioma], vista: nombreDeVista })
    : t('visor.altEpoca', { campo: campo.nombre[idioma], vista: nombreDeVista, fecha })

  // Teclas de época también cuando nada tiene el foco: en la demo se toca la
  // barra espaciadora sin apuntar antes al visor (RF-11).
  const alTecla = useCallback(
    (evento: {
      key: string
      shiftKey: boolean
      altKey: boolean
      ctrlKey: boolean
      metaKey: boolean
      preventDefault: () => void
    }) => {
      if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return false
      if (evento.key === 'ArrowRight') despachar({ tipo: 'paso', direccion: 1 })
      else if (evento.key === 'ArrowLeft') despachar({ tipo: 'paso', direccion: -1 })
      else if (evento.key === ' ' || evento.key === 'Spacebar') despachar({ tipo: 'alternar' })
      else return false
      evento.preventDefault()
      return true
    },
    [despachar],
  )

  useEffect(() => {
    const alPresionar = (evento: globalThis.KeyboardEvent) => {
      const objetivo = evento.target
      if (objetivo !== document.body && objetivo !== document.documentElement) return
      if (esCampoDeTexto(objetivo)) return
      alTecla(evento)
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [alTecla])

  const coordenadas = puntero ? pixelEntero(puntero, imagen) : null
  const cielo = coordenadas ? wcs.aCielo(puntero!.x, puntero!.y) : null
  const valor =
    coordenadas && capa
      ? valorDelPixel(capa.pixeles, capa.codificacion, coordenadas.x, coordenadas.y)
      : null

  const seleccionado =
    estado.seleccionado !== null ? campo.conocidos[estado.seleccionado] : undefined
  const totalDeEpocas = campo.epocas.length

  return (
    <section className="visor" aria-labelledby={idTitulo}>
      {cabecera ? <div className="visor__cabecera">{cabecera}</div> : null}
      <div className="visor__escena">
        <h2 id={idTitulo} className="seccion__titulo visor__titulo">
          {t('visor.titulo')}
        </h2>

        <div className="visor__rotulo" aria-live={estado.reproduciendo ? 'off' : 'polite'}>
          <p className="visor__fecha" data-prueba="fecha-visible">
            {pila
              ? t(estado.vista === 'apilado' ? 'visor.mediana' : 'visor.maximo', {
                  n: totalDeEpocas,
                })
              : fecha}
          </p>
          {!pila ? (
            <p className="visor__detalle">
              {t('visor.epocaDe', { i: estado.indice + 1, n: totalDeEpocas, p: epoca.pasada })} ·{' '}
              {formatearNumero(epoca.longitud_onda_um, idioma, 3)} µm · {nombreDeVista}
            </p>
          ) : (
            <p className="visor__detalle">{nombreDeVista}</p>
          )}
        </div>

        <Escenario
          cuadro={cuadro}
          imagen={imagen}
          vista={vista}
          alCambiarVista={setVista}
          etiqueta={etiqueta}
          nombre={t('visor.region', { nombre: campo.nombre[idioma] })}
          descripcionId={idAyuda}
          alPuntero={setPuntero}
          alPintor={setPintor}
          alTecla={(evento: KeyboardEvent<HTMLDivElement>) => alTecla(evento)}
          superposicion={(lienzo) =>
            estado.marcadores ? (
              <CapaDeMarcadores
                campo={campo}
                epocaId={pila ? null : epoca.id}
                idsElegidos={estado.elegidas.map((i) => campo.epocas[i]!.id)}
                vista={vista}
                lienzo={lienzo}
                control={estado.control}
                seleccionado={estado.seleccionado}
                alSeleccionar={(indice) => despachar({ tipo: 'seleccionar', indice })}
              />
            ) : null
          }
        />
        <p id={idAyuda} className="visor__ayuda">
          {t('visor.ayudaRegion')}
        </p>
        {pintor === '2d' ? (
          <p className="aviso aviso--suave" role="status">
            {t('visor.sinWebgl')}
          </p>
        ) : null}
        {divergente ? (
          <Leyenda tipo="divergente" limite={estado.limite} explicacion="diferencia" />
        ) : (
          <Leyenda tipo="secuencial" mapa={estado.mapa} rango={estado.rango} a={estiramiento.a} />
        )}
      </div>

      <div className="visor__panel">
        <fieldset className="grupo">
          <legend className="grupo__titulo">{t('control.titulo')}</legend>
          <div className="botonera">
            <button
              type="button"
              className="boton"
              onClick={() => despachar({ tipo: 'paso', direccion: -1 })}
              aria-label={t('control.anterior')}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="boton boton--principal"
              onClick={() => despachar({ tipo: 'alternar' })}
              disabled={estado.elegidas.length < 2}
            >
              {estado.reproduciendo ? t('control.pausar') : t('control.reproducir')}
            </button>
            <button
              type="button"
              className="boton"
              onClick={() => despachar({ tipo: 'paso', direccion: 1 })}
              aria-label={t('control.siguiente')}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <label className="control">
            <span className="control__etiqueta">
              {t('control.velocidadValor', {
                n: formatearNumero(estado.cambiosPorSegundo, idioma, 1),
              })}
            </span>
            <input
              type="range"
              min={CAMBIOS_POR_SEGUNDO_MINIMO}
              max={CAMBIOS_POR_SEGUNDO_MAXIMO}
              step={0.5}
              value={estado.cambiosPorSegundo}
              onChange={(e) =>
                despachar({ tipo: 'velocidad', cambiosPorSegundo: Number(e.target.value) })
              }
            />
          </label>
          <p className="nota">{t('control.avisoDestellos')}</p>
        </fieldset>

        <fieldset className="grupo">
          <legend className="grupo__titulo">{t('vista.etiqueta')}</legend>
          {VISTAS.map((v) => {
            const disponible = vistaDisponible(campo, v)
            return (
              <label key={v} className={`opcion${disponible ? '' : ' opcion--deshabilitada'}`}>
                <input
                  type="radio"
                  name={`vista-${campo.id}`}
                  value={v}
                  checked={estado.vista === v}
                  disabled={!disponible}
                  onChange={() => despachar({ tipo: 'vista', vista: v })}
                />
                <span>
                  <span className="opcion__nombre">{t(`vista.${v}` as const)}</span>
                  <span className="opcion__ayuda">
                    {disponible
                      ? t(`vista.ayuda.${v}` as const)
                      : t(v === 'diferencia' ? 'vista.sinDiferencia' : 'vista.sinRastro')}
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <fieldset className="grupo">
          <legend className="grupo__titulo">{t('seleccion.titulo')}</legend>
          {[...pasadas.entries()].map(([pasada, indices]) => {
            const todas = indices.every((i) => estado.elegidas.includes(i))
            return (
              <label key={pasada} className="opcion">
                <input
                  type="checkbox"
                  checked={todas}
                  onChange={(e) =>
                    despachar({ tipo: 'elegir', indices, incluir: e.target.checked })
                  }
                />
                <span className="opcion__nombre">
                  {t('seleccion.pasada', { n: pasada, k: indices.length })}
                </span>
              </label>
            )
          })}
          {estado.elegidas.length === 0 ? (
            <p className="nota nota--alerta" role="status">
              {t('seleccion.vacia')}
            </p>
          ) : null}
        </fieldset>

        <fieldset className="grupo">
          <legend className="grupo__titulo">{t('mapa.etiqueta')}</legend>
          {(['inferno', 'cividis'] as const).map((m) => (
            <label key={m} className="opcion">
              <input
                type="radio"
                name={`mapa-${campo.id}`}
                value={m}
                checked={estado.mapa === m}
                onChange={() => despachar({ tipo: 'mapa', mapa: m })}
              />
              <span className="opcion__nombre">{t(`mapa.${m}` as const)}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="grupo">
          <legend className="grupo__titulo">{t('rango.titulo')}</legend>
          {divergente ? (
            <label className="control">
              <span className="control__etiqueta">
                {t('rango.diferencia')}: {formatearNumero(estado.limite, idioma, 3)}
              </span>
              <input
                type="range"
                min={limites.limitePaso}
                max={limites.limiteMaximo}
                step={limites.limitePaso}
                value={estado.limite}
                onChange={(e) => despachar({ tipo: 'limite', limite: Number(e.target.value) })}
              />
            </label>
          ) : (
            <>
              <label className="control">
                <span className="control__etiqueta">
                  {t('rango.minimo')}: {formatearNumero(estado.rango.minimo, idioma, 3)}
                </span>
                <input
                  type="range"
                  min={limites.minimo}
                  max={limites.maximo}
                  step={limites.paso}
                  value={estado.rango.minimo}
                  onChange={(e) =>
                    despachar({
                      tipo: 'rango',
                      rango: { ...estado.rango, minimo: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className="control">
                <span className="control__etiqueta">
                  {t('rango.maximo')}: {formatearNumero(estado.rango.maximo, idioma, 3)}
                </span>
                <input
                  type="range"
                  min={limites.minimo}
                  max={limites.maximo}
                  step={limites.paso}
                  value={estado.rango.maximo}
                  onChange={(e) =>
                    despachar({
                      tipo: 'rango',
                      rango: { ...estado.rango, maximo: Number(e.target.value) },
                    })
                  }
                />
              </label>
            </>
          )}
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => despachar({ tipo: 'restablecerRango' })}
          >
            {t('rango.restablecer')}
          </button>
        </fieldset>

        <fieldset className="grupo">
          <legend className="grupo__titulo">{t('conocidos.titulo')}</legend>
          <label className="opcion">
            <input
              type="checkbox"
              checked={estado.marcadores}
              onChange={(e) => despachar({ tipo: 'marcadores', mostrar: e.target.checked })}
            />
            <span className="opcion__nombre">{t('marcadores.mostrar')}</span>
          </label>
          <label className="opcion">
            <input
              type="checkbox"
              checked={estado.control}
              disabled={!estado.marcadores}
              onChange={(e) => despachar({ tipo: 'control', mostrar: e.target.checked })}
            />
            <span className="opcion__nombre">{t('marcadores.control')}</span>
          </label>
          <p className="nota">{t('marcadores.leyenda')}</p>
          {seleccionado ? (
            <FichaDeObjeto
              objeto={seleccionado}
              epocaId={pila ? null : epoca.id}
              totalDeEpocas={totalDeEpocas}
              alCerrar={() => despachar({ tipo: 'seleccionar', indice: null })}
            />
          ) : null}
        </fieldset>

        <fieldset className="grupo">
          <legend className="grupo__titulo">{t('zoom.titulo')}</legend>
          <div className="botonera">
            <button
              type="button"
              className="boton"
              onClick={() => setVista(acercar(vista, 1 / 1.5, { ancho: 1, alto: 1 }, imagen))}
              aria-label={t('zoom.alejar')}
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="botonera__valor">
              {t('zoom.valor', { n: formatearNumero(vista.zoom, idioma, 1) })}
            </span>
            <button
              type="button"
              className="boton"
              onClick={() => setVista(acercar(vista, 1.5, { ancho: 1, alto: 1 }, imagen))}
              aria-label={t('zoom.acercar')}
            >
              <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => setVista(vistaInicial(imagen))}
            >
              {t('zoom.entera')}
            </button>
          </div>
          <div className="coordenadas" aria-live="off">
            <p className="grupo__subtitulo">{t('coordenadas.titulo')}</p>
            {coordenadas && cielo ? (
              <dl className="coordenadas__lista">
                <dt>RA</dt>
                <dd>
                  {formatearRa(cielo.ra, idioma === 'es' ? ',' : '.')} (
                  {formatearNumero(cielo.ra, idioma, 5)}°)
                </dd>
                <dt>Dec</dt>
                <dd>
                  {formatearDec(cielo.dec)} ({formatearNumero(cielo.dec, idioma, 5)}°)
                </dd>
                <dt>{t('coordenadas.pixel')}</dt>
                <dd>
                  {coordenadas.x}, {coordenadas.y}
                </dd>
                <dt>{t('coordenadas.valor')}</dt>
                <dd>
                  {valor === null
                    ? t('coordenadas.sinDato')
                    : `${formatearNumero(valor, idioma, 3)} ${t('leyenda.unidad')}`}
                </dd>
              </dl>
            ) : (
              <p className="nota">{t('coordenadas.fuera')}</p>
            )}
          </div>
        </fieldset>
      </div>
    </section>
  )
}
