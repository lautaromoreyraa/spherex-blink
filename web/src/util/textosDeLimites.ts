/**
 * Contenido de la página «Qué puede y qué no» (RF-26), en los dos idiomas.
 *
 * Cada cifra lleva su fuente en la misma sección. Lo que mide esta
 * herramienta sobre los campos de la demo no está acá: la página lo calcula
 * de `campo.json` y lo rotula «medido por esta herramienta».
 */
import type { Idioma } from './textos.ts'

export interface Fuente {
  texto: string
  enlace: string
}

export interface SeccionDeLimites {
  id: string
  titulo: string
  parrafos: string[]
  fuentes: Fuente[]
}

export interface TextosDeLimites {
  titulo: string
  bajada: string
  medidoTitulo: string
  medidoIntro: string
  medidoCuerpo: string
  medidoEstrella: string
  medidoAvisos: string
  medidoSinDatos: string
  fuentesTitulo: string
  secciones: SeccionDeLimites[]
}

const IRSA_SPHEREX: Fuente = {
  texto: 'IRSA · SPHEREx',
  enlace: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
}
const IRSA_QR: Fuente = {
  texto: 'IRSA · SPHEREx Quick Release Overview',
  enlace: 'https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html',
}
const TUTORIALES: Fuente = {
  texto: 'IRSA tutorials (spherex_intro, spherex_cutouts)',
  enlace: 'https://github.com/Caltech-IPAC/irsa-tutorials',
}
const MATEIBUT: Fuente = {
  texto: 'mateibut/SPHEREx (docs/IRSA_FACTS.md, docs/VALIDATION.md)',
  enlace: 'https://github.com/mateibut/SPHEREx',
}
const HORIZONS: Fuente = {
  texto: 'NASA/JPL Horizons',
  enlace: 'https://ssd.jpl.nasa.gov/horizons/',
}
const SIMBAD: Fuente = { texto: 'SIMBAD (CDS)', enlace: 'https://simbad.cds.unistra.fr/' }
const PROPIO: Fuente = {
  texto: 'spherex-blink (código abierto)',
  enlace: 'https://github.com/lautaromoreyraa/spherex-blink',
}
const PROPIO_EN: Fuente = { ...PROPIO, texto: 'spherex-blink (open source)' }

const es: TextosDeLimites = {
  titulo: 'Qué puede y qué no',
  bajada:
    'Cómo se hicieron las imágenes que muestra el visor, qué se puede ver en ellas y qué no, y por qué. Sin promesas: cada número dice de dónde sale.',
  medidoTitulo: 'Lo que midió esta herramienta en los campos de la demo',
  medidoIntro:
    'Medido por esta herramienta: sale de los archivos de cada campo, generados por el pipeline con los datos de IRSA. Los límites de detección medidos inyectando objetos falsos (RF-27) todavía no están; cuando estén, van acá.',
  medidoCuerpo:
    '{nombre} ({campo}): su posición esperada según {fuente} se corre {px} píxeles ({arcsec}″) en {horas} horas. La herramienta midió una fuente a menos de 1 píxel de esa posición en {medidas} de {epocas} épocas, con S/N entre {snrMin} y {snrMax}.',
  medidoEstrella:
    '{nombre} ({campo}): según {fuente}, entre la primera y la última época se corre {px} píxeles ({arcsec}″) en {dias} días.',
  medidoAvisos: 'Avisos del campo {campo}',
  medidoSinDatos: 'No se pudieron leer los campos de la demo.',
  fuentesTitulo: 'Fuentes',
  secciones: [
    {
      id: 'datos',
      titulo: 'De dónde salen las imágenes',
      parrafos: [
        'Todas las imágenes son recortes de imágenes de nivel 2 de SPHEREx, el telescopio infrarrojo de la NASA, bajadas del archivo de IRSA (NASA/IPAC). Cada época del visor dice de qué archivo salió, con su enlace, en «De dónde sale cada imagen». Nada de lo que se ve está simulado.',
        'SPHEREx tiene 6 detectores que cubren de 0,75 a 5 µm, con píxeles de 6,15″. Las imágenes están en MJy/sr y traen la luz zodiacal sin restar; el visor le resta a cada época su fondo mediano para que el parpadeo compare estrellas y no el brillo del fondo.',
      ],
      fuentes: [IRSA_SPHEREX, IRSA_QR, TUTORIALES],
    },
    {
      id: 'cadencia',
      titulo: 'Pasadas y épocas',
      parrafos: [
        'SPHEREx hace 4 mapas de todo el cielo en unos 2 años: pasa por cada punto más o menos cada seis meses. Cada pasada puede tener varias exposiciones del mismo lugar separadas por horas o días. En el visor, cada una de esas exposiciones es una época.',
      ],
      fuentes: [IRSA_SPHEREX, MATEIBUT],
    },
    {
      id: 'mascara',
      titulo: 'Qué píxeles se descartan',
      parrafos: [
        'Cada imagen trae una capa FLAGS que marca los píxeles con problemas. Se descartan los que tienen alguno de los bits 0, 1, 2, 4, 5, 6, 9, 10 u 11 (transitorios, saturados, fantasmas, calientes, fríos, sin dato…). Los bits 12 y 21 son informativos y no se descartan: el 21 está prendido en casi toda la imagen. Los píxeles descartados se ven en un verde azulado liso, que no está en ningún mapa de color del visor.',
        'Cada época se reproyecta a una rejilla común con el norte arriba, para que una estrella quieta caiga en el mismo píxel en todas las fechas. La alineación se comprueba midiendo estrellas fijas de Gaia DR3 en cada época.',
      ],
      fuentes: [MATEIBUT, TUTORIALES],
    },
    {
      id: 'longitud-de-onda',
      titulo: 'La longitud de onda cambia entre épocas',
      parrafos: [
        'SPHEREx es un espectrofotómetro: la longitud de onda que ve cada píxel depende de dónde cae en el detector. Dos fotos del mismo lugar con el mismo detector pueden haberlo visto en colores distintos. Por eso una diferencia entre fechas puede mostrar estrellas quietas que cambian de brillo sólo porque se las vio en otro color. Cuando la diferencia entre épocas supera 0,05 µm, el campo lo avisa.',
      ],
      fuentes: [TUTORIALES, IRSA_SPHEREX],
    },
    {
      id: 'saturacion',
      titulo: 'Las estrellas brillantes saturan',
      parrafos: [
        'Una estrella muy brillante llena los píxeles del centro: quedan marcados en FLAGS y se descartan. En la Estrella de Barnard, entre el 24 % y el 84 % de los píxeles del núcleo tienen los bits 0 a 2. Su posición entonces no se mide: el marcador es la del catálogo SIMBAD con su movimiento propio (10,4″ por año, unos 1,7 píxeles).',
      ],
      fuentes: [MATEIBUT, SIMBAD],
    },
    {
      id: 'sistema-solar',
      titulo: 'Por qué el Sistema Solar se mira dentro de una pasada',
      parrafos: [
        'Entre una pasada y la siguiente pasan seis meses: un asteroide o Makemake ya se fueron lejos del recorte. Dentro de una misma pasada, en cambio, hay fotos separadas por horas o días, y ahí un cuerpo del Sistema Solar se ve correr sobre estrellas quietas. Makemake, a unas 52 UA, se mueve del orden de 1 a 3″ por hora: varios píxeles por día.',
      ],
      fuentes: [HORIZONS, MATEIBUT],
    },
    {
      id: 'efemeride',
      titulo: 'Makemake se marca por su efeméride',
      parrafos: [
        'El visor marca a Makemake donde JPL Horizons dice que tenía que estar en cada fecha, y la herramienta mide si hay una fuente ahí. No lo encontró a ciegas. Buscar sin saber dónde mirar es mucho más difícil: en 12 imágenes de D1, una búsqueda a ciegas encontró a Makemake como 1 de 38 candidatos, y las mismas imágenes barajadas dieron unos 33 candidatos falsos.',
      ],
      fuentes: [HORIZONS, MATEIBUT],
    },
    {
      id: 'candidatos',
      titulo: 'Qué es un candidato y por qué no prueba nada',
      parrafos: [
        'Un candidato es un grupo de detecciones en 3 o más épocas que encaja con un movimiento. Puede ser un objeto conocido, un rayo cósmico que coincidió, ruido o un cambio de color. Nunca alcanza para afirmar que hay un objeto desconocido: para eso hacen falta más observaciones, de otros telescopios, y un análisis que esta herramienta no hace.',
        'Esta versión todavía no busca candidatos a ciegas. Cuando lo haga, cada candidato va a traer cuántas falsas alarmas se esperan en el campo.',
      ],
      fuentes: [MATEIBUT, PROPIO],
    },
    {
      id: 'planeta-x',
      titulo: 'Por qué un Planeta X está casi seguro fuera del alcance',
      parrafos: [
        'Un planeta lejano brilla con la luz del Sol que refleja: esa luz cae con la cuarta potencia de la distancia (la luz que le llega y la que vuelve). El mismo cuerpo a 500 UA en vez de a 52 UA se vería unas 8.500 veces más débil, casi 10 magnitudes. Makemake, con V ≈ 17, ya está cerca del límite: en el detector D2 aparece sólo en 4 de 7 imágenes, con S/N entre 4 y 8,5.',
        'Con una sola imagen de SPHEREx, un Planeta X casi seguro no se ve. Lo que esta herramienta sí muestra es el método: cómo se delata algo lejano por cuánto se corre entre fechas.',
      ],
      fuentes: [MATEIBUT, PROPIO],
    },
    {
      id: 'creditos',
      titulo: 'Créditos',
      parrafos: [
        'Imágenes de SPHEREx (NASA/JPL-Caltech) del archivo IRSA (NASA/IPAC). Estrellas de SIMBAD (CDS) y Gaia DR3 (ESA/DPAC). Efemérides de JPL Horizons. Los reconocimientos que pide cada fuente están al pie de todas las páginas, y el detalle de código y datos reutilizados, en el archivo CREDITS.md del repositorio.',
      ],
      fuentes: [IRSA_SPHEREX, HORIZONS, SIMBAD, PROPIO],
    },
  ],
}

const en: TextosDeLimites = {
  titulo: 'What it can and cannot do',
  bajada:
    'How the images in the viewer were made, what can and cannot be seen in them, and why. No promises: every number says where it comes from.',
  medidoTitulo: 'What this tool measured in the demo fields',
  medidoIntro:
    'Measured by this tool: taken from each field’s files, generated by the pipeline from IRSA data. Detection limits measured by injecting fake objects (RF-27) are not available yet; they will go here.',
  medidoCuerpo:
    '{nombre} ({campo}): its expected position according to {fuente} moves {px} pixels ({arcsec}″) in {horas} hours. The tool measured a source within 1 pixel of that position in {medidas} of {epocas} epochs, with S/N between {snrMin} and {snrMax}.',
  medidoEstrella:
    '{nombre} ({campo}): according to {fuente}, it moves {px} pixels ({arcsec}″) between the first and last epochs, {dias} days apart.',
  medidoAvisos: 'Notes on the {campo} field',
  medidoSinDatos: 'The demo fields could not be read.',
  fuentesTitulo: 'Sources',
  secciones: [
    {
      id: 'datos',
      titulo: 'Where the images come from',
      parrafos: [
        'Every image is a cutout of a level 2 image from SPHEREx, NASA’s infrared telescope, downloaded from the IRSA archive (NASA/IPAC). Each epoch in the viewer says which file it came from, with a link, under “Where each image comes from”. Nothing on screen is simulated.',
        'SPHEREx has 6 detectors covering 0.75 to 5 µm, with 6.15″ pixels. The images are in MJy/sr and include the zodiacal light; the viewer subtracts each epoch’s median background so that the blink compares stars, not background brightness.',
      ],
      fuentes: [IRSA_SPHEREX, IRSA_QR, TUTORIALES],
    },
    {
      id: 'cadencia',
      titulo: 'Passes and epochs',
      parrafos: [
        'SPHEREx makes 4 maps of the whole sky in about 2 years: it comes back to each spot roughly every six months. Each pass can include several exposures of the same place, hours or days apart. In the viewer, each of those exposures is an epoch.',
      ],
      fuentes: [IRSA_SPHEREX, MATEIBUT],
    },
    {
      id: 'mascara',
      titulo: 'Which pixels are discarded',
      parrafos: [
        'Each image comes with a FLAGS layer marking problem pixels. Pixels with any of bits 0, 1, 2, 4, 5, 6, 9, 10 or 11 (transients, saturated, ghosts, hot, cold, missing data…) are discarded. Bits 12 and 21 are informational and are kept: bit 21 is set almost everywhere. Discarded pixels are shown in flat teal, a colour that is in none of the viewer’s colour maps.',
        'Each epoch is reprojected onto a common north-up grid, so that a still star falls on the same pixel on every date. The alignment is checked by measuring fixed Gaia DR3 stars in every epoch.',
      ],
      fuentes: [MATEIBUT, TUTORIALES],
    },
    {
      id: 'longitud-de-onda',
      titulo: 'The wavelength changes between epochs',
      parrafos: [
        'SPHEREx is a spectrophotometer: the wavelength each pixel sees depends on where it falls on the detector. Two images of the same place with the same detector may have seen it in different colours. So a difference between dates can show still stars changing brightness only because they were seen in another colour. When the epochs differ by more than 0.05 µm, the field says so.',
      ],
      fuentes: [TUTORIALES, IRSA_SPHEREX],
    },
    {
      id: 'saturacion',
      titulo: 'Bright stars saturate',
      parrafos: [
        'A very bright star fills the central pixels: they get flagged and discarded. For Barnard’s Star, between 24 % and 84 % of the core pixels have bits 0 to 2 set. Its position is therefore not measured: the marker is the SIMBAD catalogue position with its proper motion (10.4″ per year, about 1.7 pixels).',
      ],
      fuentes: [MATEIBUT, SIMBAD],
    },
    {
      id: 'sistema-solar',
      titulo: 'Why the Solar System is viewed within one pass',
      parrafos: [
        'Six months go by between one pass and the next: an asteroid or Makemake is long gone from the cutout. Within a single pass, however, there are images hours or days apart, and there a Solar System body can be seen drifting over still stars. Makemake, at about 52 AU, moves roughly 1 to 3″ per hour: several pixels per day.',
      ],
      fuentes: [HORIZONS, MATEIBUT],
    },
    {
      id: 'efemeride',
      titulo: 'Makemake is marked from its ephemeris',
      parrafos: [
        'The viewer marks Makemake where JPL Horizons says it should be on each date, and the tool measures whether there is a source there. It did not find it blindly. Searching without knowing where to look is much harder: on 12 D1 images, a blind search found Makemake as 1 of 38 candidates, and the same images shuffled gave about 33 false candidates.',
      ],
      fuentes: [HORIZONS, MATEIBUT],
    },
    {
      id: 'candidatos',
      titulo: 'What a candidate is and why it proves nothing',
      parrafos: [
        'A candidate is a group of detections in 3 or more epochs consistent with a motion. It may be a known object, a cosmic ray that happened to line up, noise or a colour change. It is never enough to claim that an unknown object exists: that takes more observations, from other telescopes, and an analysis this tool does not do.',
        'This version does not run a blind search for candidates yet. When it does, each candidate will come with the number of false alarms expected in the field.',
      ],
      fuentes: [MATEIBUT, PROPIO_EN],
    },
    {
      id: 'planeta-x',
      titulo: 'Why a Planet X is almost certainly out of reach',
      parrafos: [
        'A distant planet shines with the sunlight it reflects: that light falls with the fourth power of distance (the light that reaches it and the light that comes back). The same body at 500 AU instead of 52 AU would look about 8,500 times fainter, almost 10 magnitudes. Makemake, at V ≈ 17, is already close to the limit: in detector D2 it shows up in only 4 of 7 images, with S/N between 4 and 8.5.',
        'With a single SPHEREx image, a Planet X almost certainly cannot be seen. What this tool does show is the method: how something distant gives itself away by how much it moves between dates.',
      ],
      fuentes: [MATEIBUT, PROPIO_EN],
    },
    {
      id: 'creditos',
      titulo: 'Credits',
      parrafos: [
        'SPHEREx images (NASA/JPL-Caltech) from the IRSA archive (NASA/IPAC). Stars from SIMBAD (CDS) and Gaia DR3 (ESA/DPAC). Ephemerides from JPL Horizons. The acknowledgements each source asks for are at the foot of every page, and the details of reused code and data are in the repository’s CREDITS.md file.',
      ],
      fuentes: [IRSA_SPHEREX, HORIZONS, SIMBAD, PROPIO_EN],
    },
  ],
}

export const TEXTOS_DE_LIMITES: Record<Idioma, TextosDeLimites> = { es, en }
