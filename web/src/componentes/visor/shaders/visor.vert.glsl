#version 300 es
// Un triángulo que cubre todo el lienzo: el fragment shader hace el resto.
void main() {
  vec2 posicion = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(posicion * 2.0 - 1.0, 0.0, 1.0);
}
