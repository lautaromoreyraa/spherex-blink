# Créditos

spherex-blink se apoya en datos, código y librerías de otros. Este archivo dice
de quién es cada cosa y con qué licencia se usa. Cada archivo que adapte código
de un tercero conserva además, en su cabecera, el aviso de copyright y la
licencia original.

## Datos

| Fuente | Uso | Reconocimiento |
|---|---|---|
| SPHEREx (NASA/JPL-Caltech), distribuido por [IRSA](https://irsa.ipac.caltech.edu/) (NASA/IPAC Infrared Science Archive) | Imágenes L2 de todas las épocas | Texto de reconocimiento a confirmar con los términos de IRSA |
| [SkyBoT](https://ssp.imcce.fr/webservices/skybot/) (IMCCE) | Cuerpos del Sistema Solar en cada campo y fecha | A confirmar |
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) (NASA/JPL) | Efemérides de cuerpos del Sistema Solar | A confirmar |
| [SIMBAD](https://simbad.cds.unistra.fr/) (CDS, Estrasburgo) | Estrellas de catálogo y su movimiento propio | A confirmar |

Los textos de reconocimiento exactos que piden SPHEREx, IRSA, SkyBoT, JPL y
SIMBAD, y los términos para redistribuir recortes procesados, se citan acá con
su enlace antes de publicar los campos de la demo.

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
