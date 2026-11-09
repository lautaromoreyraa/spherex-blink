// Genera src/api/tipos.ts desde el JSON Schema del contrato.
//
// Lo corre `python -m contrato.generar` (o `npm run generar:tipos` si el
// schema ya está al día). Los tipos no se escriben a mano: la única fuente de
// verdad son los modelos Pydantic de contrato/.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'json-schema-to-typescript'

const aqui = dirname(fileURLToPath(import.meta.url))
const origen = resolve(aqui, '../../contrato/esquemas/contrato.schema.json')
const destino = resolve(aqui, '../src/api/tipos.ts')

const esquema = JSON.parse(await readFile(origen, 'utf-8'))

const tipos = await compile(esquema, 'Contrato', {
  bannerComment: [
    '/**',
    ' * Contrato de datos de spherex-blink.',
    ' *',
    ' * Archivo generado por `python -m contrato.generar` desde',
    ' * contrato/esquemas/contrato.schema.json. No editar a mano: cambiar los',
    ' * modelos de contrato/ y volver a generar.',
    ' */',
  ].join('\n'),
  // El schema raíz sólo agrupa los modelos en $defs; sin esto,
  // json-schema-to-typescript no emite los que nadie referencia.
  unreachableDefinitions: true,
  additionalProperties: false,
  format: true,
  style: { singleQuote: true, semi: false, endOfLine: 'lf' },
})

await writeFile(destino, tipos, 'utf-8')
