import { expect, test } from '@playwright/test'

test('la página de inicio carga con el título del proyecto', async ({ page }) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))

  await page.goto('/')

  await expect(page).toHaveTitle('spherex-blink')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('spherex-blink')
  expect(errores).toEqual([])
})
