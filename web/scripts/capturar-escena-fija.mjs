// Captura la escena 3D del campo de Makemake para la imagen fija que se
// muestra sin WebGL (RNF-13). Uso, con la build servida:
//
//   npm run build && npm run preview -- --port 4173
//   node scripts/capturar-escena-fija.mjs [http://localhost:4173] [public/escena/escena-fija.jpg]
//
// La imagen sale de la escena real, así que hay que volver a capturarla si
// cambia lo que la escena dibuja.
import { chromium } from '@playwright/test'

const base = process.argv[2] ?? 'http://localhost:4173'
const salida = process.argv[3] ?? 'public/escena/escena-fija.jpg'

const navegador = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
try {
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1 })
  await pagina.goto(`${base}/escena/makemake`, { waitUntil: 'networkidle' })
  const lienzo = pagina.locator('.escena__lienzo canvas')
  await lienzo.waitFor()
  // Tiempo para que lleguen las texturas y se asiente la cámara.
  await pagina.waitForTimeout(2500)
  await pagina.locator('.escena__lienzo').screenshot({ path: salida, type: 'jpeg', quality: 82 })
  console.log(`Imagen fija guardada en ${salida}`)
} finally {
  await navegador.close()
}
