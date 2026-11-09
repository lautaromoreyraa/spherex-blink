import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { sinRedExterna, vigilarErrores } from './ayudas.ts'

test.use({ locale: 'es-AR' })

const fecha = (page: Page) => page.locator('[data-prueba="fecha-visible"]')

async function abrirMakemake(page: Page) {
  await page.goto('/campo/makemake')
  await expect(page.getByRole('heading', { level: 1, name: 'Makemake' })).toBeVisible()
  await expect(fecha(page)).toBeVisible()
}

test.describe('sin red externa (RNF-01)', () => {
  test('desde el inicio se abre el primer campo y muestra su primera época (RF-10)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const bloqueadas = await sinRedExterna(page)
    const errores = vigilarErrores(page)
    await page.goto('/')

    const campos = page
      .getByRole('list')
      .filter({ has: page.getByRole('img') })
      .getByRole('link')
    await expect(campos).toHaveCount(2)
    await expect(campos.first()).toContainText('9 épocas')
    await campos.first().click()

    await expect(page).toHaveURL(/\/campo\/estrella-de-barnard$/)
    await expect(fecha(page)).toHaveText('27 de ago de 2025, 05:06 UTC')
    await expect(page.getByText('Época 1 de 9', { exact: false })).toBeVisible()
    expect(bloqueadas).toEqual([])
    expect(errores).toEqual([])
  })

  test('un campo se elige con Tab + Enter (RF-10)', async ({ page }) => {
    await sinRedExterna(page)
    await page.goto('/')
    const enlace = page.getByRole('link', { name: /Makemake/ }).last()
    await expect(enlace).toBeVisible()
    await enlace.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/campo\/makemake$/)
  })

  test('el parpadeo avanza solo y se pausa con la barra espaciadora (RF-11, RNF-04)', async ({
    page,
  }) => {
    await sinRedExterna(page)
    const errores = vigilarErrores(page)
    await abrirMakemake(page)

    const primera = await fecha(page).textContent()
    await expect(fecha(page)).not.toHaveText(primera!, { timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()

    await page.locator('body').press(' ')
    await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible()
    const quieta = await fecha(page).textContent()
    await page.waitForTimeout(1200)
    await expect(fecha(page)).toHaveText(quieta!)
    expect(errores).toEqual([])
  })

  test('las flechas pasan de a una época y el marcador de Makemake la sigue (RF-11, RF-14)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await sinRedExterna(page)
    await abrirMakemake(page)

    await expect(fecha(page)).toHaveText('9 de jun de 2026, 09:44 UTC')
    const marcador = page.getByRole('button', {
      name: /^Makemake, posición por efeméride de Horizons/,
    })
    await expect(marcador).toBeVisible()
    const antes = await marcador.boundingBox()

    await page.getByRole('group', { name: /Visor del campo Makemake/ }).click()
    await page.keyboard.press('ArrowRight')
    await expect(fecha(page)).toHaveText('9 de jun de 2026, 21:08 UTC')
    const despues = await marcador.boundingBox()
    expect(Math.hypot(despues!.x - antes!.x, despues!.y - antes!.y)).toBeGreaterThan(5)

    await page.keyboard.press('ArrowLeft')
    await expect(fecha(page)).toHaveText('9 de jun de 2026, 09:44 UTC')
  })

  test('la vista de diferencia conserva la época y explica sus colores (RF-12)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await sinRedExterna(page)
    await abrirMakemake(page)
    await page.getByRole('button', { name: 'Época siguiente' }).click()
    const visible = await fecha(page).textContent()

    await page.getByRole('radio', { name: /^Diferencia/ }).check()

    await expect(fecha(page)).toHaveText(visible!)
    await expect(page.getByRole('img', { name: /Diferencia: época del/ })).toBeVisible()
    await expect(page.getByText(/Rojo: más brillo que la mediana/)).toBeVisible()
    await expect(page.getByText('MJy/sr', { exact: false }).first()).toBeVisible()
  })

  test('las estrellas de control de Gaia están apagadas hasta que se piden (RF-14)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await sinRedExterna(page)
    await abrirMakemake(page)
    const gaia = page.getByRole('button', { name: /^Gaia DR3/ })
    await expect(gaia).toHaveCount(0)
    await page.getByRole('checkbox', { name: /estrellas de control/ }).check()
    await expect(gaia.first()).toBeVisible()
  })

  test('la procedencia muestra el archivo de IRSA de la época visible (RF-15)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await sinRedExterna(page)
    await abrirMakemake(page)
    const enlace = page.getByRole('link', { name: /^level2_.*\.fits$/ })
    await expect(enlace).toHaveAttribute('href', /^https:\/\/irsa\.ipac\.caltech\.edu\//)
    await expect(page.getByText(/parte de lo que cambia entre fechas es color/)).toBeVisible()
  })

  test('la comparación con cortina se mueve con el teclado (RF-13)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await sinRedExterna(page)
    await abrirMakemake(page)
    const cortina = page.getByRole('slider', { name: /Posición de la cortina/ })
    await cortina.focus()
    await page.keyboard.press('ArrowRight')
    await expect(cortina).toHaveValue('0.51')
    await page.getByRole('radio', { name: 'Lado a lado' }).check()
    await expect(page.getByRole('img', { name: /: A · / })).toBeVisible()
    await expect(page.getByRole('img', { name: /: B · / })).toBeVisible()
  })

  test('la página «Qué puede y qué no» se abre desde el campo y muestra lo medido (RF-26)', async ({
    page,
  }) => {
    await sinRedExterna(page)
    await abrirMakemake(page)
    await page.getByRole('link', { name: 'Qué puede y qué no puede mostrar este visor' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Qué puede y qué no' })).toBeVisible()
    await expect(
      page.getByText(/Makemake \(Makemake\): su posición esperada según Horizons/),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: /Planeta X/ })).toBeVisible()
  })
})

test('sin WebGL, el visor dibuja con canvas 2D y lo avisa (RF-37)', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    // @ts-expect-error: se reemplaza para simular un navegador sin WebGL.
    HTMLCanvasElement.prototype.getContext = function (tipo: string, ...resto: unknown[]) {
      if (tipo === 'webgl2' || tipo === 'webgl') return null
      return original.call(this, tipo, ...(resto as []))
    }
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await sinRedExterna(page)
  const errores = vigilarErrores(page)
  await abrirMakemake(page)
  await expect(
    page.getByText(/no ofrece WebGL: el visor dibuja con canvas 2D/).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Época siguiente' }).click()
  await expect(fecha(page)).toHaveText('9 de jun de 2026, 21:08 UTC')
  expect(errores).toEqual([])
})

test('con WebGL no aparece el aviso de canvas 2D (RF-37)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await abrirMakemake(page)
  await expect(page.getByRole('img', { name: /Imagen: época del/ })).toBeVisible()
  await expect(page.getByText(/no ofrece WebGL/)).toHaveCount(0)
})

test('el idioma se cambia con un control y se recuerda (RNF-06)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('heading', { name: 'Demo fields' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Demo fields' })).toBeVisible()
})

test.describe('celular y proyector (RNF-05)', () => {
  test('a 360 × 640 no hay desplazamiento horizontal', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 360, height: 640 })
    for (const ruta of ['/', '/campo/makemake', '/campo/estrella-de-barnard', '/limites']) {
      await page.goto(ruta)
      await page.waitForLoadState('networkidle')
      if (ruta.startsWith('/campo')) await expect(fecha(page)).toBeVisible()
      const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(ancho, ruta).toBeLessThanOrEqual(360)
    }
    await page.screenshot({ path: 'test-results/campo-360.png', fullPage: false })
  })

  test('a 1920 × 1080 la imagen ocupa más del 60 % del alto y la fecha se lee de lejos', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1920, height: 1080 })
    await abrirMakemake(page)
    const escenario = await page
      .getByRole('group', { name: /Visor del campo Makemake/ })
      .boundingBox()
    expect(escenario!.height / 1080).toBeGreaterThanOrEqual(0.6)
    const tamano = await fecha(page).evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
    expect(tamano).toBeGreaterThanOrEqual(24)
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(desborda).toBe(false)
    await page.screenshot({ path: 'test-results/campo-1920.png' })
  })
})

test.describe('accesibilidad (RNF-03)', () => {
  for (const ruta of ['/', '/campo/makemake', '/limites']) {
    test(`axe no encuentra violaciones serias ni críticas en ${ruta}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(ruta)
      await page.waitForLoadState('networkidle')
      if (ruta.startsWith('/campo')) await expect(fecha(page)).toBeVisible()
      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
      const graves = resultado.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(
        graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([])
    })
  }
})
