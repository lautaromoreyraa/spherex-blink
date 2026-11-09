import type { Page } from '@playwright/test'

/**
 * RNF-01: todo pedido que no sea al propio sitio se corta. Si la demo
 * dependiera de la red, las pruebas fallarían. Devuelve las URL bloqueadas.
 */
export async function sinRedExterna(page: Page): Promise<string[]> {
  const bloqueadas: string[] = []
  await page.route('**/*', (ruta) => {
    const url = new URL(ruta.request().url())
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return ruta.continue()
    bloqueadas.push(url.href)
    return ruta.abort('internetdisconnected')
  })
  return bloqueadas
}

/** Errores de la página y violaciones de la CSP (RNF-08) que aparezcan en la consola. */
export function vigilarErrores(page: Page): string[] {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))
  page.on('console', (mensaje) => {
    if (mensaje.type() === 'error') errores.push(mensaje.text())
  })
  return errores
}
