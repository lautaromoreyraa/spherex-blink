/**
 * Formatos de la escena: fechas siempre en UTC (las épocas son UTC y la
 * escena no tiene que depender del huso de la PC del proyector) y números
 * con coma decimal.
 */

/** «2026-06-09T09:44:15Z» → «2026-06-09 09:44:15 UTC». */
export function fechaUtc(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) throw new Error(`Fecha inválida: «${iso}»`)
  return `${fecha.toISOString().slice(0, 19).replace('T', ' ')} UTC`
}

const formatos = new Map<number, Intl.NumberFormat>()

/** Número con coma decimal y la cantidad de decimales pedida. */
export function numero(valor: number, decimales = 1): string {
  let formato = formatos.get(decimales)
  if (!formato) {
    formato = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    })
    formatos.set(decimales, formato)
  }
  return formato.format(valor)
}
