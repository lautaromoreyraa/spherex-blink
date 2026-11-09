import { expect, test, type Page } from '@playwright/test'

// La escena 3D (RF-34 a RF-36, RNF-13). Headless Chromium dibuja WebGL por
// software, así que el lienzo existe; lo que se mira acá es lo que el DOM
// garantiza: textos, rótulos accesibles, el vuelo y la alternativa sin WebGL.

function sinWebGL(page: Page) {
  return page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext as (...args: unknown[]) => unknown
    // Se reemplaza la firma sobrecargada a propósito: WebGL siempre falla.
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: unknown[]) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
}

test('la escena muestra la fecha UTC, el aviso de escala y el paralaje', async ({ page }) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))
  await page.goto('/escena/makemake')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('El Sistema Solar en cada pasada')
  await expect(page.getByRole('note')).toContainText('no están a escala')
  await expect(page.getByRole('note')).toContainText('Makemake es una ilustración')
  await expect(page.locator('.escena__fecha')).toContainText('2026-06-09 09:44:15 UTC')
  await expect(page.getByText('137,4″')).toBeVisible()
  await expect(page.getByText('22,3 píxeles')).toBeVisible()
  await expect(page.getByText(/Todas las épocas de este campo son de la pasada 3/)).toBeVisible()

  // El control de tiempo cambia la fecha.
  const tiempo = page.getByLabel(/Época 1 de 9/)
  await tiempo.focus()
  await page.keyboard.press('End')
  await expect(page.locator('.escena__fecha')).toContainText('2026-06-13 11:29:28 UTC')
  expect(errores).toEqual([])
})

test('cada cuerpo es un botón con nombre accesible', async ({ page }) => {
  await page.goto('/escena/makemake')
  for (const nombre of ['Sol', 'Tierra', 'Júpiter', 'Neptuno', 'Makemake (ilustración)']) {
    const rotulo = page.getByRole('button', { name: nombre, exact: true })
    await expect(rotulo).toBeAttached()
    await rotulo.focus()
    await expect(rotulo).toBeFocused()
  }
})

test('el interruptor de escala real cambia el aviso', async ({ page }) => {
  await page.goto('/escena/makemake')
  const interruptor = page.getByRole('button', { name: 'Escala real' })
  await interruptor.click()
  await expect(interruptor).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('note')).toContainText('Escala real de distancias y tamaños')
})

test('desde la escena se vuela al campo de Makemake', async ({ page }) => {
  await page.goto('/escena/makemake')
  await expect(page.getByRole('button', { name: 'Tierra', exact: true })).toBeAttached()
  const inicio = Date.now()
  await page.locator('.escena__acciones').getByRole('button', { name: 'Volar al campo Makemake' }).click()
  await expect(page.getByRole('status')).toContainText('Volando al campo Makemake')
  await page.waitForURL('**/campo/makemake', { timeout: 5000 })
  // 2,4 s de vuelo más el margen de una máquina de CI cargada.
  expect(Date.now() - inicio).toBeLessThan(4500)
})

test('el vuelo se saltea con Escape', async ({ page }) => {
  await page.goto('/escena/makemake')
  await page.locator('.escena__acciones').getByRole('button', { name: 'Volar al campo Makemake' }).click()
  await expect(page.getByRole('button', { name: 'Saltear el vuelo (Esc)' })).toBeFocused()
  const inicio = Date.now()
  await page.keyboard.press('Escape')
  await page.waitForURL('**/campo/makemake')
  expect(Date.now() - inicio).toBeLessThan(1500)
})

test.describe('con movimiento reducido', () => {
  test('el vuelo es un corte directo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/escena/makemake')
    await page.locator('.escena__acciones').getByRole('button', { name: 'Volar al campo Makemake' }).click()
    await page.waitForURL('**/campo/makemake', { timeout: 1000 })
  })
})

test('sin WebGL muestra la imagen fija y no baja la escena 3D', async ({ page }) => {
  await sinWebGL(page)
  const pedidos: string[] = []
  page.on('request', (pedido) => pedidos.push(pedido.url()))
  await page.goto('/escena/makemake')

  await expect(page.getByRole('img', { name: /Captura de la escena/ })).toBeVisible()
  await expect(page.getByText('137,4″')).toBeVisible()
  expect(pedidos.some((url) => /EscenaEspacial-.*\.js/.test(url))).toBe(false)
  await page.locator('.escena__acciones').getByRole('button', { name: 'Volar al campo Makemake' }).click()
  await page.waitForURL('**/campo/makemake')
})

test('la página de inicio no descarga la escena 3D', async ({ page }) => {
  const pedidos: string[] = []
  page.on('request', (pedido) => pedidos.push(pedido.url()))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(pedidos.some((url) => /Escena/.test(url))).toBe(false)
})

test('la escena anda sin red externa y sin desborde en un celular', async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (ruta) => ruta.abort())
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/escena/estrella-de-barnard')
  await expect(page.getByText(/no sigue a un cuerpo del Sistema Solar/)).toBeVisible()
  await expect(page.getByText(/pasadas 1, 2 y 3/)).toBeVisible()
  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(desborda).toBe(false)
})
