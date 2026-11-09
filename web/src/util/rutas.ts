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
  return `${prefijoDelSitio(base)}datos/${limpia}`
}

/** Las páginas del sitio. La escena 3D entra al visor por `campo` (RF-36). */
export type Ruta =
  | { pagina: 'inicio' }
  | { pagina: 'campo'; id: string }
  | { pagina: 'limites' }
  | { pagina: 'no-encontrada' }

const ID_DE_CAMPO = /^[a-z0-9]+(-[a-z0-9]+)*$/

function prefijoDelSitio(base: string): string {
  return base.endsWith('/') ? base : `${base}/`
}

/** Dirección de una página, colgada del `base` de Vite. */
export function direccion(ruta: Ruta, base: string = import.meta.env.BASE_URL): string {
  const prefijo = prefijoDelSitio(base)
  switch (ruta.pagina) {
    case 'inicio':
    case 'no-encontrada':
      return prefijo
    case 'campo':
      if (!ID_DE_CAMPO.test(ruta.id)) throw new Error(`Id de campo inválido: «${ruta.id}»`)
      return `${prefijo}campo/${ruta.id}`
    case 'limites':
      return `${prefijo}limites`
  }
}

/** Qué página corresponde a un `pathname`; lo que no se reconoce es «no encontrada». */
export function rutaDe(pathname: string, base: string = import.meta.env.BASE_URL): Ruta {
  const prefijo = prefijoDelSitio(base)
  const conBarra = pathname.endsWith('/') ? pathname : `${pathname}/`
  if (!conBarra.startsWith(prefijo)) return { pagina: 'no-encontrada' }
  const partes = conBarra.slice(prefijo.length).split('/').filter(Boolean)
  if (partes.length === 0) return { pagina: 'inicio' }
  if (partes.length === 1 && partes[0] === 'limites') return { pagina: 'limites' }
  if (partes.length === 2 && partes[0] === 'campo') {
    let id = partes[1]!
    try {
      id = decodeURIComponent(id)
    } catch {
      return { pagina: 'no-encontrada' }
    }
    if (ID_DE_CAMPO.test(id)) return { pagina: 'campo', id }
  }
  return { pagina: 'no-encontrada' }
}
