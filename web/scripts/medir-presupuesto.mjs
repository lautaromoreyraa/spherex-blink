// Mide la build contra el presupuesto de RNF-13 y falla si se pasa:
// JS inicial ≤ 200 KB gzip, chunk de la escena 3D ≤ 600 KB gzip y texturas
// de la escena ≤ 8 MB. Se corre después de `npm run build`.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const KB = 1024
const PRESUPUESTO = {
  inicial: 200 * KB,
  escena3d: 600 * KB,
  texturas: 8 * KB * KB,
}

const dist = new URL('../dist/', import.meta.url)
const publico = new URL('../public/', import.meta.url)

const gz = (archivo) => gzipSync(readFileSync(new URL(archivo, dist))).length

// JS inicial: el módulo de entrada y lo que index.html precarga.
const html = readFileSync(new URL('index.html', dist), 'utf8')
const iniciales = [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((m) => m[1])
const inicial = iniciales.reduce((total, archivo) => total + gz(archivo), 0)

const chunks3d = readdirSync(new URL('assets/', dist)).filter((a) => /^EscenaEspacial-.*\.js$/.test(a))
const escena3d = chunks3d.reduce((total, archivo) => total + gz(`assets/${archivo}`), 0)

function pesoDeCarpeta(url) {
  let total = 0
  for (const nombre of readdirSync(url)) {
    const info = statSync(new URL(nombre, url))
    total += info.isDirectory() ? pesoDeCarpeta(new URL(`${nombre}/`, url)) : info.size
  }
  return total
}
const texturas = pesoDeCarpeta(new URL('texturas/', publico)) + pesoDeCarpeta(new URL('escena/', publico))

const filas = [
  ['JS inicial (gzip)', inicial, PRESUPUESTO.inicial, iniciales.join(', ')],
  ['Chunk de la escena 3D (gzip)', escena3d, PRESUPUESTO.escena3d, chunks3d.join(', ')],
  ['Texturas e imagen fija', texturas, PRESUPUESTO.texturas, 'public/texturas, public/escena'],
]

let pasado = false
for (const [nombre, medido, tope, detalle] of filas) {
  const ok = medido <= tope
  pasado ||= !ok
  console.log(
    `${ok ? 'ok  ' : 'PASA'} ${nombre}: ${(medido / KB).toFixed(1)} KB de ${(tope / KB).toFixed(0)} KB (${detalle})`,
  )
}
if (chunks3d.length === 0) {
  console.error('No se encontró el chunk de la escena 3D: ¿dejó de cargarse con React.lazy?')
  process.exit(1)
}
if (pasado) process.exit(1)
