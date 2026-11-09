import { defineConfig, devices } from '@playwright/test'

// PUERTO_E2E deja correr las pruebas en otro puerto cuando el 4173 está
// ocupado (por ejemplo, otra rama con su propio `vite preview`): si no, se
// reusaría ese servidor y se probaría otra build.
const puerto = Number(process.env.PUERTO_E2E ?? 4173)

// Las pruebas corren contra la build servida con `vite preview`, que es lo
// mismo que se publica en Cloudflare Pages.
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${puerto}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run preview -- --port ${puerto} --strictPort`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: !process.env.CI,
  },
})
