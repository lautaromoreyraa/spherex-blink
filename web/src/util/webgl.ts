/**
 * Si el navegador puede dibujar con WebGL (RNF-13). Sin WebGL la escena no
 * se descarga: se muestra una imagen fija con el mismo texto.
 *
 * Se prueba creando un contexto de verdad, porque `window.WebGLRenderingContext`
 * existe aunque la GPU esté bloqueada o el controlador no lo permita.
 */
export function hayWebGL(documento: Pick<Document, 'createElement'> = document): boolean {
  try {
    const lienzo = documento.createElement('canvas')
    const contexto = lienzo.getContext('webgl2') ?? lienzo.getContext('webgl')
    return contexto !== null
  } catch {
    return false
  }
}
