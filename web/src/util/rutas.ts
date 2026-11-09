/**
 * Resuelve una ruta del contrato (`campos/<id>/p1.webp`) contra la carpeta
 * `datos/` del sitio.
 *
 * Las rutas de `indice.json` y `campo.json` son relativas a propósito: así el
 * mismo JSON sirve publicado en la raíz del dominio, bajo una subcarpeta o
 * servido por la API. Se rechazan las absolutas y las que suben con `..`, que
 * sacarían la petición fuera de `datos/`.
 */
export function rutaDeDatos(relativa: string, base: string = import.meta.env.BASE_URL): string {
  const limpia = relativa.trim()
  if (limpia === '' || limpia.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(limpia)) {
    throw new Error(`Ruta de datos inválida: «${relativa}»`)
  }
  if (limpia.split('/').includes('..')) {
    throw new Error(`Ruta de datos fuera de datos/: «${relativa}»`)
  }
  const prefijo = base.endsWith('/') ? base : `${base}/`
  return `${prefijo}datos/${limpia}`
}
