import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Pie from '../../layout/Pie.tsx'

describe('Pie', () => {
  const html = renderToStaticMarkup(createElement(Pie))

  it.each([
    'SPHEREx',
    'NASA/IPAC Infrared Science Archive',
    'SkyBoT',
    'JPL Horizons',
    'SIMBAD',
    'Gaia',
    'Solar System Scope',
  ])(
    'reconoce a %s',
    (fuente) => {
      expect(html).toContain(fuente)
    },
  )
})
