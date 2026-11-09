/**
 * Pintor con WebGL 2 (RF-37): cada imagen se sube una vez como textura y el
 * estiramiento, el mapa de color, la cortina, el fundido y la resta se hacen
 * en el shader. Cambiar de época es cambiar qué textura se lee: no hay que
 * recalcular nada en la CPU.
 */
import { tablaRgba, type MapaDeColor, type MapaDivergente } from '../../util/mapasDeColor.ts'
import { COLOR_SIN_DATO } from '../../util/pintura.ts'
import { escala, type Tamano } from '../../util/vista.ts'
import { COLOR_FONDO, type Capa, type Cuadro, type Pintor } from './pintor.ts'
import fuenteFragmento from './shaders/visor.frag.glsl?raw'
import fuenteVertice from './shaders/visor.vert.glsl?raw'

const MODOS = { simple: 0, cortina: 1, fundido: 2, resta: 3 } as const

function compilar(gl: WebGL2RenderingContext, tipo: number, fuente: string): WebGLShader {
  const shader = gl.createShader(tipo)
  if (!shader) throw new Error('WebGL no pudo crear el shader')
  gl.shaderSource(shader, fuente)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const registro = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`El shader no compiló: ${registro ?? ''}`)
  }
  return shader
}

function textura(
  gl: WebGL2RenderingContext,
  ancho: number,
  alto: number,
  datos: ArrayBufferView,
): WebGLTexture {
  const t = gl.createTexture()
  if (!t) throw new Error('WebGL no pudo crear la textura')
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ancho, alto, 0, gl.RGBA, gl.UNSIGNED_BYTE, datos)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return t
}

const normalizado = (rgb: readonly [number, number, number]) =>
  [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255] as const

/** Devuelve null si el navegador no da WebGL 2 o el shader no compila. */
export function crearPintorWebgl(lienzo: HTMLCanvasElement): Pintor | null {
  const gl = lienzo.getContext('webgl2', {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  })
  if (!gl) return null

  let programa: WebGLProgram
  try {
    const vertice = compilar(gl, gl.VERTEX_SHADER, fuenteVertice)
    const fragmento = compilar(gl, gl.FRAGMENT_SHADER, fuenteFragmento)
    const p = gl.createProgram()
    if (!p) return null
    gl.attachShader(p, vertice)
    gl.attachShader(p, fragmento)
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null
    programa = p
  } catch {
    return null
  }
  const vao = gl.createVertexArray()
  const ubicacion = (nombre: string) => gl.getUniformLocation(programa, nombre)
  const u = {
    imagenA: ubicacion('uImagenA'),
    imagenB: ubicacion('uImagenB'),
    mapa: ubicacion('uMapa'),
    divergente: ubicacion('uDivergente'),
    tamanoImagen: ubicacion('uTamanoImagen'),
    lienzo: ubicacion('uLienzo'),
    centro: ubicacion('uCentro'),
    escala: ubicacion('uEscala'),
    codificacionA: ubicacion('uCodificacionA'),
    codificacionB: ubicacion('uCodificacionB'),
    visible: ubicacion('uVisible'),
    limite: ubicacion('uLimite'),
    modo: ubicacion('uModo'),
    mezcla: ubicacion('uMezcla'),
    sinDato: ubicacion('uSinDato'),
    fondo: ubicacion('uFondo'),
  }

  const imagenes = new Map<string, WebGLTexture>()
  const tablas = new Map<MapaDeColor | MapaDivergente, WebGLTexture>()

  function texturaDeCapa(capa: Capa): WebGLTexture {
    let t = imagenes.get(capa.clave)
    if (!t) {
      t = textura(gl!, capa.pixeles.ancho, capa.pixeles.alto, capa.pixeles.datos)
      imagenes.set(capa.clave, t)
    }
    return t
  }

  function texturaDeTabla(mapa: MapaDeColor | MapaDivergente): WebGLTexture {
    let t = tablas.get(mapa)
    if (!t) {
      t = textura(gl!, 256, 1, tablaRgba(mapa))
      tablas.set(mapa, t)
    }
    return t
  }

  return {
    tipo: 'webgl',
    dibujar(cuadro: Cuadro, tamano: Tamano, densidad: number) {
      const ancho = Math.max(1, Math.round(tamano.ancho * densidad))
      const alto = Math.max(1, Math.round(tamano.alto * densidad))
      if (lienzo.width !== ancho || lienzo.height !== alto) {
        lienzo.width = ancho
        lienzo.height = alto
      }
      const imagen = { ancho: cuadro.a.pixeles.ancho, alto: cuadro.a.pixeles.alto }
      gl.viewport(0, 0, ancho, alto)
      gl.useProgram(programa)
      gl.bindVertexArray(vao)

      const unidades: [WebGLUniformLocation | null, WebGLTexture][] = [
        [u.imagenA, texturaDeCapa(cuadro.a)],
        [u.imagenB, texturaDeCapa(cuadro.b ?? cuadro.a)],
        [u.mapa, texturaDeTabla(cuadro.mapa)],
        [u.divergente, texturaDeTabla('berlin')],
      ]
      unidades.forEach(([ubicacionDeUnidad, t], i) => {
        gl.activeTexture(gl.TEXTURE0 + i)
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.uniform1i(ubicacionDeUnidad, i)
      })

      gl.uniform2i(u.tamanoImagen, imagen.ancho, imagen.alto)
      gl.uniform2f(u.lienzo, ancho, alto)
      gl.uniform2f(u.centro, cuadro.vista.centroX, cuadro.vista.centroY)
      // La escala en píxeles físicos: la misma cuenta que usan los
      // marcadores en píxeles CSS, multiplicada por la densidad.
      gl.uniform1f(u.escala, escala(cuadro.vista, tamano, imagen) * densidad)
      gl.uniform4f(u.codificacionA, ...cuadro.a.codificacion)
      gl.uniform4f(u.codificacionB, ...(cuadro.b ?? cuadro.a).codificacion)
      gl.uniform3f(u.visible, cuadro.visible.minimo, cuadro.visible.maximo, cuadro.visible.a ?? 0)
      gl.uniform1f(u.limite, cuadro.limite)
      gl.uniform1i(u.modo, cuadro.b ? MODOS[cuadro.modo] : 0)
      gl.uniform1f(u.mezcla, cuadro.mezcla)
      gl.uniform3f(u.sinDato, ...normalizado(COLOR_SIN_DATO))
      gl.uniform3f(u.fondo, ...normalizado(COLOR_FONDO))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destruir() {
      imagenes.forEach((t) => gl.deleteTexture(t))
      tablas.forEach((t) => gl.deleteTexture(t))
      gl.deleteProgram(programa)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
