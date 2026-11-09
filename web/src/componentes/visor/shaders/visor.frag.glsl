#version 300 es
// Visor de spherex-blink (RF-37): deshace el estiramiento de los WebP, vuelve
// a MJy/sr, aplica el rango visible y el mapa de color, y arma la cortina, el
// fundido y la resta entre dos épocas. La misma cuenta, en TypeScript, está en
// web/src/util/pintura.ts: si se cambia una, se cambia la otra.
precision highp float;
precision highp int;

uniform sampler2D uImagenA;
uniform sampler2D uImagenB;
uniform sampler2D uMapa;        // 256 × 1, secuencial (inferno o cividis)
uniform sampler2D uDivergente;  // 256 × 1, berlin

uniform ivec2 uTamanoImagen;    // píxeles de la rejilla
uniform vec2 uLienzo;           // píxeles físicos del lienzo
uniform vec2 uCentro;           // píxel de la imagen en el centro del lienzo
uniform float uEscala;          // píxeles físicos por píxel de imagen

// Codificación de cada capa: mínimo, máximo, a (0 = lineal) y tipo
// (0 = imagen estirada, 1 = diferencia lineal simétrica con el límite en x).
uniform vec4 uCodificacionA;
uniform vec4 uCodificacionB;

uniform vec3 uVisible;          // rango visible: mínimo, máximo, a (0 = lineal)
uniform float uLimite;          // ± MJy/sr en los extremos del mapa divergente
uniform int uModo;              // 0 simple, 1 cortina, 2 fundido, 3 resta
uniform float uMezcla;          // cortina: fracción del ancho; fundido: peso de B
uniform vec3 uSinDato;
uniform vec3 uFondo;

out vec4 color;

float decodificar(float g, vec4 c) {
  if (c.w > 0.5) return (g * 255.0 - 128.0) / 127.0 * c.x;
  if (c.z > 0.0) return c.x + (c.y - c.x) * c.z * sinh(g * asinh(1.0 / c.z));
  return c.x + (c.y - c.x) * g;
}

float estirar(float valor) {
  float ancho = uVisible.y - uVisible.x;
  float n = ancho > 0.0 ? clamp((valor - uVisible.x) / ancho, 0.0, 1.0) : 0.0;
  return uVisible.z > 0.0 ? asinh(n / uVisible.z) / asinh(1.0 / uVisible.z) : n;
}

vec3 deTabla(sampler2D tabla, float t) {
  return texelFetch(tabla, ivec2(int(round(clamp(t, 0.0, 1.0) * 255.0)), 0), 0).rgb;
}

vec3 divergente(float valor) {
  float t = uLimite > 0.0 ? clamp(0.5 + valor / (2.0 * uLimite), 0.0, 1.0) : 0.5;
  return deTabla(uDivergente, t);
}

vec3 colorDeCapa(vec4 texel, vec4 c) {
  if (texel.a < 0.5) return uSinDato;
  float valor = decodificar(texel.r, c);
  return c.w > 0.5 ? divergente(valor) : deTabla(uMapa, estirar(valor));
}

void main() {
  // gl_FragCoord tiene el origen abajo; la imagen, arriba.
  vec2 desdeElCentro = vec2(gl_FragCoord.x - uLienzo.x * 0.5, uLienzo.y * 0.5 - gl_FragCoord.y);
  vec2 pixel = uCentro + desdeElCentro / uEscala;
  ivec2 entero = ivec2(floor(pixel + 0.5));
  if (any(lessThan(entero, ivec2(0))) || any(greaterThanEqual(entero, uTamanoImagen))) {
    color = vec4(uFondo, 1.0);
    return;
  }
  // texelFetch y no texture(): cada píxel de SPHEREx se ve como un cuadrado
  // entero, sin interpolar valores que el detector no midió.
  vec4 a = texelFetch(uImagenA, entero, 0);
  if (uModo == 0) {
    color = vec4(colorDeCapa(a, uCodificacionA), 1.0);
  } else if (uModo == 1) {
    bool ladoB = gl_FragCoord.x >= uMezcla * uLienzo.x;
    vec4 texel = ladoB ? texelFetch(uImagenB, entero, 0) : a;
    color = vec4(colorDeCapa(texel, ladoB ? uCodificacionB : uCodificacionA), 1.0);
  } else if (uModo == 2) {
    vec3 colorA = colorDeCapa(a, uCodificacionA);
    vec3 colorB = colorDeCapa(texelFetch(uImagenB, entero, 0), uCodificacionB);
    color = vec4(mix(colorA, colorB, uMezcla), 1.0);
  } else {
    vec4 b = texelFetch(uImagenB, entero, 0);
    if (a.a < 0.5 || b.a < 0.5) {
      color = vec4(uSinDato, 1.0);
    } else {
      color = vec4(divergente(decodificar(a.r, uCodificacionA) - decodificar(b.r, uCodificacionB)), 1.0);
    }
  }
}
