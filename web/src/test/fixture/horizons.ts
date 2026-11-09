/**
 * Vectores heliocéntricos grabados de la API de JPL Horizons el 2026-11-09
 * (CENTER 500@10, REF_PLANE ECLIPTIC, REF_SYSTEM ICRF, VEC_TABLE 1, AU-D,
 * TIME_TYPE UT), sin corrección por tiempo de luz: el mismo pedido que hace
 * `core/efemerides.py` para `geometria`. Las fechas son la primera época de
 * cada campo de la demo.
 */
export interface VectorGrabado {
  fecha: string
  x: number
  y: number
  z: number
}

export const vectoresDeHorizons: Record<'tierra' | 'jupiter' | 'marte' | 'saturno', VectorGrabado[]> = {
  tierra: [
    { fecha: '2025-08-27T05:06:02Z', x: 9.069474470438225e-1, y: -4.453186279223939e-1, z: 2.316902628405422e-5 },
    { fecha: '2026-06-09T09:44:15Z', x: -2.072358311679379e-1, y: -9.937019529004449e-1, z: 5.952905598756419e-5 },
  ],
  jupiter: [
    { fecha: '2025-08-27T05:06:02Z', x: -7.537964266888555e-1, y: 5.11043031255883, z: -4.363455811916652e-3 },
    { fecha: '2026-06-09T09:44:15Z', x: -2.792254717679318, y: 4.46776770419801, z: 4.391367509598722e-2 },
  ],
  marte: [
    { fecha: '2025-08-27T05:06:02Z', x: -1.2836367086484, y: -9.295711150110288e-1, z: 1.199754575769643e-2 },
    { fecha: '2026-06-09T09:44:15Z', x: 1.307359100641765, y: 5.526955887548674e-1, z: -2.047476178421873e-2 },
  ],
  saturno: [
    { fecha: '2025-08-27T05:06:02Z', x: 9.53990451139356, y: -4.479261504702547e-1, z: -3.719415556018668e-1 },
    { fecha: '2026-06-09T09:44:15Z', x: 9.392014330186321, y: 1.142241901623662, z: -3.937509285427074e-1 },
  ],
}
