/**
 * Reconocimientos que el sitio muestra en el pie de todas las páginas
 * (RNF-10). Los textos van en inglés y textuales porque son los que pide cada
 * fuente; no se traducen. Los mismos textos están en CREDITS.md.
 *
 * Origen de cada texto, consultado el 2026-11-08:
 * - SPHEREx: SPHEREx Quick Release Overview de IRSA
 *   (https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html).
 *   Además pide citar el DOI del Quick Release usado; se agrega cuando el
 *   pipeline fije la versión de los datos (H2, TAR-07).
 * - IRSA: «Acknowledging IRSA» (https://irsa.ipac.caltech.edu/ack.html).
 * - SkyBoT: página del servicio en IMCCE (https://ssp.imcce.fr/webservices/skybot/).
 * - JPL Horizons: referencia que da el manual de Horizons
 *   (https://ssd.jpl.nasa.gov/horizons/manual.html#ack). La fecha de consulta
 *   de cada campo está en `conocidos[].consultado_en`.
 * - SIMBAD: documentación de CDS (https://cdsxmatch.cds.unistra.fr/xmatch/doc/simbad-ack.html).
 *
 * TAR-07 revisa los términos de redistribución de cada fuente antes de
 * publicar los campos; si cambia algún texto, se cambia acá y en CREDITS.md.
 */
export interface Reconocimiento {
  fuente: string
  enlace: string
  texto: string
}

export const reconocimientos: readonly Reconocimiento[] = [
  {
    fuente: 'SPHEREx',
    enlace: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
    texto:
      'This publication makes use of data products from the Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer (SPHEREx), which is a joint project of the Jet Propulsion Laboratory and the California Institute of Technology, and is funded by the National Aeronautics and Space Administration.',
  },
  {
    fuente: 'IRSA',
    enlace: 'https://irsa.ipac.caltech.edu/',
    texto:
      'This research has made use of the NASA/IPAC Infrared Science Archive, which is funded by the National Aeronautics and Space Administration and operated by the California Institute of Technology.',
  },
  {
    fuente: 'SkyBoT',
    enlace: 'https://ssp.imcce.fr/webservices/skybot/',
    texto: 'This research has made use of LTE SkyBoT VO tool.',
  },
  {
    fuente: 'JPL Horizons',
    enlace: 'https://ssd.jpl.nasa.gov/horizons/',
    texto:
      'Giorgini, JD and JPL Solar System Dynamics Group, NASA/JPL Horizons On-Line Ephemeris System, https://ssd.jpl.nasa.gov/horizons/.',
  },
  {
    fuente: 'SIMBAD',
    enlace: 'https://simbad.cds.unistra.fr/',
    texto: 'This research has made use of the SIMBAD database, operated at CDS, Strasbourg, France.',
  },
]
