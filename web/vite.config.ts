import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // La lógica pura se prueba en Node; las pruebas en navegador son las de
    // Playwright (e2e/), que Vitest no tiene que levantar.
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
})
