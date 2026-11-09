import { useCallback, useEffect, useState } from 'react'
import { cargarCampo, cargarIndice, cargarPixeles } from '../api/campos.ts'
import type { Campo, Indice } from '../api/tipos.ts'
import type { Pixeles } from '../util/pintura.ts'

export type Carga<T> =
  { estado: 'cargando' } | { estado: 'listo'; datos: T } | { estado: 'error'; mensaje: string }

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Corre una carga asíncrona, la cancela si cambia la clave y deja reintentar. */
function useCarga<T>(clave: string, cargar: (senal: AbortSignal) => Promise<T>) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<{ clave: string; carga: Carga<T> } | null>(null)

  useEffect(() => {
    const control = new AbortController()
    cargar(control.signal).then(
      (datos) => setResultado({ clave, carga: { estado: 'listo', datos } }),
      (error: unknown) => {
        if (control.signal.aborted) return
        setResultado({ clave, carga: { estado: 'error', mensaje: mensajeDe(error) } })
      },
    )
    return () => control.abort()
    // `cargar` cambia en cada render; la clave y el intento dicen cuándo recargar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento])

  const reintentar = useCallback(() => {
    setResultado(null)
    setIntento((n) => n + 1)
  }, [])
  const carga: Carga<T> =
    resultado && resultado.clave === clave ? resultado.carga : { estado: 'cargando' }
  return { carga, reintentar }
}

export function useIndice() {
  return useCarga<Indice>('indice', (senal) => cargarIndice(senal))
}

export function useCampo(id: string) {
  return useCarga<Campo>(`campo:${id}`, (senal) => cargarCampo(id, senal))
}

/** Todas las rutas de imagen de un campo: épocas, diferencias, mediana y rastro. */
export function rutasDeImagenes(campo: Campo): string[] {
  const rutas = new Set<string>()
  for (const epoca of campo.epocas) {
    rutas.add(epoca.imagen)
    if (epoca.diferencia) rutas.add(epoca.diferencia)
  }
  if (campo.referencia) rutas.add(campo.referencia)
  if (campo.rastro) rutas.add(campo.rastro)
  return [...rutas]
}

/**
 * Baja todas las imágenes del campo antes de mostrar el visor: el parpadeo
 * tiene que cambiar de cuadro sin esperar la red (RNF-02).
 */
export function useImagenesDelCampo(campo: Campo | null) {
  const [progreso, setProgreso] = useState({ clave: '', listas: 0 })
  const clave = campo ? `imagenes:${campo.id}` : 'sin-campo'
  const { carga, reintentar } = useCarga<Map<string, Pixeles>>(clave, async (senal) => {
    if (!campo) return new Map()
    const rutas = rutasDeImagenes(campo)
    let listas = 0
    const pares = await Promise.all(
      rutas.map(async (ruta) => {
        const pixeles = await cargarPixeles(ruta, senal)
        listas += 1
        if (!senal.aborted) setProgreso({ clave, listas })
        return [ruta, pixeles] as const
      }),
    )
    return new Map(pares)
  })
  const total = campo ? rutasDeImagenes(campo).length : 0
  return { carga, reintentar, listas: progreso.clave === clave ? progreso.listas : 0, total }
}
