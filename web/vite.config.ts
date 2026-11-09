import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { leerCabeceras } from './src/util/cabeceras.ts'

// `vite preview` sirve las cabeceras de public/_headers, las mismas que pone
// Cloudflare Pages: así las pruebas e2e corren bajo la CSP real (RNF-08). En
// `vite dev` no, porque el recargado en caliente necesita scripts en línea.
const cabeceras =
  leerCabeceras(readFileSync(new URL('./public/_headers', import.meta.url), 'utf-8')).get('/*') ??
  {}

export default defineConfig({
  plugins: [react()],
  preview: {
    headers: cabeceras,
  },
  test: {
    // La lógica pura se prueba en Node; las pruebas en navegador son las de
    // Playwright (e2e/), que Vitest no tiene que levantar.
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
})
