# Créditos

spherex-blink se apoya en datos, código y librerías de otros. Este archivo dice
de quién es cada cosa y con qué licencia se usa. Cada archivo que adapte código
de un tercero conserva además, en su cabecera, el aviso de copyright y la
licencia original.

## Datos

| Fuente | Uso |
|---|---|
| SPHEREx (NASA/JPL-Caltech), distribuido por [IRSA](https://irsa.ipac.caltech.edu/) | Imágenes L2 de todas las épocas |
| [SkyBoT](https://ssp.imcce.fr/webservices/skybot/) (IMCCE) | Cuerpos del Sistema Solar en cada campo y fecha |
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) (NASA/JPL) | Efemérides de cuerpos del Sistema Solar |
| [SIMBAD](https://simbad.cds.unistra.fr/) (CDS, Estrasburgo) | La Estrella de Barnard y su movimiento propio |
| [Gaia DR3](https://www.cosmos.esa.int/gaia) (ESA/DPAC), servido por IRSA (`gaia_dr3_source`) | Estrellas fijas con las que se controla la alineación de cada época |

### Texturas de la escena 3D

| Fuente | Licencia | Archivos | Uso |
|---|---|---|---|
| [Solar System Scope](https://www.solarsystemscope.com/textures/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), confirmada en su página el 2026-11-08 | `web/public/texturas/*.webp` | Sol, planetas, anillos de Saturno y fondo de estrellas con la Vía Láctea. Se bajaron las versiones 2K (`2k_sun.jpg`, `2k_mercury.jpg`, `2k_venus_atmosphere.jpg`, `2k_earth_daymap.jpg`, `2k_mars.jpg`, `2k_jupiter.jpg`, `2k_saturn.jpg`, `2k_saturn_ring_alpha.png`, `2k_uranus.jpg`, `2k_neptune.jpg`, `2k_stars_milky_way.jpg`) y se convirtieron a WebP, algunas reducidas a 1024 px de ancho |
| Idem, colección «Fictional» | CC BY 4.0 | `web/public/texturas/makemake-ilustracion.webp` (de `2k_makemake_fictional.jpg`) | Superficie de Makemake. **Es inventada**: no hay fotos de su superficie, y la escena la rotula como ilustración |

La imagen fija de la escena (`web/public/escena/escena-fija.jpg`), que se
muestra sin WebGL, es una captura de la propia escena con esas texturas
(`web/scripts/capturar-escena-fija.mjs`).

Los elementos orbitales con los que se dibuja la órbita de Makemake y los
vectores con los que se prueban las efemérides de la escena salen de JPL
Horizons (consultados el 2026-11-09).

### Reconocimientos

Son los textos que pide cada fuente, consultados el 2026-11-08. El sitio los
muestra en el pie de todas las páginas (`web/src/layout/reconocimientos.ts`).

- **SPHEREx**
  ([SPHEREx Quick Release Overview](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html)):
  «This publication makes use of data products from the Spectro-Photometer
  for the History of the Universe, Epoch of Reionization and Ices Explorer
  (SPHEREx), which is a joint project of the Jet Propulsion Laboratory and the
  California Institute of Technology, and is funded by the National
  Aeronautics and Space Administration.» Además se cita el DOI de cada Quick
  Release usado: los campos de la demo usan QR2 (10.26131/IRSA652) y QR3
  (10.26131/IRSA662); la URI de cada época dice de cuál salió.
- **IRSA** ([Acknowledging IRSA](https://irsa.ipac.caltech.edu/ack.html)):
  «This research has made use of the NASA/IPAC Infrared Science Archive, which
  is funded by the National Aeronautics and Space Administration and operated
  by the California Institute of Technology.»
- **SkyBoT** ([SkyBoT, IMCCE](https://ssp.imcce.fr/webservices/skybot/)):
  «This research has made use of LTE SkyBoT VO tool», o la cita de Berthier et
  al. 2006, ASPC 351, 367 (2006ASPC..351..367B).
- **JPL Horizons** ([manual de Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html#ack)):
  «Giorgini, JD and JPL Solar System Dynamics Group, NASA/JPL Horizons On-Line
  Ephemeris System, <https://ssd.jpl.nasa.gov/horizons/>, data retrieved
  YYYY-MON-DD.» La fecha de consulta de cada campo queda en
  `conocidos[].consultado_en`.
- **SIMBAD** ([CDS](https://cdsxmatch.cds.unistra.fr/xmatch/doc/simbad-ack.html)):
  «This research has made use of the SIMBAD database, operated at CDS,
  Strasbourg, France», con la cita de Wenger et al. 2000, A&AS 143, 9.
- **Gaia** ([ESA](https://www.cosmos.esa.int/web/gaia-users/credits)): «This
  work has made use of data from the European Space Agency (ESA) mission Gaia
  (https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing and
  Analysis Consortium (DPAC,
  https://www.cosmos.esa.int/web/gaia/dpac/consortium). Funding for the DPAC
  has been provided by national institutions, in particular the institutions
  participating in the Gaia Multilateral Agreement.»

### Términos de uso

Según los [términos de uso de IRSA](https://irsa.ipac.caltech.edu/data_use_terms.html)
(consultados el 2026-11-08), la mayoría de los datos de IRSA son públicos y no
tienen restricciones de uso; lo que se pide es el reconocimiento y la cita que
indica [Acknowledging IRSA](https://irsa.ipac.caltech.edu/ack.html). Por eso
los recortes procesados de `web/public/datos/` se publican con los
reconocimientos de arriba, que el sitio muestra en su pie.

## Código de terceros

Cada archivo que adapta código conserva en su cabecera el origen, el aviso de
copyright y la licencia.

| Repositorio | Licencia | Qué se tomó | Archivo de este repo |
|---|---|---|---|
| [Caltech-IPAC/irsa-tutorials](https://github.com/Caltech-IPAC/irsa-tutorials), `tutorials/spherex/spherex_cutouts.md` (Copyright (c) 2022-2026 California Institute of Technology) | BSD-3-Clause | La consulta ADQL sobre `spherex.plane` + `spherex.artifact` | `core/observaciones.py` |
| Idem, `spherex_cutouts.md` | BSD-3-Clause | La URL del recorte en el servidor (`?center=…d&size=…d`) y la descarga en paralelo con 7 a 12 pedidos | `core/recortes.py` |
| Idem, `spherex_intro.md` | BSD-3-Clause | La longitud de onda por píxel con la WCS alternativa «W» sin SIP | `core/recortes.py` |
| [mateibut/SPHEREx](https://github.com/mateibut/SPHEREx), `backend/spherex/flags.py` (Copyright (c) 2026 mateibut) | MIT | La lista de bits malos de FLAGS y la regla de no enmascarar «cualquier bit» | `core/mascara.py` |
| Idem, `backend/spherex/stretch.py` | MIT | Fondo mediano restado por época y una escala asinh común (percentiles 1 y 99,7, a = 0,1) | `core/estiramiento.py` |
| Idem, `backend/spherex/photometry.py` | MIT | Fotometría de apertura con fondo y error del anillo | `core/medicion.py` |
| Idem, `backend/spherex/cutout.py` | MIT | La rejilla TAN norte arriba con el píxel nativo | `core/rejilla.py` |
| Idem, `backend/spherex/query.py` | MIT | La lectura de la longitud de onda central del recorte (misma receta de IRSA) | `core/recortes.py` |

Andrei25Ciuta/SPHEREx es un fork de mateibut/SPHEREx: el crédito va al
original. De los equipos que compiten en el mismo desafío no se tomó código.

## Librerías

Se usan como dependencias, sin modificarlas.

| Librería | Licencia | Uso |
|---|---|---|
| [Pydantic](https://github.com/pydantic/pydantic) | MIT | Modelos del contrato y exportación a JSON Schema |
| [FastAPI](https://github.com/fastapi/fastapi) y [Uvicorn](https://github.com/encode/uvicorn) | MIT · BSD-3-Clause | API del modo en vivo |
| [jsonschema](https://github.com/python-jsonschema/jsonschema) | MIT | Validación de los archivos generados contra el schema |
| [Astropy](https://github.com/astropy/astropy) | BSD-3-Clause | FITS, WCS, VOTable, coordenadas y movimiento propio (`apply_space_motion`) |
| [reproject](https://github.com/astropy/reproject) | BSD-3-Clause | Reproyección de cada época a la rejilla común |
| [photutils](https://github.com/astropy/photutils) | BSD-3-Clause | Centroide de las fuentes medidas |
| [NumPy](https://github.com/numpy/numpy) y [SciPy](https://github.com/scipy/scipy) | BSD-3-Clause | Cálculo numérico |
| [Pillow](https://github.com/python-pillow/Pillow) | MIT-CMU | Exportación a WebP |
| [httpx2](https://github.com/pydantic/httpx2) | BSD-3-Clause | Pedidos HTTP a IRSA, SIMBAD y Horizons |
| [React](https://github.com/facebook/react) | MIT | Interfaz web |
| [Vite](https://github.com/vitejs/vite) | MIT | Build de la web |
| [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) | MIT | Tipos TS generados desde el contrato |
| [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) | MPL-2.0 | Revisión de accesibilidad en las pruebas e2e (sólo desarrollo) |
| [three.js](https://github.com/mrdoob/three.js) | MIT | Escena 3D del Sistema Solar |
| [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) y [@react-three/drei](https://github.com/pmndrs/drei) | MIT | La escena 3D como componentes de React: rótulos en el DOM, controles de cámara, `PerformanceMonitor` |
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | MIT | Posición de los planetas en la fecha de cada época, en el navegador |

## Tipografías y mapas de color

| Recurso | Licencia | Uso |
|---|---|---|
| [IBM Plex Sans y IBM Plex Mono](https://github.com/IBM/plex), empaquetadas por [Fontsource](https://github.com/fontsource/font-files) | SIL Open Font License 1.1 | Tipografía de la web, servida desde el propio sitio |
| Mapa inferno de [matplotlib](https://github.com/matplotlib/matplotlib) (Nathaniel J. Smith y Stéfan van der Walt) | CC0 | Mapa de color por defecto del visor (`web/src/util/mapasDeColor.ts`) |
| Mapa cividis de matplotlib (Nuñez, Anderton y Renslow 2018, PLOS ONE 13(7): e0199239) | Licencia de Matplotlib (compatible con BSD) | Mapa de color que se lee igual con daltonismo |
| Mapa berlin de las [Scientific colour maps](https://www.fabiocrameri.ch/colourmaps/) de Fabio Crameri (doi:10.5281/zenodo.1243862), tomado de matplotlib | MIT | Escala divergente de la diferencia y de la resta |
