# spherex-blink

Herramienta web para ver cómo cambia el cielo infrarrojo entre las pasadas del
telescopio espacial SPHEREx sobre una misma región, y encontrar en esas
imágenes objetos que se mueven: estrellas cercanas con movimiento propio alto,
cuerpos del Sistema Solar y, como horizonte, un planeta lejano todavía no
descubierto. Usa datos reales del archivo de IRSA y muestra **candidatos**,
nunca descubrimientos. Es la base del proyecto para el desafío «Planet X and
SPHEREx» de NASA Space Apps 2026.

Este README explica el sistema con diagramas: primero el contexto y las
piezas, después cómo viajan los datos, y al final cómo se despliega y cómo se
trabaja.

## Qué está hecho y qué es objetivo

El repo tiene hoy el visor (hito **H3**) sobre los datos reales de H2 y el
esqueleto de H1: el contrato de datos completo, `core` con todas las etapas
que bajan y procesan las imágenes de SPHEREx, `pipeline` con los dos campos de
la demo (la Estrella de Barnard y Makemake) ya generados en
`web/public/datos/`, `api` con `GET /salud`, la web con la lista de campos, el
visor en WebGL (parpadeo, diferencia, apilado, rastro, comparación de dos
fechas, objetos conocidos, procedencia, zoom y coordenadas), la página «Qué
puede y qué no», español e inglés, y la verificación continua. La escena 3D,
la búsqueda de objetos y el modo en vivo son el **objetivo** de los hitos H4 y
H5 y salen del plan del proyecto y de la especificación de requisitos.

Los diagramas usan la misma leyenda:

```mermaid
flowchart LR
    H["Implementado (H1 a H3)"]:::hecho
    O["Objetivo (H4 en adelante)"]:::objetivo
    E[("Sistema externo")]:::externo

    classDef hecho fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
    classDef objetivo fill:#f1f3f5,stroke:#868e96,stroke-dasharray:5 3,color:#495057
    classDef externo fill:#e7f0ff,stroke:#4c6ef5,color:#1c3d8f
```

En los diagramas de secuencia, los tramos objetivo van dentro de un recuadro
gris rotulado con su hito.

## Módulos

| Módulo | Responsabilidad | Stack | Estado |
|---|---|---|---|
| `contrato/` | Forma de los datos: única fuente de verdad para pipeline, API y web | Python 3.12, Pydantic → JSON Schema → json-schema-to-typescript | Completo |
| `core/` | Toda la lógica que toca datos: consultas a IRSA, máscaras, rejilla común, diferencias, objetos conocidos, búsqueda | Python 3.12, astropy, photutils, reproject, numpy, scipy, Pillow, httpx2 | Etapas de datos (H2); la búsqueda en H4 |
| `pipeline/` | Orquesta `core` offline y deja los campos de la demo como archivos estáticos | Python 3.12 | Completo para Barnard y Makemake |
| `api/` | Modo en vivo: rutas HTTP que delegan en `core`, con caché en disco | FastAPI, Uvicorn | `GET /salud`; el resto en H4 |
| `web/` | Visor: parpadeo, diferencia, objetos conocidos, candidatos, página de límites | React, Vite, TypeScript, WebGL 2 con shaders propios (canvas 2D si no hay WebGL), CSS con tokens, Aladin Lite v3 | Lista de campos, visor y página de límites (H3); candidatos, escena 3D y Aladin Lite en H4 y H5 |

## Arquitectura

### 1. Contexto del sistema

Quién usa spherex-blink y con qué sistemas externos habla. Todos los datos
científicos salen de servicios públicos: IRSA para las imágenes de SPHEREx y
para Gaia DR3, y los catálogos de JPL y CDS para los objetos conocidos (SkyBoT,
de IMCCE, llega con la búsqueda en H4). El visitante sólo habla con la web; la
demo no necesita ninguno de los externos porque los campos ya vienen
precalculados en `web/public/datos/`.

```mermaid
flowchart TB
    usuario(["Visitante o jurado<br/>navegador, celular o proyector"])

    subgraph sistema["spherex-blink"]
        web["Web estática<br/>visor y campos precalculados"]:::hecho
        api["API del modo en vivo"]:::objetivo
        subgraph pipeline["Pipeline offline"]
            etapas["Etapas de datos<br/>descarga, máscara, rejilla, diferencias"]:::hecho
            escritura["Escritura de documentos<br/>validados contra el contrato"]:::hecho
        end
    end

    tap[("IRSA TAP<br/>spherex.plane + spherex.artifact<br/>gaia_dr3_source")]:::externo
    recortes[("IRSA servicio de recortes<br/>imágenes L2 MEF")]:::externo
    s3[("Bucket S3 público<br/>nasa-irsa-spherex")]:::externo
    skybot[("SkyBoT · IMCCE")]:::externo
    jpl[("JPL Horizons / SBIdent")]:::externo
    simbad[("SIMBAD · CDS")]:::externo
    aladin[("Aladin Lite + HiPS<br/>2MASS, AllWISE, DSS2")]:::externo

    usuario --> web
    web -. "campo a pedido" .-> api
    web -. "contexto visual" .-> aladin
    etapas --> tap
    etapas --> recortes
    api -. "lecturas por rangos" .-> s3
    api -.-> skybot
    etapas --> jpl
    etapas --> simbad
    api -.-> tap
    api -.-> recortes
    etapas --> escritura
    escritura -- "JSON + WebP" --> web

    classDef hecho fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
    classDef objetivo fill:#f1f3f5,stroke:#868e96,stroke-dasharray:5 3,color:#495057
    classDef externo fill:#e7f0ff,stroke:#4c6ef5,color:#1c3d8f
```

### 2. Contenedores y dependencias entre paquetes

Las flechas apuntan hacia lo que cada paquete importa. `contrato` no depende
de nada del proyecto; `core` sólo de `contrato`; `pipeline` y `api` son dos
puertas distintas al mismo `core` y no se importan entre sí. La web no importa
Python: compila contra los tipos generados y lee el JSON que deja el pipeline
o que devuelve la API.

```mermaid
flowchart BT
    contrato["contrato<br/>modelos Pydantic"]:::hecho
    core["core<br/>lógica de datos"]:::hecho
    pipeline["pipeline<br/>orquestación offline"]:::hecho
    api["api<br/>FastAPI"]:::hecho
    tipos["web/src/api/tipos.ts<br/>generado"]:::hecho
    datos["web/public/datos/<br/>indice.json · campo.json · WebP"]:::hecho
    web["web<br/>React + Vite + TS"]:::hecho

    core --> contrato
    pipeline --> core
    pipeline --> contrato
    api --> core
    api --> contrato
    tipos -. "se genera desde" .-> contrato
    web --> tipos
    pipeline -- "escribe" --> datos
    web -- "lee" --> datos
    web -. "HTTP, modo en vivo" .-> api

    classDef hecho fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
    classDef objetivo fill:#f1f3f5,stroke:#868e96,stroke-dasharray:5 3,color:#495057
```

| Paquete | Puede importar | No puede importar |
|---|---|---|
| `contrato` | Pydantic | `core`, `pipeline`, `api` |
| `core` | `contrato` y librerías científicas | `pipeline`, `api`, FastAPI |
| `pipeline` | `core`, `contrato` | `api` |
| `api` | `core`, `contrato`, FastAPI | `pipeline` |
| `web` | `src/api/tipos.ts` y los JSON | Ningún paquete Python |

### 3. Pipeline por etapas

Lo que hace `pipeline` con cada campo de la demo, en orden. Cada etapa es un
módulo de `core` (entre paréntesis), así la API podrá reutilizar las mismas
etapas para un campo en vivo. La búsqueda de objetos que se mueven va aparte
porque llega en H4 y la demo funciona sin ella: hasta entonces `candidatos`
queda vacío. Las fallas no cortan el campo: terminan en `avisos[]`.

```mermaid
flowchart TB
    entrada["Campo: objeto destacado, tamaño, detector y fechas<br/>(pipeline/campos.py)"]:::hecho
    destacado["0 · Dónde está el objeto<br/>SIMBAD o JPL Horizons (estrellas, efemerides)"]:::hecho
    descubrir["1 · Descubrir observaciones<br/>TAP de IRSA, ordenadas por mjd (observaciones)"]:::hecho
    elegir["2 · Una época por visita, repartidas por pasada (epocas)"]:::hecho
    bajar["3 · Bajar recortes<br/>paralelo acotado, reintentos, caché en disco (recortes)"]:::hecho
    mascara["4 · Máscara de FLAGS<br/>sólo los bits malos (mascara)"]:::hecho
    rejilla["5 · Reproyección a rejilla común<br/>norte arriba, igual en todas las épocas (rejilla)"]:::hecho
    estirar["6 · Fondo restado, escala asinh común<br/>y WebP (estiramiento)"]:::hecho
    diferencia["7 · Referencia y diferencia<br/>mediana de las otras épocas (diferencias)"]:::hecho
    conocidos["8 · Conocidos por época y su medición<br/>SIMBAD, Horizons, Gaia DR3 (estrellas, efemerides, gaia, medicion)"]:::hecho

    subgraph busqueda["Búsqueda de objetos que se mueven (H4)"]
        detectar["9 · Detección en las diferencias<br/>más de 5σ"]:::objetivo
        enlazar["10 · Enlace en candidatos<br/>3 o más épocas, movimiento uniforme"]:::objetivo
        alarmas["11 · Falsas alarmas esperadas"]:::objetivo
        cruce["12 · Cruce con conocidos"]:::objetivo
    end

    escribir["13 · Escribir indice.json y campo.json<br/>validados contra el contrato (pipeline/escritura.py)"]:::hecho
    avisos[["avisos: épocas descartadas, saturación,<br/>cambio de longitud de onda, detecciones flojas"]]:::hecho

    entrada --> destacado --> descubrir --> elegir --> bajar --> mascara --> rejilla --> estirar --> diferencia --> conocidos
    conocidos -. "H4" .-> detectar --> enlazar --> alarmas --> cruce -.-> escribir
    conocidos -- "candidatos vacío" --> escribir
    bajar -. "fallas aisladas" .-> avisos
    diferencia -. "menos de 3 épocas" .-> avisos
    conocidos -. "lo que no cumple" .-> avisos
    avisos --> escribir

    classDef hecho fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
    classDef objetivo fill:#f1f3f5,stroke:#868e96,stroke-dasharray:5 3,color:#495057
```

Decisiones que hay adentro de las etapas:

- **Épocas.** Dentro de una visita SPHEREx toma varias exposiciones seguidas,
  a 2 minutos; se usa una por visita. La pasada (1 a 4) sale de la fecha:
  pasadas de medio año desde el 2025-05-01.
- **Recortes.** Se piden 1,5 veces más grandes que el campo, porque llegan en
  la orientación nativa de la exposición y la rejilla norte arriba no puede
  quedar con las esquinas vacías. La caché guarda sólo IMAGE, FLAGS, VARIANCE
  y WCS-WAVE (la PSF es el 95 % del archivo y no se usa).
- **Rejilla.** TAN con el píxel nativo de 6,15″. Los píxeles malos se rellenan
  con sus vecinos antes de interpolar (bilineal) y la máscara viaja aparte con
  vecino más cercano, para que un píxel malo no se agrande a cuatro.
- **WebP.** Sin pérdida, gris con alfa: los píxeles inválidos van con alfa 0 y
  el visor les pone su color de «sin dato». Las épocas, la mediana y el rastro
  (máximo por píxel) van con el mismo asinh, cuyos tres números (`minimo`,
  `maximo`, `parametro_asinh`) están en `campo.json`; la diferencia es lineal
  y simétrica, con el gris 128 como «sin cambio» y su límite en
  `escala_diferencia`. Con eso el visor vuelve cada gris a MJy/sr.
- **Mediciones.** Fotometría de apertura (1,5 px) con fondo y ruido de un
  anillo con recorte sigma. Makemake se mide en la diferencia, donde las
  estrellas fijas se cancelan; la alineación (RF-04) se controla midiendo
  estrellas fijas de Gaia DR3 en cada época, salvo donde tienen píxeles
  enmascarados encima.

### 4. Secuencia de un campo en vivo

Cómo se arma un campo que no está en la demo. El pedido no espera al
resultado: devuelve un `trabajo_id` y la web pregunta el estado hasta que
termina, porque cada recorte de IRSA puede tardar varios segundos. Lo que
llegó se muestra aunque falten épocas (`parcial`) y las que fallaron quedan en
`errores`. Todo este flujo es objetivo de H4; hoy la API sólo responde
`GET /salud`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant W as web
    participant A as api
    participant C as Caché en disco
    participant K as core
    participant I as IRSA TAP y recortes

    U->>W: Pide un campo por coordenadas o nombre
    rect rgb(241, 243, 245)
        Note over W,I: Objetivo (H4)
        W->>A: POST /trabajos con ra, dec, tamano_grados y detector
        alt Entrada inválida
            A-->>W: 400 con codigo y mensaje
        else Límite de pedidos
            A-->>W: 429 con codigo y mensaje
        else Aceptado
            A-->>W: trabajo_id
            A->>K: Armar el campo en segundo plano
            K->>I: Consulta TAP de observaciones
            I-->>K: Lista de observaciones
            loop Cada observación, en paralelo acotado
                K->>C: ¿Recorte en caché?
                alt Está
                    C-->>K: Recorte
                else No está
                    K->>I: Pedir recorte, con reintentos
                    alt Responde
                        I-->>K: FITS
                        K->>C: Guardar
                    else Falla o tarda
                        K-->>A: Error de esa época, el resto sigue
                    end
                end
            end
            loop Hasta listo, parcial o error
                W->>A: GET /trabajos/trabajo_id
                A-->>W: estado, progreso, epocas_listas, epocas_totales, errores
            end
            A-->>W: listo o parcial, con el campo en la forma de campo.json
        end
        opt IRSA caído o lento
            A-->>W: 502 o 504 con codigo y mensaje
        end
    end
    W-->>U: Visor con las épocas que llegaron y la lista de fallas
```

### 5. Secuencia de la demo sin red

La demo no depende de internet: los campos están precalculados y se sirven
como archivos estáticos junto con la web. La web resuelve las rutas relativas
del contrato contra `datos/` (`util/rutas.ts`), así el mismo JSON sirve
publicado o servido localmente con `vite preview`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitante
    participant W as web en el navegador
    participant E as Archivos estáticos en datos/

    U->>W: Abre el sitio
    W->>E: GET datos/indice.json
    E-->>W: Lista de campos con miniaturas
    U->>W: Elige un campo (/campo/id)
    W->>E: GET datos/campos/id/campo.json
    E-->>W: Épocas, escalas, conocidos y avisos
    par Imagen de cada época
        W->>E: GET imagen WebP
    and Diferencia de cada época
        W->>E: GET diferencia WebP
    and Mediana y rastro
        W->>E: GET referencia.webp y rastro.webp
    end
    E-->>W: WebP
    W->>W: Decodifica cada WebP a RGBA y lo sube como textura
    W-->>U: Parpadeo, diferencia y marcas de conocidos
    Note over U,E: Ningún pedido sale a IRSA, a los catálogos ni a la API
```

En el navegador, cada WebP se decodifica una vez a RGBA sin premultiplicar
ni convertir color (el gris es un dato, no un color) y se sube como textura
de WebGL 2. Un único fragment shader (`componentes/visor/shaders/`) deshace la
codificación del contrato y vuelve a MJy/sr, aplica el rango visible y el
mapa de color (inferno o cividis; berlin, divergente, para la diferencia y la
resta) y arma la cortina, el fundido y la resta entre dos épocas. Cambiar de
época es cambiar de textura. Si el navegador no da WebGL, el mismo cálculo,
escrito en TypeScript en `util/pintura.ts`, pinta en canvas 2D. Los
marcadores, la lectura de coordenadas (proyección TAN de la cabecera WCS) y
el zoom usan la misma cuenta lienzo ↔ píxel de `util/vista.ts`.

```mermaid
flowchart LR
    json["campo.json<br/>estiramiento y escala_diferencia"]:::hecho --> uni["Uniformes del shader"]:::hecho
    webp["WebP gris + alfa"]:::hecho --> rgba["RGBA en memoria"]:::hecho --> tex["Texturas WebGL 2"]:::hecho
    uni --> sh["Fragment shader<br/>MJy/sr, rango, mapa,<br/>cortina, fundido, resta"]:::hecho
    tex --> sh --> lienzo["Lienzo"]:::hecho
    rgba -. sin WebGL .-> c2d["util/pintura.ts<br/>canvas 2D"]:::hecho --> lienzo

    classDef hecho fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
```

### 6. Contrato de datos

Los modelos de `contrato/`, con los nombres y campos tal como están en el
código. `Indice` y `Campo` son la raíz de los dos archivos que produce el
pipeline; el resto son las entradas y salidas propias de la API. Todo este
diagrama está implementado.

```mermaid
classDiagram
    direction LR

    class Indice {
        version_contrato: str
        generado_en: datetime
        campos: list~ResumenDeCampo~
    }
    class ResumenDeCampo {
        id: str
        nombre: TextoTraducido
        centro: Coordenadas
        tamano_grados: float
        detector: Detector
        cantidad_epocas: int
        objeto_destacado: str o None
        miniatura: str
    }
    class Campo {
        id: str
        nombre: TextoTraducido
        descripcion: TextoTraducido
        centro: Coordenadas
        tamano_grados: float
        detector: Detector
        rejilla: Rejilla
        estiramiento: Estiramiento
        epocas: list~Epoca~
        referencia: str o None
        escala_diferencia: EscalaDeDiferencia o None
        rastro: str o None
        conocidos: list~ObjetoConocido~
        candidatos: list~Candidato~
        geometria: Geometria o None
        limites: Limites o None
        avisos: list~TextoTraducido~
        creditos: str
        procedencia: Procedencia
    }
    class Geometria {
        marco: heliocentrico-ecliptico-J2000
        tierra: list~PuntoHeliocentrico~
        objeto: ObjetoEnLaEscena
    }
    class ObjetoEnLaEscena {
        nombre: str
        posiciones: list~PuntoHeliocentrico~
    }
    class PuntoHeliocentrico {
        epoca_id: str
        x_ua: float
        y_ua: float
        z_ua: float
    }
    class Procedencia {
        version_pipeline: str
        irsa_consultado_en: datetime
    }
    class TextoTraducido {
        es: str
        en: str
    }
    class Coordenadas {
        ra: float
        dec: float
    }
    class Rejilla {
        ancho_px: int
        alto_px: int
        escala_arcsec_px: float
        wcs: dict
    }
    class Estiramiento {
        tipo: TipoDeEstiramiento
        minimo: float
        maximo: float
        parametro_asinh: float o None
    }
    class EscalaDeDiferencia {
        tipo: lineal-simetrica
        limite: float
    }
    class Epoca {
        id: str
        mjd: float
        fecha_utc: datetime
        pasada: int
        fuente: FuenteDeEpoca
        longitud_onda_um: float
        fraccion_mala: float
        imagen: str
        diferencia: str o None
    }
    class FuenteDeEpoca {
        uri: str
        planeid: str
        version_proceso: str
    }
    class ObjetoConocido {
        nombre: str
        tipo: TipoDeObjetoConocido
        posiciones: list~PosicionEsperada~
        deteccion: list~DeteccionDeConocido~
        fuente: FuenteDeCatalogo
        consultado_en: datetime
        magnitud: Magnitud o None
    }
    class PosicionEsperada {
        epoca_id: str
        ra: float
        dec: float
        x: float
        y: float
        dentro_del_campo: bool
        distancia_ua: float o None
    }
    class DeteccionDeConocido {
        epoca_id: str
        x: float
        y: float
        snr: float
        distancia_px: float
    }
    class Magnitud {
        valor: float
        banda: str
    }
    class Candidato {
        id: str
        detecciones: list~Deteccion~
        velocidad_arcsec_h: float
        angulo_posicion_grados: float
        residuo_arcsec: float
        falsas_alarmas_esperadas: float
        identificacion: Identificacion
    }
    class Deteccion {
        epoca_id: str
        x: float
        y: float
        ra: float
        dec: float
        snr: float
    }
    class Identificacion {
        estado: EstadoDeIdentificacion
        nombre: str o None
        distancia_arcsec: float o None
    }
    class Limites {
        umbral_sigma: float
        profundidad_5sigma: Profundidad
        recuperacion: list~PuntoDeRecuperacion~
    }
    class Profundidad {
        mjy_sr: float
        magnitud: float o None
    }
    class PuntoDeRecuperacion {
        brillo: float
        fraccion_recuperada: float
    }
    class Salud {
        estado: ok
        version: str
    }
    class ErrorDeApi {
        codigo: str
        mensaje: str
    }
    class PedidoPorCoordenadas {
        ra: float
        dec: float
        tamano_grados: float
        detector: Detector
    }
    class PedidoPorNombre {
        nombre: str
        tamano_grados: float
        detector: Detector
    }
    class TrabajoCreado {
        trabajo_id: str
    }
    class Trabajo {
        estado: EstadoDeTrabajo
        progreso: float
        epocas_listas: int
        epocas_totales: int
        errores: list~ErrorDeApi~
        campo: Campo o None
    }

    Indice *-- ResumenDeCampo
    ResumenDeCampo *-- Coordenadas
    ResumenDeCampo *-- TextoTraducido
    Campo *-- Coordenadas
    Campo *-- TextoTraducido
    Campo *-- Rejilla
    Campo *-- Estiramiento
    Campo *-- Epoca
    Campo *-- ObjetoConocido
    Campo *-- Candidato
    Campo *-- Limites
    Epoca *-- FuenteDeEpoca
    ObjetoConocido *-- PosicionEsperada
    ObjetoConocido *-- Magnitud
    ObjetoConocido *-- DeteccionDeConocido
    Campo *-- Geometria
    Campo *-- Procedencia
    Geometria *-- PuntoHeliocentrico
    Geometria *-- ObjetoEnLaEscena
    ObjetoEnLaEscena *-- PuntoHeliocentrico
    Candidato *-- Deteccion
    Candidato *-- Identificacion
    Limites *-- Profundidad
    Limites *-- PuntoDeRecuperacion
    Trabajo *-- ErrorDeApi
    Trabajo o-- Campo
    PosicionEsperada ..> Epoca : epoca_id
    Deteccion ..> Epoca : epoca_id
    DeteccionDeConocido ..> Epoca : epoca_id
    PuntoHeliocentrico ..> Epoca : epoca_id
```

Los tipos cerrados son literales: `Detector` va de `D1` a `D6`;
`TipoDeEstiramiento` es `lineal` o `asinh`; `TipoDeObjetoConocido` es
`estrella`, `asteroide`, `cometa`, `tno`, `planeta-enano` o `enana-marron`;
`FuenteDeCatalogo` es `SkyBoT`, `Horizons`, `SIMBAD` o `Gaia DR3`; `EstadoDeIdentificacion`
es `conocido` o `sin-identificar`; `EstadoDeTrabajo` es `pendiente`,
`en-curso`, `parcial`, `listo` o `error`. `PedidoDeTrabajo` es
`PedidoPorCoordenadas` o `PedidoPorNombre`. Además de lo que dice el schema,
`Campo` valida que las épocas estén ordenadas por `mjd`, que sus `id` no se
repitan y que toda `epoca_id` citada (posiciones, detecciones, candidatos y
geometría) exista.

Convenciones de los valores: coordenadas en grados ICRS; posiciones en
píxeles de la rejilla con el origen en el centro del píxel de arriba a la
izquierda, `x` hacia la derecha e `y` hacia abajo; `estiramiento` en MJy/sr
con el fondo mediano de cada época ya restado; fechas en UTC.

### 7. Despliegue

Dónde corre cada pieza. La web es estática y la sirve Cloudflare Pages, que la
construye sola desde `main`. La API corre en Railway con App Sleeping (se
duerme sin tráfico, así el costo es cero) y se publica detrás de Cloudflare.
GitHub Actions verifica cada cambio y puede correr el pipeline para regenerar
los campos de la demo.

```mermaid
flowchart LR
    dev(["Desarrollo<br/>PC con Python y Node"])
    repo[("GitHub<br/>lautaromoreyraa/spherex-blink")]:::externo

    subgraph gha["GitHub Actions"]
        ci["verificacion.yml<br/>Python, contrato y web"]:::hecho
        pipe_ci["Pipeline de la demo"]:::objetivo
    end

    subgraph cloudflare["Cloudflare"]
        pages["Pages<br/>web estática y datos/"]:::objetivo
        proxy["Dominio de la API"]:::objetivo
    end

    railway["Railway con App Sleeping<br/>api en Docker"]:::objetivo
    irsa[("IRSA y catálogos")]:::externo
    usuario(["Visitante"])

    dev -- "push y PR" --> repo
    repo --> ci
    repo -. "a pedido" .-> pipe_ci
    pipe_ci -. "consulta" .-> irsa
    pipe_ci -. "commit de datos/" .-> repo
    repo -- "push a main" --> pages
    usuario --> pages
    usuario -. "modo en vivo" .-> proxy
    proxy -.-> railway
    railway -.-> irsa

    classDef hecho fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
    classDef objetivo fill:#f1f3f5,stroke:#868e96,stroke-dasharray:5 3,color:#495057
    classDef externo fill:#e7f0ff,stroke:#4c6ef5,color:#1c3d8f
```

La configuración de Pages ya está en el repo (`web/wrangler.toml`,
`web/.node-version`); falta crear el proyecto, con estos valores:

| Opción | Valor |
|---|---|
| Rama de producción | `main` |
| Directorio raíz | `web` |
| Comando de build | `npm run build` |
| Directorio de salida | `dist` (declarado también en `web/wrangler.toml`) |
| Versión de Node | la de `web/.node-version` |

### 8. Flujo del contrato

Cómo se propaga un cambio en la forma de los datos. Se edita sólo el modelo
Pydantic; el JSON Schema y los tipos TS se generan y se versionan. La CI
regenera todo y falla si algo difiere de lo versionado, así un modelo nunca
llega a `develop` sin sus derivados.

```mermaid
flowchart LR
    modelos["contrato/*.py<br/>modelos Pydantic"]:::hecho
    generar["python -m contrato.generar"]:::hecho
    schema["contrato/esquemas/<br/>indice, campo y contrato"]:::hecho
    j2ts["web/scripts/generar-tipos.mjs<br/>json-schema-to-typescript"]:::hecho
    tipos["web/src/api/tipos.ts"]:::hecho
    ci{"CI: ¿coincide con lo versionado?"}:::hecho
    ok["Verde"]:::hecho
    falla["Rojo: regenerar y commitear"]:::hecho
    archivos["JSON del pipeline"]:::hecho
    respuestas["Respuestas de la API"]:::objetivo
    web["Compilación de la web"]:::hecho

    modelos --> generar --> schema --> j2ts --> tipos
    schema --> ci
    tipos --> ci
    ci -- "sí" --> ok
    ci -- "no" --> falla
    schema -- "valida (tests/datos)" --> archivos
    modelos -. "valida" .-> respuestas
    tipos -- "tsc" --> web

    classDef hecho fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
    classDef objetivo fill:#f1f3f5,stroke:#868e96,stroke-dasharray:5 3,color:#495057
```

### 9. Flujo de trabajo

Cómo entra un cambio. Cada trabajo va en una rama `feature/*` creada desde
`develop` y entra por PR, sólo con la verificación en verde. `main` recibe lo
que sale a producción, con una etiqueta semver, y es la rama que publica
Cloudflare Pages.

```mermaid
flowchart LR
    rama["feature/nombre<br/>desde develop"]
    pr["Pull request a develop"]
    ci{"Verificación<br/>Python · contrato · web"}
    arreglo["Se corrige en la misma rama"]
    develop["develop<br/>integración"]
    prod["PR de develop a main"]
    main["main con etiqueta vX.Y.Z"]
    pages["Cloudflare Pages publica"]

    rama --> pr --> ci
    ci -- "rojo" --> arreglo --> pr
    ci -- "verde" --> develop
    develop --> prod --> main --> pages
```

## Estructura

```
spherex-blink/
├── contrato/            Forma de los datos: modelos Pydantic, la única fuente de verdad
│   ├── comunes.py       Tipos compartidos (coordenadas, detector, texto traducido)
│   ├── indice.py        indice.json: la lista de campos
│   ├── campo.py         campo.json: un campo con sus épocas, objetos y candidatos
│   ├── api.py           Entradas y salidas propias de la API
│   ├── esquema.py       Exportación a JSON Schema
│   ├── generar.py       Comando que escribe los schemas y los tipos TS
│   ├── esquemas/        JSON Schema generados (versionados)
│   └── ejemplos/        indice.json y campo.json hechos a mano para las pruebas
├── core/                Lógica que comparten el pipeline y la API
│   ├── configuracion.py Servicios, caché y límites de red, desde variables de entorno
│   ├── red.py · cache.py · tap.py    HTTP con reintentos, caché en disco, consultas ADQL
│   ├── observaciones.py · epocas.py  RF-01: imágenes de un campo, pasadas y visitas
│   ├── recortes.py      RF-02: recortes en paralelo acotado, con caché y estado parcial
│   ├── mascara.py       RF-03: bits malos de FLAGS
│   ├── rejilla.py       RF-04: rejilla norte arriba y reproyección
│   ├── estiramiento.py  RF-05: escala común y WebP
│   ├── diferencias.py   RF-06: mediana y diferencia
│   ├── estrellas.py · catalogo.py · gaia.py   RF-08: estrellas de SIMBAD y Gaia DR3
│   ├── efemerides.py    RF-32: efemérides y vectores de JPL Horizons
│   └── medicion.py      Centroide y S/N de una fuente
├── pipeline/            Proceso offline que genera los campos de la demo
│   ├── __main__.py      python -m pipeline: regenera todo
│   ├── campos.py        Los campos de la demo (TAR-06)
│   ├── armado.py        Un campo de punta a punta
│   └── escritura.py     JSON validado contra el contrato
├── api/                 FastAPI: rutas HTTP que delegan en core/
│   └── rutas/           Un router por área
├── tests/               pytest, con una carpeta por paquete
│   ├── datos/           Comprueba los campos versionados contra el contrato y el SRS
│   └── fixture/         FITS sintéticos y respuestas grabadas de IRSA, SIMBAD y Horizons
├── web/                 React + Vite + TypeScript
│   ├── public/datos/    Campos de la demo generados por el pipeline (JSON + WebP, versionados)
│   ├── public/_headers  Cabeceras de seguridad de Cloudflare Pages (también las sirve vite preview)
│   ├── src/             Código de la aplicación (taxonomía abajo)
│   ├── e2e/             Pruebas en navegador con Playwright
│   ├── scripts/         generar-tipos.mjs (JSON Schema → TypeScript)
│   └── wrangler.toml    Configuración de Cloudflare Pages
├── .github/workflows/   verificacion.yml
├── pyproject.toml       Paquete Python, dependencias fijadas, ruff, mypy y pytest
├── LICENSE              MIT
└── CREDITS.md           Datos, código y librerías de terceros con su licencia
```

## Taxonomía

Todo lo propio se nombra en español (`escribir_documento`, `rutaDeDatos`,
`paginas/`); el sufijo técnico queda en inglés cuando es convención
(`router`, `fixture`).

**Python.** Cuatro paquetes con responsabilidades que no se cruzan:

| Paquete | Qué vive adentro | De qué depende |
|---|---|---|
| `contrato` | Modelos de datos y su exportación | Sólo Pydantic |
| `core` | Toda la lógica que toca datos | `contrato` |
| `pipeline` | Orquestación offline y escritura de archivos | `core`, `contrato` |
| `api` | Rutas HTTP, sin lógica | `core`, `contrato` |

Los tests espejan los paquetes en `tests/<paquete>/`, más `tests/datos/`, que
revisa los campos ya generados. Los que pegan a servicios reales llevan
`@pytest.mark.red` y quedan fuera de la corrida por defecto.

Los campos generados viven en `web/public/datos/` con un nombre por función:
`indice.json`, y por campo `campos/<id>/campo.json`, `<época>.webp`,
`<época>-diferencia.webp`, `referencia.webp`, `rastro.webp` y `miniatura.webp`. Las épocas se
llaman `p<pasada>-<AAAAMMDD>-<HHMMSS>` (UTC), así ordenan solas por fecha.

**Web** (`web/src/`):

| Carpeta | Qué vive adentro |
|---|---|
| `main.tsx` · `App.tsx` | Arranque, idioma y el router propio (`/`, `/campo/<id>`, `/limites`) |
| `api/` | `tipos.ts`, generado desde el contrato (no se edita a mano); `cliente.ts` y `campos.ts`, la lectura de `datos/` |
| `paginas/` | Una por ruta: `Inicio`, `Campo`, `Limites`, `NoEncontrada` |
| `componentes/` | Piezas reutilizables, sin acceso a datos; `visor/` tiene el lienzo, los dos pintores (WebGL y canvas 2D), los shaders GLSL, los marcadores y las secciones del campo |
| `layout/` | Barra con navegación e idioma, y pie de reconocimientos |
| `contexto/` | Idioma y navegación, que cruzan todas las páginas |
| `hooks/` | Carga de datos, estado del visor con su temporizador, tamaño de un elemento |
| `util/` | Funciones puras, sin React: estiramiento, WCS, vista, parpadeo, pintura, mapas de color, textos en los dos idiomas |
| `estilos/` | `tokens.css` (custom properties), `base.css` y una hoja por página |
| `test/` | Vitest, espejando las carpetas de arriba, más `fixture/` |

Las carpetas aparecen a medida que tienen contenido. CSS propio con tokens, sin
librerías de componentes.

## Cómo se corre

Requisitos: Python 3.12 y Node 24.

### Python

```bash
python -m venv .venv
source .venv/Scripts/activate      # en Linux/macOS: .venv/bin/activate
pip install -e ".[dev]"

pytest                             # tests sin red
pytest -m red                      # sólo los que pegan a servicios reales
ruff check . && ruff format --check .
mypy

uvicorn api.app:app --reload       # API en http://127.0.0.1:8000/salud
```

### Web

```bash
cd web
npm ci
npx playwright install chromium    # una sola vez, para las pruebas en navegador

npm run dev                        # http://localhost:5173
npm run lint
npm run typecheck
npm test                           # Vitest
npm run build                      # deja la build en web/dist/
npm run test:e2e                   # Playwright contra la build servida
```

Las pruebas e2e levantan `vite preview` en el puerto 4173; si está ocupado,
`PUERTO_E2E=4190 npm run test:e2e` usa otro.

Con `npm run dev`, `/` lista los campos y `/campo/makemake` o
`/campo/estrella-de-barnard` abren el visor. Teclado en el visor: ← y →
cambian de época, la barra espaciadora pausa, + y − acercan, Mayús + flechas
desplazan y 0 vuelve a la vista entera.

### Pipeline de datos

Regenera todos los campos de la demo en `web/public/datos/` desde cero:

```bash
python -m pipeline                  # todos los campos
python -m pipeline --campo makemake # uno solo; el índice se rearma con los demás
```

La primera corrida baja de IRSA, SIMBAD y JPL Horizons (unos minutos: cada
recorte tarda 10 a 15 s) y deja todo en `cache/`, que git ignora. Con la caché
llena no sale a la red y da los mismos archivos salvo `generado_en` del índice.
Para empezar de cero se borra `cache/`. Los campos generados se versionan; los
FITS y la caché, nunca.

| Variable | Default | Para qué |
|---|---|---|
| `SPHEREX_BLINK_CACHE` | `cache` | Carpeta de la caché |
| `SPHEREX_BLINK_PEDIDOS_SIMULTANEOS` | `8` | Pedidos en paralelo a IRSA (tope 12) |
| `SPHEREX_BLINK_REINTENTOS` | `3` | Reintentos ante timeout, 503 o conexión cortada |
| `SPHEREX_BLINK_TIMEOUT_S` | `120` | Timeout de cada pedido |
| `IRSA_TAP_URL`, `IRSA_URL_BASE`, `HORIZONS_URL` | servicios públicos | Otro servidor, si cambia |
| `SIMBAD_TAP_URLS` | CDS y el espejo de Harvard | Servidores de SIMBAD en orden, separados por coma |

### Contrato

Después de cambiar un modelo de `contrato/`, desde la raíz y con el entorno de
Python activo (y `npm ci` hecho en `web/`):

```bash
python -m contrato.generar         # escribe contrato/esquemas/ y web/src/api/tipos.ts
```

Los generados se versionan junto con el cambio del modelo.

## Verificación continua

`.github/workflows/verificacion.yml` corre en cada PR a `develop` o `main` y en
cada push a esas ramas, con tres trabajos:

| Trabajo | Qué verifica |
|---|---|
| Python | ruff (lint y formato), mypy estricto y pytest, incluidos los campos de `web/public/datos/` contra el schema |
| Contrato | Que los schemas y `tipos.ts` versionados coinciden con los modelos |
| Web | ESLint, `tsc`, Vitest, build y Playwright |

Ninguna prueba de la verificación hace pedidos a IRSA ni a los catálogos.

## Licencia y créditos

Código bajo licencia [MIT](LICENSE). Los datos son de SPHEREx/IRSA y los
catálogos citados; el detalle de datos, código y librerías de terceros está en
[CREDITS.md](CREDITS.md).
