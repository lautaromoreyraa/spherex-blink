/**
 * Textos de la interfaz en español e inglés (RNF-06).
 *
 * `en` se tipa con las claves de `es`: si falta una traducción, no compila;
 * un test además revisa que ninguna quede vacía y que ninguna llame
 * «descubrimiento» a lo que muestra la herramienta (RNF-07).
 *
 * Los valores entre llaves (`{n}`) los completa `traducir`.
 */

export type Idioma = 'es' | 'en'
export const IDIOMAS: readonly Idioma[] = ['es', 'en']

const es = {
  'sitio.saltar': 'Saltar al contenido',
  'sitio.navegacion': 'Navegación principal',
  'nav.campos': 'Campos',
  'nav.limites': 'Qué puede y qué no',
  'idioma.etiqueta': 'Idioma',
  'pie.titulo': 'Reconocimientos',
  cargando: 'Cargando…',
  'cargando.imagenes': 'Cargando las imágenes del campo ({n} de {total})…',
  'error.datos': 'No se pudieron leer los datos: {detalle}',
  'error.reintentar': 'Reintentar',
  'noEncontrada.titulo': 'No hay nada en esta dirección',
  'noEncontrada.texto': 'El enlace no corresponde a ninguna página ni a ningún campo de la demo.',
  'noEncontrada.volver': 'Ver los campos',

  'inicio.bajada': 'El cielo infrarrojo de SPHEREx, fecha contra fecha, para ver qué se mueve.',
  'inicio.explicacion':
    'SPHEREx, el telescopio infrarrojo de la NASA, fotografía todo el cielo cada seis meses. Cada campo de abajo junta las fotos reales de una misma región en distintas fechas, alineadas píxel a píxel: al parpadear entre ellas, lo que está quieto queda quieto y lo que se mueve salta a la vista.',
  'inicio.sinRed':
    'Las imágenes salen del archivo de IRSA y están precalculadas: la demo funciona sin conexión.',
  'inicio.camposTitulo': 'Campos de la demo',
  'inicio.epocas': '{n} épocas',
  'inicio.detector': 'Detector {d}',
  'inicio.queMirar': 'Qué mirar: {objeto}',
  'inicio.miniaturaAlt': 'Mediana de las épocas del campo {nombre}',
  'inicio.limites': 'Antes de creerle a lo que ves: qué puede y qué no puede esta herramienta',
  'inicio.escena': 'Por qué se mueve Makemake: el Sistema Solar en las fechas de cada foto',
  'inicio.sinCampos': 'Todavía no hay campos generados.',

  'campo.volver': 'Todos los campos',
  'campo.ficha': 'Datos del campo',
  'campo.centro': 'Centro',
  'campo.lado': 'Lado',
  'campo.ladoValor': '{n}° ({px} × {px} píxeles de {escala}″)',
  'campo.detector': 'Detector',
  'campo.epocas': 'Épocas',
  'campo.limites': 'Qué puede y qué no puede mostrar este visor',
  'campo.escena': 'Ver dónde estaba {objeto} en el Sistema Solar',
  'campo.cantidadDeAvisos': 'Este campo tiene {n} avisos: leelos antes de sacar conclusiones',
  'avisos.titulo': 'Avisos de este campo',

  'visor.titulo': 'Parpadeo entre fechas',
  'visor.region': 'Visor del campo {nombre}',
  'visor.altEpoca': '{campo}, {vista}: época del {fecha}',
  'visor.altPila': '{campo}, {vista} de las épocas elegidas',
  'visor.ayudaRegion':
    'Hacé clic o tocá la imagen para usar el teclado: ← y → cambian de época, la barra espaciadora pausa, + y − acercan, Mayús + flechas desplazan y 0 vuelve a la vista entera.',
  'visor.sinWebgl':
    'Este navegador no ofrece WebGL: el visor dibuja con canvas 2D. Muestra lo mismo; sólo es más lento.',
  'visor.mediana': 'Mediana de las {n} épocas',
  'visor.maximo': 'Máximo de las {n} épocas',
  'visor.epocaDe': 'Época {i} de {n} · pasada {p}',

  'vista.etiqueta': 'Vista',
  'vista.imagen': 'Imagen',
  'vista.diferencia': 'Diferencia',
  'vista.apilado': 'Apilado',
  'vista.rastro': 'Rastro',
  'vista.ayuda.imagen': 'La foto de cada fecha con la misma escala de brillo.',
  'vista.ayuda.diferencia':
    'Cada fecha menos la mediana de las otras: lo quieto se apaga y lo que cambió se enciende.',
  'vista.ayuda.apilado': 'La mediana de todas las épocas: el cielo quieto, sin lo que se mueve.',
  'vista.ayuda.rastro':
    'El máximo de cada píxel en todas las épocas: lo que se mueve deja una fila de puntos.',
  'vista.sinDiferencia': 'Este campo no tiene diferencia: hacen falta al menos 3 épocas válidas.',
  'vista.sinRastro': 'Este campo no tiene rastro calculado.',

  'control.titulo': 'Reproducción',
  'control.reproducir': 'Reproducir',
  'control.pausar': 'Pausar',
  'control.anterior': 'Época anterior',
  'control.siguiente': 'Época siguiente',
  'control.velocidad': 'Velocidad',
  'control.velocidadValor': '{n} cambios por segundo',
  'control.avisoDestellos':
    'El parpadeo alterna imágenes hasta 2,5 veces por segundo, nunca más rápido. Si los destellos te molestan, pausá y pasá de a una época.',

  'seleccion.titulo': 'Épocas que entran en el parpadeo',
  'seleccion.pasada': 'Pasada {n} ({k} épocas)',
  'seleccion.todas': 'Todas',
  'seleccion.vacia': 'Elegí al menos una época.',

  'mapa.etiqueta': 'Mapa de color',
  'mapa.inferno': 'Inferno',
  'mapa.cividis': 'Cividis (se lee igual con daltonismo)',
  'rango.titulo': 'Rango de brillo',
  'rango.minimo': 'Negro desde (MJy/sr)',
  'rango.maximo': 'Blanco desde (MJy/sr)',
  'rango.diferencia': 'Extremos de la diferencia (± MJy/sr)',
  'rango.restablecer': 'Volver al rango del pipeline',

  'leyenda.titulo': 'Escala',
  'leyenda.unidad': 'MJy/sr',
  'leyenda.imagen': 'Brillo de superficie en MJy/sr, con el fondo de cada época restado.',
  'leyenda.diferencia':
    'Rojo: más brillo que la mediana de las otras fechas (algo apareció o llegó). Azul: menos brillo (algo se fue). Oscuro: sin cambio.',
  'leyenda.resta': 'Rojo: más brillo en A. Azul: más brillo en B. Oscuro: igual en las dos.',
  'leyenda.sinDato': 'Sin dato: píxel enmascarado por FLAGS o fuera de la imagen.',

  'zoom.titulo': 'Acercar y desplazar',
  'zoom.acercar': 'Acercar',
  'zoom.alejar': 'Alejar',
  'zoom.entera': 'Vista entera',
  'zoom.valor': 'Zoom ×{n}',

  'coordenadas.titulo': 'Bajo el cursor',
  'coordenadas.fuera': 'Pasá el cursor o el dedo sobre la imagen para leer RA y Dec.',
  'coordenadas.pixel': 'Píxel',
  'coordenadas.valor': 'Valor',
  'coordenadas.sinDato': 'sin dato',

  'marcadores.mostrar': 'Marcar objetos conocidos',
  'marcadores.control': 'Mostrar las estrellas de control (Gaia DR3)',
  'marcadores.leyenda':
    'Círculo: dónde tenía que estar según su catálogo o su efeméride. Cruz: dónde lo midió la herramienta. Línea: su recorrido en las épocas elegidas.',
  'marcador.etiqueta': '{nombre}, {origen}',

  'origen.efemeride': 'posición por efeméride de {fuente}',
  'origen.catalogo': 'posición de catálogo ({fuente})',
  'tipo.estrella': 'estrella',
  'tipo.asteroide': 'asteroide',
  'tipo.cometa': 'cometa',
  'tipo.tno': 'objeto transneptuniano',
  'tipo.planeta-enano': 'planeta enano',
  'tipo.enana-marron': 'enana marrón',

  'conocidos.titulo': 'Objetos conocidos',
  'conocidos.intro':
    'Se marcan por la posición que dan su catálogo o su efeméride: la herramienta no los encontró a ciegas. Tocá o enfocá un marcador para ver su ficha.',
  'conocidos.control': 'Estrellas de control de la alineación (Gaia DR3)',
  'conocidos.controlIntro':
    'Estrellas fijas con las que se comprobó que todas las épocas quedaron alineadas. En el visor están apagadas al abrir.',
  'conocido.tipo': 'Tipo',
  'conocido.fuente': 'Fuente del dato',
  'conocido.consultado': 'Consultado el',
  'conocido.distancia': 'Distancia al observador',
  'conocido.distanciaValor': '{n} UA',
  'conocido.snr': 'S/N medido en esta época',
  'conocido.sinMedicion': 'No se midió en esta época',
  'conocido.desvio': 'A {n} px de lo esperado',
  'conocido.medido': 'Medido en {n} de {total} épocas',
  'conocido.mediciones': 'Épocas en que se midió',
  'conocido.corrimiento': 'Se corre {n} px entre la primera y la última época',
  'conocido.magnitudTitulo': 'Magnitud',
  'conocido.magnitud': '{valor} (banda {banda})',
  'conocido.cerrar': 'Cerrar la ficha',
  'conocido.fichaDe': 'Ficha de {nombre}',

  'comparar.titulo': 'Comparar dos fechas',
  'comparar.intro':
    'Para mirar con calma dos fechas concretas. El zoom y el desplazamiento son los mismos en las dos.',
  'comparar.a': 'Fecha A',
  'comparar.b': 'Fecha B',
  'comparar.modo': 'Cómo comparar',
  'comparar.cortina': 'Cortina',
  'comparar.fundido': 'Fundido',
  'comparar.lado': 'Lado a lado',
  'comparar.resta': 'Resta A − B',
  'comparar.posicionCortina': 'Posición de la cortina entre A (izquierda) y B (derecha)',
  'comparar.mezcla': 'Mezcla entre A y B',
  'comparar.alt': '{campo}: {modo} entre el {a} y el {b}',
  'comparar.rotuloA': 'A · {fecha}',
  'comparar.rotuloB': 'B · {fecha}',

  'procedencia.titulo': 'De dónde sale cada imagen',
  'procedencia.visible': 'Época visible',
  'procedencia.fecha': 'Fecha (UTC)',
  'procedencia.mjd': 'MJD',
  'procedencia.pasada': 'Pasada',
  'procedencia.detector': 'Detector',
  'procedencia.lambda': 'Longitud de onda central',
  'procedencia.mala': 'Píxeles descartados por FLAGS',
  'procedencia.archivo': 'Archivo de IRSA',
  'procedencia.archivoInvalido': 'URI fuera de IRSA: no se enlaza',
  'procedencia.plano': 'planeid',
  'procedencia.version': 'Versión de proceso',
  'procedencia.lambdaAviso':
    'La longitud de onda central de las épocas va de {min} a {max} µm (más de 0,05 µm): parte de lo que cambia entre fechas es color, no movimiento.',
  'procedencia.tabla': 'Todas las épocas',
  'procedencia.incluir': 'En el parpadeo',
  'procedencia.pipeline': 'Generado con spherex-blink {version}; IRSA consultado el {fecha}.',
  'procedencia.pila': 'Esta vista combina varias épocas; la ficha muestra la última elegida.',
  'creditos.titulo': 'Créditos de este campo',
  'escena.documento': 'Sistema Solar',
  'escena.titulo': 'El Sistema Solar en cada pasada',
  'escena.bajadaObjeto':
    'Dónde estaban la Tierra y {objeto} cuando SPHEREx fotografió el campo {campo}.',
  'escena.bajadaSinObjeto':
    'Dónde estaban la Tierra y los planetas cuando SPHEREx fotografió el campo {campo}.',
  'escena.campos': 'Campos de la escena',
  'escena.noEncontrado': 'No encontramos ese campo: «{id}» no es uno de los campos de la demo.',
  'escena.errorDeCarga': 'No se pudo cargar el campo «{id}»: {detalle}',
  'escena.verMakemake': 'Ver la escena de Makemake',
  'escena.avisoIlustrativa':
    'Tamaños y distancias no están a escala: las distancias están comprimidas y los cuerpos agrandados para que se vean. Las direcciones sí son las reales.',
  'escena.avisoReal':
    'Escala real de distancias y tamaños: los cuerpos son más chicos que un píxel y sólo se ven sus rótulos.',
  'escena.avisoMakemake':
    'La superficie de Makemake es una ilustración: nadie la fotografió. Su posición sí es la de JPL Horizons.',
  'escena.cargando3d': 'Cargando la escena 3D…',
  'escena.volando': 'Volando al campo {campo}…',
  'escena.saltear': 'Saltear el vuelo (Esc)',
  'escena.epoca': 'Época {n} de {total}',
  'escena.epocaValor': '{fecha}, pasada {pasada}',
  'escena.pasada': 'pasada {n}',
  'escena.escalaReal': 'Escala real',
  'escena.cuerpos': 'Acercar la cámara a un cuerpo',
  'escena.volar': 'Volar al campo {campo}',
  'escena.origenConObjeto':
    'La Tierra y {objeto} salen de JPL Horizons; los demás planetas se calculan con astronomy-engine.',
  'escena.origenSinObjeto': 'La Tierra y los planetas se calculan con astronomy-engine.',
  'escena.texturas': 'Texturas de',
  'escena.cuerpo.sol': 'Sol',
  'escena.cuerpo.mercurio': 'Mercurio',
  'escena.cuerpo.venus': 'Venus',
  'escena.cuerpo.tierra': 'Tierra',
  'escena.cuerpo.marte': 'Marte',
  'escena.cuerpo.jupiter': 'Júpiter',
  'escena.cuerpo.saturno': 'Saturno',
  'escena.cuerpo.urano': 'Urano',
  'escena.cuerpo.neptuno': 'Neptuno',
  'escena.ilustracion': '{nombre} (ilustración)',
  'escena.paralajeTitulo': 'Líneas de visión y paralaje',
  'escena.sinObjeto':
    'Este campo no sigue a un cuerpo del Sistema Solar. Cada línea sale de la Tierra hacia el centro del campo en una época, y todas son paralelas: para algo tan lejano como una estrella, el ángulo entre ellas es prácticamente 0″ aunque la Tierra haya cambiado de lado del Sol. Lo que se ve moverse en este campo es el movimiento propio de la estrella, no un paralaje del Sistema Solar.',
  'escena.unaEpoca': 'Este campo tiene una sola época con geometría: no hay dos líneas que comparar.',
  'escena.lineas':
    'Cada línea sale de la Tierra hacia {objeto} en una época. Entre el {fechaA} y el {fechaB}, la Tierra se movió {base} UA y las dos líneas forman un ángulo de {segundos}, o sea {pixeles} de SPHEREx ({escala}″ por píxel).',
  'escena.segundos': '{n}″',
  'escena.pixeles': '{n} píxeles',
  'escena.paralajeTierra':
    'Si {objeto} se hubiera quedado quieto, sólo el cambio de punto de vista lo habría corrido {segundos}″: eso es el paralaje. La diferencia es su propio movimiento en la órbita. {objeto} está a {distancia} UA de la Tierra.',
  'escena.estrella':
    'Una estrella lejana, en cambio, se ve en la misma dirección desde las dos posiciones de la Tierra: su ángulo es prácticamente 0″. Por eso en las imágenes las estrellas quedan quietas y {objeto} salta: así se delata un cuerpo lejano del Sistema Solar.',
  'escena.unaSola':
    'Todas las épocas de este campo son de la pasada {n} de SPHEREx: las líneas son las de esas épocas, separadas por días y no por los seis meses que hay entre pasadas. Por eso el ángulo es chico y, a esta escala, las líneas se superponen.',
  'escena.variasPasadas': 'Las épocas de este campo son de las pasadas {lista} de SPHEREx.',
  'escena.fijaAlt':
    'Captura de la escena del campo de Makemake: el Sol, las órbitas de los planetas y la órbita inclinada de Makemake, con la línea de visión desde la Tierra hacia el campo.',
  'escena.fija':
    'Este navegador no puede dibujar en 3D (WebGL), así que se muestra una imagen fija de la escena del campo de Makemake. El texto y el paso al visor funcionan igual.',
  'escena.fijaOtroCampo':
    'Este navegador no puede dibujar en 3D (WebGL), así que se muestra una imagen fija de la escena del campo de Makemake, no la de este campo. El texto y el paso al visor funcionan igual.',
} as const

export type Clave = keyof typeof es

const en: Record<Clave, string> = {
  'sitio.saltar': 'Skip to content',
  'sitio.navegacion': 'Main navigation',
  'nav.campos': 'Fields',
  'nav.limites': 'What it can and cannot do',
  'idioma.etiqueta': 'Language',
  'pie.titulo': 'Acknowledgements',
  cargando: 'Loading…',
  'cargando.imagenes': 'Loading the field images ({n} of {total})…',
  'error.datos': 'The data could not be read: {detalle}',
  'error.reintentar': 'Try again',
  'noEncontrada.titulo': 'Nothing at this address',
  'noEncontrada.texto': 'The link does not match any page or any demo field.',
  'noEncontrada.volver': 'See the fields',

  'inicio.bajada': 'The SPHEREx infrared sky, date against date, to see what moves.',
  'inicio.explicacion':
    'SPHEREx, NASA’s infrared telescope, images the whole sky every six months. Each field below gathers the real images of one region on different dates, aligned pixel by pixel: blink between them and whatever stays still stays still, while whatever moves jumps out.',
  'inicio.sinRed':
    'The images come from the IRSA archive and are precomputed: the demo works offline.',
  'inicio.camposTitulo': 'Demo fields',
  'inicio.epocas': '{n} epochs',
  'inicio.detector': 'Detector {d}',
  'inicio.queMirar': 'What to look for: {objeto}',
  'inicio.miniaturaAlt': 'Median of the epochs of the {nombre} field',
  'inicio.limites': 'Before you believe what you see: what this tool can and cannot do',
  'inicio.escena': 'Why Makemake moves: the Solar System on the date of each image',
  'inicio.sinCampos': 'No fields have been generated yet.',

  'campo.volver': 'All fields',
  'campo.ficha': 'Field data',
  'campo.centro': 'Centre',
  'campo.lado': 'Side',
  'campo.ladoValor': '{n}° ({px} × {px} pixels of {escala}″)',
  'campo.detector': 'Detector',
  'campo.epocas': 'Epochs',
  'campo.limites': 'What this viewer can and cannot show',
  'campo.escena': 'See where {objeto} was in the Solar System',
  'campo.cantidadDeAvisos': 'This field has {n} notes: read them before drawing conclusions',
  'avisos.titulo': 'Notes on this field',

  'visor.titulo': 'Blink between dates',
  'visor.region': 'Viewer for the {nombre} field',
  'visor.altEpoca': '{campo}, {vista}: epoch of {fecha}',
  'visor.altPila': '{campo}, {vista} of the chosen epochs',
  'visor.ayudaRegion':
    'Click or tap the image to use the keyboard: ← and → change epoch, the space bar pauses, + and − zoom, Shift + arrows pan and 0 shows the whole image.',
  'visor.sinWebgl':
    'This browser does not offer WebGL: the viewer draws with a 2D canvas. It shows the same thing, only slower.',
  'visor.mediana': 'Median of all {n} epochs',
  'visor.maximo': 'Maximum of all {n} epochs',
  'visor.epocaDe': 'Epoch {i} of {n} · pass {p}',

  'vista.etiqueta': 'View',
  'vista.imagen': 'Image',
  'vista.diferencia': 'Difference',
  'vista.apilado': 'Stack',
  'vista.rastro': 'Trail',
  'vista.ayuda.imagen': 'The image of each date with the same brightness scale.',
  'vista.ayuda.diferencia':
    'Each date minus the median of the others: what stays still fades and what changed lights up.',
  'vista.ayuda.apilado': 'The median of all epochs: the still sky, without what moves.',
  'vista.ayuda.rastro':
    'The maximum of each pixel over all epochs: whatever moves leaves a row of dots.',
  'vista.sinDiferencia': 'This field has no difference image: at least 3 valid epochs are needed.',
  'vista.sinRastro': 'This field has no trail image.',

  'control.titulo': 'Playback',
  'control.reproducir': 'Play',
  'control.pausar': 'Pause',
  'control.anterior': 'Previous epoch',
  'control.siguiente': 'Next epoch',
  'control.velocidad': 'Speed',
  'control.velocidadValor': '{n} changes per second',
  'control.avisoDestellos':
    'The blink switches images up to 2.5 times per second, never faster. If flashing bothers you, pause and step one epoch at a time.',

  'seleccion.titulo': 'Epochs included in the blink',
  'seleccion.pasada': 'Pass {n} ({k} epochs)',
  'seleccion.todas': 'All',
  'seleccion.vacia': 'Choose at least one epoch.',

  'mapa.etiqueta': 'Colour map',
  'mapa.inferno': 'Inferno',
  'mapa.cividis': 'Cividis (reads the same with colour blindness)',
  'rango.titulo': 'Brightness range',
  'rango.minimo': 'Black from (MJy/sr)',
  'rango.maximo': 'White from (MJy/sr)',
  'rango.diferencia': 'Difference extremes (± MJy/sr)',
  'rango.restablecer': 'Back to the pipeline range',

  'leyenda.titulo': 'Scale',
  'leyenda.unidad': 'MJy/sr',
  'leyenda.imagen': 'Surface brightness in MJy/sr, with each epoch’s background subtracted.',
  'leyenda.diferencia':
    'Red: brighter than the median of the other dates (something appeared or arrived). Blue: fainter (something left). Dark: no change.',
  'leyenda.resta': 'Red: brighter in A. Blue: brighter in B. Dark: the same in both.',
  'leyenda.sinDato': 'No data: pixel masked by FLAGS or outside the image.',

  'zoom.titulo': 'Zoom and pan',
  'zoom.acercar': 'Zoom in',
  'zoom.alejar': 'Zoom out',
  'zoom.entera': 'Whole image',
  'zoom.valor': 'Zoom ×{n}',

  'coordenadas.titulo': 'Under the pointer',
  'coordenadas.fuera': 'Move the pointer or your finger over the image to read RA and Dec.',
  'coordenadas.pixel': 'Pixel',
  'coordenadas.valor': 'Value',
  'coordenadas.sinDato': 'no data',

  'marcadores.mostrar': 'Mark known objects',
  'marcadores.control': 'Show the control stars (Gaia DR3)',
  'marcadores.leyenda':
    'Circle: where it should be according to its catalogue or ephemeris. Cross: where the tool measured it. Line: its path over the chosen epochs.',
  'marcador.etiqueta': '{nombre}, {origen}',

  'origen.efemeride': 'position from the {fuente} ephemeris',
  'origen.catalogo': 'catalogue position ({fuente})',
  'tipo.estrella': 'star',
  'tipo.asteroide': 'asteroid',
  'tipo.cometa': 'comet',
  'tipo.tno': 'trans-Neptunian object',
  'tipo.planeta-enano': 'dwarf planet',
  'tipo.enana-marron': 'brown dwarf',

  'conocidos.titulo': 'Known objects',
  'conocidos.intro':
    'They are marked at the position given by their catalogue or ephemeris: the tool did not find them blindly. Tap or focus a marker to see its card.',
  'conocidos.control': 'Alignment control stars (Gaia DR3)',
  'conocidos.controlIntro':
    'Fixed stars used to check that every epoch was aligned. They are hidden in the viewer when it opens.',
  'conocido.tipo': 'Type',
  'conocido.fuente': 'Data source',
  'conocido.consultado': 'Retrieved on',
  'conocido.distancia': 'Distance from the observer',
  'conocido.distanciaValor': '{n} AU',
  'conocido.snr': 'S/N measured in this epoch',
  'conocido.sinMedicion': 'Not measured in this epoch',
  'conocido.desvio': '{n} px from the expected position',
  'conocido.medido': 'Measured in {n} of {total} epochs',
  'conocido.mediciones': 'Epochs where it was measured',
  'conocido.corrimiento': 'Moves {n} px between the first and last epochs',
  'conocido.magnitudTitulo': 'Magnitude',
  'conocido.magnitud': '{valor} ({banda} band)',
  'conocido.cerrar': 'Close the card',
  'conocido.fichaDe': 'Card for {nombre}',

  'comparar.titulo': 'Compare two dates',
  'comparar.intro': 'To look calmly at two specific dates. Zoom and panning are shared by both.',
  'comparar.a': 'Date A',
  'comparar.b': 'Date B',
  'comparar.modo': 'How to compare',
  'comparar.cortina': 'Curtain',
  'comparar.fundido': 'Crossfade',
  'comparar.lado': 'Side by side',
  'comparar.resta': 'Subtract A − B',
  'comparar.posicionCortina': 'Curtain position between A (left) and B (right)',
  'comparar.mezcla': 'Mix between A and B',
  'comparar.alt': '{campo}: {modo} between {a} and {b}',
  'comparar.rotuloA': 'A · {fecha}',
  'comparar.rotuloB': 'B · {fecha}',

  'procedencia.titulo': 'Where each image comes from',
  'procedencia.visible': 'Visible epoch',
  'procedencia.fecha': 'Date (UTC)',
  'procedencia.mjd': 'MJD',
  'procedencia.pasada': 'Pass',
  'procedencia.detector': 'Detector',
  'procedencia.lambda': 'Central wavelength',
  'procedencia.mala': 'Pixels discarded by FLAGS',
  'procedencia.archivo': 'IRSA file',
  'procedencia.archivoInvalido': 'URI outside IRSA: not linked',
  'procedencia.plano': 'planeid',
  'procedencia.version': 'Processing version',
  'procedencia.lambdaAviso':
    'The central wavelength of the epochs ranges from {min} to {max} µm (more than 0.05 µm): part of what changes between dates is colour, not motion.',
  'procedencia.tabla': 'All epochs',
  'procedencia.incluir': 'In the blink',
  'procedencia.pipeline': 'Generated with spherex-blink {version}; IRSA queried on {fecha}.',
  'procedencia.pila': 'This view combines several epochs; the card shows the last one chosen.',
  'creditos.titulo': 'Credits for this field',
  'escena.documento': 'Solar System',
  'escena.titulo': 'The Solar System at each pass',
  'escena.bajadaObjeto': 'Where the Earth and {objeto} were when SPHEREx imaged the {campo} field.',
  'escena.bajadaSinObjeto':
    'Where the Earth and the planets were when SPHEREx imaged the {campo} field.',
  'escena.campos': 'Scene fields',
  'escena.noEncontrado': 'We could not find that field: “{id}” is not one of the demo fields.',
  'escena.errorDeCarga': 'The field “{id}” could not be loaded: {detalle}',
  'escena.verMakemake': 'See the Makemake scene',
  'escena.avisoIlustrativa':
    'Sizes and distances are not to scale: distances are compressed and bodies enlarged so they can be seen. Directions are the real ones.',
  'escena.avisoReal':
    'True scale for distances and sizes: bodies are smaller than a pixel and only their labels can be seen.',
  'escena.avisoMakemake':
    'The surface of Makemake is an illustration: nobody has imaged it. Its position does come from JPL Horizons.',
  'escena.cargando3d': 'Loading the 3D scene…',
  'escena.volando': 'Flying to the {campo} field…',
  'escena.saltear': 'Skip the flight (Esc)',
  'escena.epoca': 'Epoch {n} of {total}',
  'escena.epocaValor': '{fecha}, pass {pasada}',
  'escena.pasada': 'pass {n}',
  'escena.escalaReal': 'True scale',
  'escena.cuerpos': 'Move the camera to a body',
  'escena.volar': 'Fly to the {campo} field',
  'escena.origenConObjeto':
    'The Earth and {objeto} come from JPL Horizons; the other planets are computed with astronomy-engine.',
  'escena.origenSinObjeto': 'The Earth and the planets are computed with astronomy-engine.',
  'escena.texturas': 'Textures by',
  'escena.cuerpo.sol': 'Sun',
  'escena.cuerpo.mercurio': 'Mercury',
  'escena.cuerpo.venus': 'Venus',
  'escena.cuerpo.tierra': 'Earth',
  'escena.cuerpo.marte': 'Mars',
  'escena.cuerpo.jupiter': 'Jupiter',
  'escena.cuerpo.saturno': 'Saturn',
  'escena.cuerpo.urano': 'Uranus',
  'escena.cuerpo.neptuno': 'Neptune',
  'escena.ilustracion': '{nombre} (illustration)',
  'escena.paralajeTitulo': 'Lines of sight and parallax',
  'escena.sinObjeto':
    'This field does not follow a Solar System body. Each line goes from the Earth towards the centre of the field at one epoch, and they are all parallel: for something as far away as a star, the angle between them is practically 0″ even though the Earth moved to the other side of the Sun. What moves in this field is the star’s proper motion, not a Solar System parallax.',
  'escena.unaEpoca': 'This field has a single epoch with geometry: there are no two lines to compare.',
  'escena.lineas':
    'Each line goes from the Earth towards {objeto} at one epoch. Between {fechaA} and {fechaB}, the Earth moved {base} AU and the two lines form an angle of {segundos}, that is {pixeles} of SPHEREx ({escala}″ per pixel).',
  'escena.segundos': '{n}″',
  'escena.pixeles': '{n} pixels',
  'escena.paralajeTierra':
    'Had {objeto} stood still, the change of viewpoint alone would have shifted it {segundos}″: that is the parallax. The rest is its own orbital motion. {objeto} is {distancia} AU from the Earth.',
  'escena.estrella':
    'A distant star, instead, is seen in the same direction from both positions of the Earth: its angle is practically 0″. That is why stars stay still in the images while {objeto} jumps: that is how a distant Solar System body gives itself away.',
  'escena.unaSola':
    'All the epochs of this field are from SPHEREx pass {n}: the lines are those of these epochs, days apart rather than the six months between passes. That is why the angle is small and, at this scale, the lines overlap.',
  'escena.variasPasadas': 'The epochs of this field are from SPHEREx passes {lista}.',
  'escena.fijaAlt':
    'Capture of the scene of the Makemake field: the Sun, the planetary orbits and the inclined orbit of Makemake, with the line of sight from the Earth towards the field.',
  'escena.fija':
    'This browser cannot draw in 3D (WebGL), so a still image of the Makemake field scene is shown. The text and the way to the viewer work the same.',
  'escena.fijaOtroCampo':
    'This browser cannot draw in 3D (WebGL), so a still image of the Makemake field scene is shown, not the one for this field. The text and the way to the viewer work the same.',
}

export const TEXTOS: Record<Idioma, Record<Clave, string>> = { es, en }

export type Valores = Record<string, string | number>

export function traducir(idioma: Idioma, clave: Clave, valores: Valores = {}): string {
  const plantilla = TEXTOS[idioma][clave]
  return plantilla.replace(/\{(\w+)\}/g, (entero, nombre: string) =>
    nombre in valores ? String(valores[nombre]) : entero,
  )
}

/** Idioma inicial: el del navegador si es español; si no, inglés (jurado internacional). */
export function idiomaDelNavegador(preferidos: readonly string[]): Idioma {
  for (const etiqueta of preferidos) {
    const base = etiqueta.toLowerCase().split('-')[0]
    if (base === 'es') return 'es'
    if (base === 'en') return 'en'
  }
  return 'en'
}

export function esIdioma(valor: unknown): valor is Idioma {
  return valor === 'es' || valor === 'en'
}

/** Fecha y hora en UTC, formateada según el idioma. */
export function formatearFechaUtc(iso: string, idioma: Idioma): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  const texto = new Intl.DateTimeFormat(idioma === 'es' ? 'es-AR' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(fecha)
  return `${texto} UTC`
}

export function formatearNumero(valor: number, idioma: Idioma, decimales = 2): string {
  return new Intl.NumberFormat(idioma === 'es' ? 'es-AR' : 'en-GB', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor)
}

/** Número con los decimales justos para una marca de escala (sin ceros de más). */
export function formatearMarca(valor: number, idioma: Idioma): string {
  const absoluto = Math.abs(valor)
  const decimales =
    absoluto === 0 ? 0 : absoluto >= 10 ? 0 : absoluto >= 1 ? 1 : absoluto >= 0.1 ? 2 : 3
  const texto = new Intl.NumberFormat(idioma === 'es' ? 'es-AR' : 'en-GB', {
    maximumFractionDigits: decimales,
  }).format(valor)
  // Signo menos tipográfico: se lee mejor en el proyector que el guion.
  return texto.replace('-', '−')
}
