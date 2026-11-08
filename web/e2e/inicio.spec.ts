import { expect, test } from '@playwright/test'

test('la página de inicio carga con el título del proyecto', async ({ page }) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))

  await page.goto('/')

  await expect(page).toHaveTitle('spherex-blink')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('spherex-blink')
  expect(errores).toEqual([])
})

test('el pie muestra los reconocimientos de las fuentes de datos', async ({ page }) => {
  await page.goto('/')

  const pie = page.getByRole('contentinfo')
  for (const fuente of ['SPHEREx', 'IRSA', 'SkyBoT', 'JPL Horizons', 'SIMBAD']) {
    await expect(pie.getByRole('link', { name: fuente, exact: true })).toBeVisible()
  }
})

test('el pie se lee a 1rem y no desborda en un celular', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')

  const tamano = await page
    .getByRole('contentinfo')
    .locator('li')
    .first()
    .evaluate((elemento) => parseFloat(getComputedStyle(elemento).fontSize))
  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(tamano).toBeGreaterThanOrEqual(16)
  expect(desborda).toBe(false)
})
