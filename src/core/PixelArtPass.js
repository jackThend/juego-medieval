import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const PixelArtShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(640, 360) },
    colorLevels: { value: 10.0 },
    ditherStrength: { value: 0.9 },
    edgeStrength: { value: 0.32 },
    vignetteStrength: { value: 0.16 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float colorLevels;
    uniform float ditherStrength;
    uniform float edgeStrength;
    uniform float vignetteStrength;
    varying vec2 vUv;

    float luma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    // Matriz Bayer 4x4 escrita como función para conservar compatibilidad WebGL1.
    float bayer4(vec2 p) {
      vec2 q = mod(floor(p), 4.0);
      float x = q.x;
      float y = q.y;
      float v = 0.0;
      if (y < 0.5) {
        if (x < 0.5) v = 0.0;
        else if (x < 1.5) v = 8.0;
        else if (x < 2.5) v = 2.0;
        else v = 10.0;
      } else if (y < 1.5) {
        if (x < 0.5) v = 12.0;
        else if (x < 1.5) v = 4.0;
        else if (x < 2.5) v = 14.0;
        else v = 6.0;
      } else if (y < 2.5) {
        if (x < 0.5) v = 3.0;
        else if (x < 1.5) v = 11.0;
        else if (x < 2.5) v = 1.0;
        else v = 9.0;
      } else {
        if (x < 0.5) v = 15.0;
        else if (x < 1.5) v = 7.0;
        else if (x < 2.5) v = 13.0;
        else v = 5.0;
      }
      return (v + 0.5) / 16.0;
    }

    void main() {
      vec2 texel = 1.0 / resolution;
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float lc = luma(c);
      float ll = luma(texture2D(tDiffuse, vUv + vec2(-texel.x, 0.0)).rgb);
      float lr = luma(texture2D(tDiffuse, vUv + vec2( texel.x, 0.0)).rgb);
      float lu = luma(texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb);
      float ld = luma(texture2D(tDiffuse, vUv + vec2(0.0,-texel.y)).rgb);

      // Detecta discontinuidades de iluminación/geometría y oscurece ligeramente sus bordes.
      float edge = abs(lc - ll) + abs(lc - lr) + abs(lc - lu) + abs(lc - ld);
      edge = smoothstep(0.075, 0.38, edge);

      // Posterización + dithering Bayer: también cuantiza las transiciones de sombra.
      float threshold = bayer4(gl_FragCoord.xy) - 0.5;
      vec3 dithered = clamp(c + threshold * (ditherStrength / colorLevels), 0.0, 1.0);
      vec3 quantized = floor(dithered * colorLevels + 0.5) / colorLevels;
      quantized *= 1.0 - edge * edgeStrength;

      // Viñeta mínima para cerrar la composición sin lavar la interfaz HTML.
      vec2 centered = vUv * 2.0 - 1.0;
      float vignette = smoothstep(0.45, 1.28, dot(centered, centered));
      quantized *= 1.0 - vignette * vignetteStrength;

      gl_FragColor = vec4(quantized, 1.0);
    }
  `,
};

export class PixelArtPass extends ShaderPass {
  constructor(width, height) {
    super(PixelArtShader);
    this.setSize(width, height);
  }

  setSize(width, height) {
    this.uniforms.resolution.value.set(Math.max(1, width), Math.max(1, height));
  }
}
