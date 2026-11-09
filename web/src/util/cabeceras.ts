/**
 * Lee `public/_headers` (formato de Cloudflare Pages) para que `vite preview`
 * sirva las mismas cabeceras que el sitio publicado y los tests las prueben
 * (RNF-08).
 *
 * Formato: una línea con el patrón de ruta sin sangría y debajo, con
 * sangría, `Nombre: valor`. Las líneas con `#` son comentarios.
 */
export type ReglasDeCabeceras = Map<string, Record<string, string>>

export function leerCabeceras(texto: string): ReglasDeCabeceras {
  const reglas: ReglasDeCabeceras = new Map()
  let actual: Record<string, string> | null = null
  for (const linea of texto.split(/\r?\n/)) {
    if (linea.trim() === '' || linea.trimStart().startsWith('#')) continue
    if (!/^\s/.test(linea)) {
      actual = {}
      reglas.set(linea.trim(), actual)
      continue
    }
    if (!actual) throw new Error(`Cabecera fuera de una ruta: «${linea.trim()}»`)
    const separador = linea.indexOf(':')
    if (separador < 0) throw new Error(`Cabecera sin valor: «${linea.trim()}»`)
    actual[linea.slice(0, separador).trim()] = linea.slice(separador + 1).trim()
  }
  return reglas
}

/** Las directivas de una CSP como mapa directiva → fuentes. */
export function directivasCsp(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [nombre, ...fuentes] = d.split(/\s+/)
        return [nombre!.toLowerCase(), fuentes] as const
      }),
  )
}
