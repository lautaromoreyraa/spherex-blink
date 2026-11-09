import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { sinRedExterna, vigilarErrores } from './ayudas.ts'

// La escena 3D (RF-34 a RF-36, RNF-13). Headless Chromium dibuja WebGL por
// software, así que el lienzo existe; lo que se mira acá es lo que el DOM
// garantiza: textos, rótulos accesibles, el vuelo y la alternativa sin WebGL.
// Todo corre bajo la CSP de public/_headers: una violación sale como error
// de consola y vigilarErrores la junta.

test.use({ locale: 'es-AR' })

/** La escena 3D ya cargó: los rótulos del lienzo (que sólo se ven) aparecieron. */
const escenaDibujada = (page: Page) =>
  expect(page.locator('.escena__rotulo--campo')).toBeVisible()

const volar = (page: Page) =>
  page.locator('.escena__acciones').getByRole('button', { name: 'Volar al campo Makemake' }).click()

/** El visor de Makemake abierto en su primera época, con el foco adentro (RF-36). */
async function llegoAlVisor(page: Page) {
  await page.waitForURL('**/campo/makemake')
  const fecha = page.locator('[data-prueba="fecha-visible"]')
  await expect(fecha).toHaveText('9 de jun de 2026, 09:44 UTC')
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector('.visor')?.contains(document.activeElement)),
    )
    .toBe(true)
  // Abre quieto: la primera época sigue a la vista un rato después.
  await page.waitForTimeout(1200)
  await expect(fecha).toHaveText('9 de jun de 2026, 09:44 UTC')
}

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
  const errores = vigilarErrores(page)
  await page.goto('/escena/makemake')
  // Las texturas y el lienzo, cargados bajo la CSP.
  await escenaDibujada(page)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('El Sistema Solar en cada pasada')
  await expect(page.getByRole('note')).toContainText('no están a escala')
  await expect(page.getByRole('note')).toContainText('Makemake es una ilustración')
  await expect(page.locator('.escena__fecha')).toContainText('9 de jun de 2026, 09:44 UTC')
  await expect(page.getByText('137,4″')).toBeVisible()
  await expect(page.getByText('22,3 píxeles')).toBeVisible()
  await expect(page.getByText(/Todas las épocas de este campo son de la pasada 3/)).toBeVisible()

  // El control de tiempo cambia la fecha.
  const tiempo = page.getByLabel(/Época 1 de 9/)
  await tiempo.focus()
  await page.keyboard.press('End')
  await expect(page.locator('.escena__fecha')).toContainText('13 de jun de 2026, 11:29 UTC')
  expect(errores).toEqual([])
})

test('cada cuerpo es un botón con nombre accesible que acerca la cámara', async ({ page }) => {
  await page.goto('/escena/makemake')
  await escenaDibujada(page)
  const grupo = page.getByRole('group', { name: 'Acercar la cámara a un cuerpo' })
  for (const nombre of ['Sol', 'Tierra', 'Júpiter', 'Neptuno', 'Makemake (ilustración)']) {
    const boton = grupo.getByRole('button', { name: nombre, exact: true })
    await boton.focus()
    await expect(boton).toBeFocused()
  }
  const tierra = grupo.getByRole('button', { name: 'Tierra', exact: true })
  await tierra.press('Enter')
  await expect(tierra).toHaveAttribute('aria-pressed', 'true')
  // Los rótulos del lienzo sólo se ven: no duplican los botones para el lector.
  await expect(page.locator('.escena__rotulo').first()).toHaveAttribute('aria-hidden', 'true')
})

test('el interruptor de escala real cambia el aviso', async ({ page }) => {
  await page.goto('/escena/makemake')
  const interruptor = page.getByRole('button', { name: 'Escala real' })
  await interruptor.click()
  await expect(interruptor).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('note')).toContainText('Escala real de distancias y tamaños')
})

test('desde la escena se vuela al visor del campo de Makemake', async ({ page }) => {
  const errores = vigilarErrores(page)
  await sinRedExterna(page)
  await page.goto('/escena/makemake')
  await escenaDibujada(page)
  const inicio = Date.now()
  await volar(page)
  await expect(page.getByText('Volando al campo Makemake…')).toBeVisible()
  await page.waitForURL('**/campo/makemake', { timeout: 5000 })
  // 2,4 s de vuelo más el margen de una máquina de CI cargada.
  expect(Date.now() - inicio).toBeLessThan(4500)
  await llegoAlVisor(page)
  expect(errores).toEqual([])
})

test('el vuelo se saltea con Escape y el foco queda en el visor', async ({ page }) => {
  await page.goto('/escena/makemake')
  await volar(page)
  await expect(page.getByRole('button', { name: 'Saltear el vuelo (Esc)' })).toBeFocused()
  const inicio = Date.now()
  await page.keyboard.press('Escape')
  await page.waitForURL('**/campo/makemake')
  expect(Date.now() - inicio).toBeLessThan(1500)
  await llegoAlVisor(page)
})

test.describe('con movimiento reducido', () => {
  test('el vuelo es un corte directo al visor', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/escena/makemake')
    await volar(page)
    await page.waitForURL('**/campo/makemake', { timeout: 1000 })
    await llegoAlVisor(page)
  })
})

test('un campo que no existe se dice «No encontramos ese campo»', async ({ page }) => {
  await page.goto('/escena/no-existe')
  await expect(page.getByRole('alert')).toContainText('No encontramos ese campo')
  await expect(page.getByRole('link', { name: 'Ver la escena de Makemake' })).toBeVisible()
})

test('sin WebGL muestra la imagen fija y no baja la escena 3D', async ({ page }) => {
  await sinWebGL(page)
  const pedidos: string[] = []
  page.on('request', (pedido) => pedidos.push(pedido.url()))
  await page.goto('/escena/makemake')

  await expect(page.getByRole('img', { name: /Captura de la escena/ })).toBeVisible()
  await expect(page.getByText('137,4″')).toBeVisible()
  expect(pedidos.some((url) => /EscenaEspacial-.*\.js/.test(url))).toBe(false)
  await volar(page)
  await llegoAlVisor(page)
})

test('sin WebGL, en otro campo la imagen fija aclara que es la de Makemake', async ({ page }) => {
  await sinWebGL(page)
  await page.goto('/escena/estrella-de-barnard')
  await expect(page.getByText(/escena del campo de Makemake, no la de este campo/)).toBeVisible()
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

test('se llega a la escena desde el inicio y desde el visor de Makemake', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Por qué se mueve Makemake/ }).click()
  await expect(page).toHaveURL(/\/escena\/makemake$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('El Sistema Solar en cada pasada')

  await page.goto('/campo/makemake')
  await page.getByRole('link', { name: 'Ver dónde estaba Makemake en el Sistema Solar' }).click()
  await expect(page).toHaveURL(/\/escena\/makemake$/)
})

test('un campo sin geometría no enlaza a la escena', async ({ page }) => {
  await page.goto('/campo/estrella-de-barnard')
  await expect(page.getByRole('heading', { level: 1, name: 'Estrella de Barnard' })).toBeVisible()
  await expect(page.getByRole('link', { name: /en el Sistema Solar/ })).toHaveCount(0)
})

test.describe('en inglés (RNF-06)', () => {
  test.use({ locale: 'en-GB' })

  test('la escena, el panel y los rótulos salen traducidos', async ({ page }) => {
    await page.goto('/escena/makemake')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Solar System at each pass')
    await expect(page.getByRole('note')).toContainText('not to scale')
    await expect(page.getByRole('note')).toContainText('Makemake is an illustration')
    await expect(page.locator('.escena__fecha')).toContainText('9 Jun 2026, 09:44 UTC')
    await expect(page.getByText('137.4″')).toBeVisible()
    await expect(page.getByText('22.3 pixels')).toBeVisible()
    for (const nombre of ['Sun', 'Earth', 'Jupiter', 'Makemake (illustration)']) {
      await expect(page.getByRole('button', { name: nombre, exact: true })).toBeAttached()
    }
    await expect(page.getByRole('button', { name: 'True scale' })).toBeVisible()
    await page
      .locator('.escena__acciones')
      .getByRole('button', { name: 'Fly to the Makemake field' })
      .click()
    await expect(page.getByRole('button', { name: 'Skip the flight (Esc)' })).toBeFocused()
  })

  test('sin WebGL, el texto alternativo de la imagen fija también', async ({ page }) => {
    await sinWebGL(page)
    await page.goto('/escena/estrella-de-barnard')
    await expect(
      page.getByRole('img', { name: /Capture of the scene of the Makemake field/ }),
    ).toBeVisible()
    await expect(page.getByText(/not the one for this field/)).toBeVisible()
    await expect(page.getByText(/passes 1, 2, and 3/)).toBeVisible()
  })
})

test.describe('accesibilidad de la escena (RNF-03)', () => {
  /** Todas las violaciones de axe, de cualquier gravedad, como texto legible. */
  async function violaciones(page: Page): Promise<string[]> {
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    return resultado.violations.map(
      (v) => `${v.impact}: ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    )
  }

  test('axe no encuentra violaciones en /escena/makemake', async ({ page }) => {
    await page.goto('/escena/makemake')
    await escenaDibujada(page)
    await page.waitForLoadState('networkidle')
    expect(await violaciones(page)).toEqual([])
  })

  test('ni con la escala real ni durante el vuelo', async ({ page }) => {
    await page.goto('/escena/makemake')
    await escenaDibujada(page)
    await page.getByRole('button', { name: 'Escala real' }).click()
    expect(await violaciones(page)).toEqual([])
    await page.getByRole('button', { name: 'Escala real' }).click()
    await volar(page)
    await expect(page.getByRole('button', { name: 'Saltear el vuelo (Esc)' })).toBeFocused()
    expect(await violaciones(page)).toEqual([])
  })

  test('ni sin WebGL, ni en el visor al que llega el vuelo', async ({ page }) => {
    await sinWebGL(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/escena/makemake')
    await expect(page.getByRole('img', { name: /Captura de la escena/ })).toBeVisible()
    expect(await violaciones(page)).toEqual([])
    await volar(page)
    await llegoAlVisor(page)
    // En el visor rige el criterio del visor: nada serio ni crítico.
    const graves = (await violaciones(page)).filter((v) => /^(serious|critical):/.test(v))
    expect(graves).toEqual([])
  })
})
