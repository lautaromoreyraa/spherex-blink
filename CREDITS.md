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
| [SIMBAD](https://simbad.cds.unistra.fr/) (CDS, Estrasburgo) | Estrellas de catálogo y su movimiento propio |

### Reconocimientos

Son los textos que pide cada fuente, consultados el 2026-11-08. El sitio los
muestra en el pie de todas las páginas (`web/src/layout/reconocimientos.ts`).

- **SPHEREx**
  ([SPHEREx Quick Release Overview](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html)):
  «This publication makes use of data products from the Spectro-Photometer
  for the History of the Universe, Epoch of Reionization and Ices Explorer
  (SPHEREx), which is a joint project of the Jet Propulsion Laboratory and the
  California Institute of Technology, and is funded by the National
  Aeronautics and Space Administration.» Además se cita el DOI del Quick
  Release usado (QR1 10.26131/IRSA629, QR2 10.26131/IRSA652, QR3
  10.26131/IRSA662), que se fija cuando el pipeline elija la versión de los
  datos.
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

Los términos para redistribuir recortes procesados de IRSA se citan acá con su
enlace antes de publicar los campos de la demo.

## Código de terceros

| Repositorio | Licencia | Archivos de este repo que lo adaptan |
|---|---|---|
| [Caltech-IPAC/irsa-tutorials](https://github.com/Caltech-IPAC/irsa-tutorials), `tutorials/spherex/` | BSD-3-Clause | Ninguno todavía |
| [mateibut/SPHEREx](https://github.com/mateibut/SPHEREx) (y su fork [Andrei25Ciuta/SPHEREx](https://github.com/Andrei25Ciuta/SPHEREx)), `backend/spherex/` | MIT | Ninguno todavía |

Cuando un módulo adapte código de alguno de estos repos, la fila se completa
con la ruta del archivo de este repo y la del original.

## Librerías

Se usan como dependencias, sin modificarlas.

| Librería | Licencia | Uso |
|---|---|---|
| [Pydantic](https://github.com/pydantic/pydantic) | MIT | Modelos del contrato y exportación a JSON Schema |
| [FastAPI](https://github.com/fastapi/fastapi) y [Uvicorn](https://github.com/encode/uvicorn) | MIT · BSD-3-Clause | API del modo en vivo |
| [jsonschema](https://github.com/python-jsonschema/jsonschema) | MIT | Validación de los archivos generados contra el schema |
| [React](https://github.com/facebook/react) | MIT | Interfaz web |
| [Vite](https://github.com/vitejs/vite) | MIT | Build de la web |
| [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) | MIT | Tipos TS generados desde el contrato |
