/**
 * Estado del visor de un campo y sus cambios (RF-11 a RF-17), sin React: el
 * hook lo envuelve con useReducer y acá se prueba con Vitest.
 */
import type { Campo } from '../api/tipos.ts'
import { acotarRango, parametrosDeEstiramiento, type RangoVisible } from './estiramiento.ts'
import type { MapaDeColor } from './mapasDeColor.ts'
import {
  CAMBIOS_POR_SEGUNDO_INICIAL,
  CAMBIOS_POR_SEGUNDO_MAXIMO,
  CAMBIOS_POR_SEGUNDO_MINIMO,
  siguienteEpoca,
} from './parpadeo.ts'

export type VistaDelVisor = 'imagen' | 'diferencia' | 'apilado' | 'rastro'

export interface EstadoDelVisor {
  indice: number
  reproduciendo: boolean
  cambiosPorSegundo: number
  /** Índices de las épocas que entran en el parpadeo, en orden. */
  elegidas: number[]
  vista: VistaDelVisor
  mapa: MapaDeColor
  rango: RangoVisible
  /** ± MJy/sr en los extremos de la escala de la diferencia. */
  limite: number
  marcadores: boolean
  control: boolean
  seleccionado: number | null
}

export type Accion =
  | { tipo: 'reproducir' }
  | { tipo: 'pausar' }
  | { tipo: 'alternar' }
  | { tipo: 'avanzar' }
  | { tipo: 'paso'; direccion: 1 | -1 }
  | { tipo: 'ir'; indice: number }
  | { tipo: 'velocidad'; cambiosPorSegundo: number }
  | { tipo: 'elegir'; indices: number[]; incluir: boolean }
  | { tipo: 'elegirTodas' }
  | { tipo: 'vista'; vista: VistaDelVisor }
  | { tipo: 'mapa'; mapa: MapaDeColor }
  | { tipo: 'rango'; rango: RangoVisible }
  | { tipo: 'limite'; limite: number }
  | { tipo: 'restablecerRango' }
  | { tipo: 'marcadores'; mostrar: boolean }
  | { tipo: 'control'; mostrar: boolean }
  | { tipo: 'seleccionar'; indice: number | null }

export function vistaDisponible(campo: Campo, vista: VistaDelVisor): boolean {
  switch (vista) {
    case 'imagen':
      return true
    case 'diferencia':
      return campo.escala_diferencia !== null && campo.epocas.some((e) => e.diferencia !== null)
    case 'apilado':
      return campo.referencia !== null
    case 'rastro':
      return campo.rastro !== null
  }
}

function limiteInicial(campo: Campo): number {
  return (
    campo.escala_diferencia?.limite ?? (campo.estiramiento.maximo - campo.estiramiento.minimo) / 8
  )
}

/** Con qué época abre el visor y si arranca quieto (llegada desde la escena, RF-36). */
export interface Apertura {
  epocaId: string
  enPausa: boolean
}

export function estadoInicial(
  campo: Campo,
  movimientoReducido: boolean,
  apertura: Apertura | null = null,
): EstadoDelVisor {
  const p = parametrosDeEstiramiento(campo.estiramiento)
  const pedida = apertura ? campo.epocas.findIndex((e) => e.id === apertura.epocaId) : -1
  return {
    indice: Math.max(0, pedida),
    // RNF-04: con movimiento reducido el visor abre en pausa.
    reproduciendo: !movimientoReducido && !apertura?.enPausa && campo.epocas.length > 1,
    cambiosPorSegundo: CAMBIOS_POR_SEGUNDO_INICIAL,
    elegidas: campo.epocas.map((_, i) => i),
    vista: 'imagen',
    mapa: 'inferno',
    rango: { minimo: p.minimo, maximo: p.maximo },
    limite: limiteInicial(campo),
    marcadores: true,
    control: false,
    seleccionado: null,
  }
}

export function crearReductor(campo: Campo) {
  const total = campo.epocas.length
  const p = parametrosDeEstiramiento(campo.estiramiento)
  const limiteMaximo = limiteInicial(campo) * 4

  return function reducir(estado: EstadoDelVisor, accion: Accion): EstadoDelVisor {
    switch (accion.tipo) {
      case 'reproducir':
        return { ...estado, reproduciendo: estado.elegidas.length > 1 }
      case 'pausar':
        return { ...estado, reproduciendo: false }
      case 'alternar':
        return estado.reproduciendo
          ? { ...estado, reproduciendo: false }
          : { ...estado, reproduciendo: estado.elegidas.length > 1 }
      case 'avanzar':
        return { ...estado, indice: siguienteEpoca(estado.elegidas, estado.indice, 1) }
      case 'paso':
        // Pasar de a una es mirar con calma: el parpadeo se detiene.
        return {
          ...estado,
          reproduciendo: false,
          indice: siguienteEpoca(estado.elegidas, estado.indice, accion.direccion),
        }
      case 'ir':
        if (accion.indice < 0 || accion.indice >= total) return estado
        return { ...estado, reproduciendo: false, indice: accion.indice }
      case 'velocidad':
        return {
          ...estado,
          cambiosPorSegundo: Math.min(
            CAMBIOS_POR_SEGUNDO_MAXIMO,
            Math.max(CAMBIOS_POR_SEGUNDO_MINIMO, accion.cambiosPorSegundo),
          ),
        }
      case 'elegir': {
        const conjunto = new Set(estado.elegidas)
        for (const i of accion.indices) {
          if (i < 0 || i >= total) continue
          if (accion.incluir) conjunto.add(i)
          else conjunto.delete(i)
        }
        const elegidas = [...conjunto].sort((a, b) => a - b)
        // La época visible tiene que ser una de las elegidas, si hay alguna.
        const indice =
          elegidas.length === 0 || elegidas.includes(estado.indice)
            ? estado.indice
            : siguienteEpoca(elegidas, estado.indice, 1)
        return {
          ...estado,
          elegidas,
          indice,
          reproduciendo: estado.reproduciendo && elegidas.length > 1,
        }
      }
      case 'elegirTodas':
        return { ...estado, elegidas: campo.epocas.map((_, i) => i) }
      case 'vista':
        return vistaDisponible(campo, accion.vista) ? { ...estado, vista: accion.vista } : estado
      case 'mapa':
        return { ...estado, mapa: accion.mapa }
      case 'rango':
        return { ...estado, rango: acotarRango(accion.rango, p) }
      case 'limite':
        return {
          ...estado,
          limite: Math.min(limiteMaximo, Math.max(limiteMaximo / 400, accion.limite)),
        }
      case 'restablecerRango':
        return {
          ...estado,
          rango: { minimo: p.minimo, maximo: p.maximo },
          limite: limiteInicial(campo),
        }
      case 'marcadores':
        return { ...estado, marcadores: accion.mostrar }
      case 'control':
        return { ...estado, control: accion.mostrar }
      case 'seleccionar':
        return { ...estado, seleccionado: accion.indice }
    }
  }
}

/** Límites de los controles de rango: lo que el pipeline dejó en los WebP. */
export function limitesDelRango(campo: Campo) {
  const p = parametrosDeEstiramiento(campo.estiramiento)
  return {
    minimo: p.minimo,
    maximo: p.maximo,
    paso: (p.maximo - p.minimo) / 255,
    limiteMaximo: limiteInicial(campo) * 4,
    limitePaso: limiteInicial(campo) / 100,
  }
}
