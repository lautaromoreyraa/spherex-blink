// Copia tipada de contrato/ejemplos/*.json. Que este archivo compile prueba
// que los tipos generados aceptan el ejemplo (TAR-03); contrato.test.ts
// verifica que la copia sigue siendo igual al JSON.
import type { Campo, Indice } from '../../api/tipos.ts'

export const indiceDeEjemplo: Indice = {
  version_contrato: '0.2.0',
  generado_en: '2026-11-08T12:00:00Z',
  campos: [
    {
      id: 'ejemplo-estrella-de-barnard',
      nombre: {
        es: 'Ejemplo: Estrella de Barnard',
        en: "Example: Barnard's Star",
      },
      centro: {
        ra: 269.452,
        dec: 4.6934,
      },
      tamano_grados: 0.0833,
      detector: 'D2',
      cantidad_epocas: 3,
      objeto_destacado: 'Estrella de Barnard',
      miniatura: 'campos/ejemplo-estrella-de-barnard/miniatura.webp',
    },
  ],
}

export const campoDeEjemplo: Campo = {
  id: 'ejemplo-estrella-de-barnard',
  nombre: {
    es: 'Ejemplo: Estrella de Barnard',
    en: "Example: Barnard's Star",
  },
  descripcion: {
    es: 'Campo de ejemplo hecho a mano para probar el contrato. No son datos reales.',
    en: 'Hand-made example field to test the contract. Not real data.',
  },
  centro: {
    ra: 269.452,
    dec: 4.6934,
  },
  tamano_grados: 0.0833,
  detector: 'D2',
  rejilla: {
    ancho_px: 49,
    alto_px: 49,
    escala_arcsec_px: 6.15,
    wcs: {
      CTYPE1: 'RA---TAN',
      CTYPE2: 'DEC--TAN',
      CRVAL1: 269.452,
      CRVAL2: 4.6934,
      CRPIX1: 25,
      CRPIX2: 25,
      CDELT1: -0.0017083,
      CDELT2: 0.0017083,
      CUNIT1: 'deg',
      CUNIT2: 'deg',
    },
  },
  estiramiento: {
    tipo: 'asinh',
    minimo: 0.5,
    maximo: 40,
  },
  epocas: [
    {
      id: 'p1-a',
      mjd: 60830.25,
      fecha_utc: '2025-06-08T06:00:00Z',
      pasada: 1,
      fuente: {
        uri: 'https://example.org/ejemplo/level2-d2-p1-a.fits',
        planeid: 'ejemplo-p1-a',
        version_proceso: 'ejemplo',
      },
      longitud_onda_um: 1.42,
      fraccion_mala: 0.03,
      imagen: 'campos/ejemplo-estrella-de-barnard/p1-a.webp',
      diferencia: 'campos/ejemplo-estrella-de-barnard/p1-a-diferencia.webp',
    },
    {
      id: 'p2-a',
      mjd: 61012.5,
      fecha_utc: '2025-12-07T12:00:00Z',
      pasada: 2,
      fuente: {
        uri: 'https://example.org/ejemplo/level2-d2-p2-a.fits',
        planeid: 'ejemplo-p2-a',
        version_proceso: 'ejemplo',
      },
      longitud_onda_um: 1.45,
      fraccion_mala: 0.02,
      imagen: 'campos/ejemplo-estrella-de-barnard/p2-a.webp',
      diferencia: 'campos/ejemplo-estrella-de-barnard/p2-a-diferencia.webp',
    },
    {
      id: 'p3-a',
      mjd: 61195.75,
      fecha_utc: '2026-06-08T18:00:00Z',
      pasada: 3,
      fuente: {
        uri: 'https://example.org/ejemplo/level2-d2-p3-a.fits',
        planeid: 'ejemplo-p3-a',
        version_proceso: 'ejemplo',
      },
      longitud_onda_um: 1.41,
      fraccion_mala: 0.04,
      imagen: 'campos/ejemplo-estrella-de-barnard/p3-a.webp',
      diferencia: 'campos/ejemplo-estrella-de-barnard/p3-a-diferencia.webp',
    },
  ],
  referencia: 'campos/ejemplo-estrella-de-barnard/referencia.webp',
  rastro: null,
  conocidos: [
    {
      nombre: 'Estrella de Barnard',
      tipo: 'estrella',
      posiciones: [
        {
          epoca_id: 'p1-a',
          ra: 269.452,
          dec: 4.6934,
          x: 24,
          y: 24,
          dentro_del_campo: true,
          distancia_ua: null,
        },
        {
          epoca_id: 'p2-a',
          ra: 269.452,
          dec: 4.6948,
          x: 24,
          y: 23.2,
          dentro_del_campo: true,
          distancia_ua: null,
        },
        {
          epoca_id: 'p3-a',
          ra: 269.4519,
          dec: 4.6962,
          x: 24.1,
          y: 22.3,
          dentro_del_campo: true,
          distancia_ua: null,
        },
      ],
      deteccion: [
        { epoca_id: 'p1-a', x: 24.1, y: 24, snr: 52, distancia_px: 0.1 },
        { epoca_id: 'p3-a', x: 24.2, y: 22.4, snr: 48.5, distancia_px: 0.14 },
      ],
      fuente: 'SIMBAD',
      consultado_en: '2026-11-08T12:00:00Z',
      magnitud: {
        valor: 4.52,
        banda: 'K',
      },
    },
  ],
  candidatos: [
    {
      id: 'candidato-1',
      detecciones: [
        {
          epoca_id: 'p1-a',
          x: 24,
          y: 24,
          ra: 269.452,
          dec: 4.6934,
          snr: 41,
        },
        {
          epoca_id: 'p2-a',
          x: 24,
          y: 23.2,
          ra: 269.452,
          dec: 4.6948,
          snr: 39.5,
        },
        {
          epoca_id: 'p3-a',
          x: 24.1,
          y: 22.3,
          ra: 269.4519,
          dec: 4.6962,
          snr: 40.2,
        },
      ],
      velocidad_arcsec_h: 0.00119,
      angulo_posicion_grados: 355,
      residuo_arcsec: 0.4,
      falsas_alarmas_esperadas: 0.001,
      identificacion: {
        estado: 'conocido',
        nombre: 'Estrella de Barnard',
        distancia_arcsec: 0.6,
      },
    },
  ],
  geometria: null,
  limites: {
    umbral_sigma: 5,
    profundidad_5sigma: {
      mjy_sr: 0.12,
      magnitud: null,
    },
    recuperacion: [
      {
        brillo: 0.1,
        fraccion_recuperada: 0.05,
      },
      {
        brillo: 0.2,
        fraccion_recuperada: 0.4,
      },
      {
        brillo: 0.4,
        fraccion_recuperada: 0.85,
      },
      {
        brillo: 0.8,
        fraccion_recuperada: 0.97,
      },
      {
        brillo: 1.6,
        fraccion_recuperada: 1,
      },
    ],
  },
  avisos: [
    {
      es: 'Ejemplo: la longitud de onda central cambia hasta 0,04 µm entre épocas.',
      en: 'Example: the central wavelength changes by up to 0.04 µm between epochs.',
    },
  ],
  creditos:
    'Ejemplo hecho a mano. Los campos reales citan a IRSA/SPHEREx y a los catálogos usados.',
  procedencia: {
    version_pipeline: '0.1.0',
    irsa_consultado_en: '2026-11-08T12:00:00Z',
  },
}
