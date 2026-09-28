import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const PixelArtShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(640, 360) },
    colorLevels: { value: 24.0 },
    lightBands: { value: 6.0 },
    ditherStrength: { value: 0.10 },
    edgeStrength: { value: 0.12 },
    vignetteStrength: { value: 0.05 },
    shadowLift: { value: 0.05 },
    contrast: { value: 1.04 },
    saturation: { value: 1.12 },
    shadowTint: { value: new THREE.Color(0x8fa1b5) },
    midTint: { value: new THREE.Color(0xd5c59f) },
    highlightTint: { value: new THREE.Color(0xffefc7) },
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
    uniform float lightBands;
    uniform float ditherStrength;
    uniform float edgeStrength;
    uniform float vignetteStrength;
    uniform float shadowLift;
    uniform float contrast;
    uniform float saturation;
    uniform vec3 shadowTint;
    uniform vec3 midTint;
    uniform vec3 highlightTint;
    varying vec2 vUv;

    float luma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    vec3 applySaturation(vec3 c, float amount) {
      float l = luma(c);
      return mix(vec3(l), c, amount);
    }

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

      c = (c - 0.5) * contrast + 0.5;
      c += vec3(shadowLift);
      c = clamp(c, 0.0, 1.0);

      float lc = luma(c);
      float ll = luma(texture2D(tDiffuse, vUv + vec2(-texel.x, 0.0)).rgb);
      float lr = luma(texture2D(tDiffuse, vUv + vec2( texel.x, 0.0)).rgb);
      float lu = luma(texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb);
      float ld = luma(texture2D(tDiffuse, vUv + vec2(0.0,-texel.y)).rgb);

      float edge = abs(lc - ll) + abs(lc - lr) + abs(lc - lu) + abs(lc - ld);
      edge = smoothstep(0.08, 0.34, edge);

      float threshold = (bayer4(gl_FragCoord.xy) - 0.5) * ditherStrength;
      float bandValue = clamp(lc + threshold, 0.0, 1.0);
      bandValue = floor(bandValue * lightBands) / max(lightBands - 1.0, 1.0);

      vec3 tint = mix(shadowTint, midTint, smoothstep(0.0, 0.58, bandValue));
      tint = mix(tint, highlightTint, smoothstep(0.58, 1.0, bandValue));

      vec3 stylized = c * tint;
      stylized = applySaturation(stylized, saturation);
      stylized = floor(stylized * colorLevels + 0.5) / colorLevels;
      stylized *= 1.0 - edge * edgeStrength;

      vec2 centered = vUv * 2.0 - 1.0;
      float vignette = smoothstep(0.52, 1.34, dot(centered, centered));
      stylized *= 1.0 - vignette * vignetteStrength;

      gl_FragColor = vec4(clamp(stylized, 0.0, 1.0), 1.0);
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
