import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const shader={
  uniforms:{
    tDiffuse:{value:null},
    resolution:{value:new THREE.Vector2(480,270)},
    colorSteps:{value:32.0},
    edgeThreshold:{value:0.30},
    edgeDarken:{value:0.94},
  },
  vertexShader:/* glsl */`
    varying vec2 vUv;
    void main(){
      vUv=uv;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    }
  `,
  fragmentShader:/* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float colorSteps;
    uniform float edgeThreshold;
    uniform float edgeDarken;
    varying vec2 vUv;

    void main(){
      vec2 px=1.0/resolution;
      vec3 c=texture2D(tDiffuse,vUv).rgb;
      vec3 l=texture2D(tDiffuse,vUv-vec2(px.x,0.0)).rgb;
      vec3 r=texture2D(tDiffuse,vUv+vec2(px.x,0.0)).rgb;
      vec3 u=texture2D(tDiffuse,vUv+vec2(0.0,px.y)).rgb;
      vec3 d=texture2D(tDiffuse,vUv-vec2(0.0,px.y)).rgb;

      float edge=max(max(length(c-l),length(c-r)),max(length(c-u),length(c-d)));
      vec3 q=floor(clamp(c,0.0,1.0)*colorSteps+0.5)/colorSteps;

      // Sólo bordes claros. A 270p no queremos triturar molduras, ramas y
      // pequeños highlights que ya vienen bakeados.
      if(edge>edgeThreshold){
        q*=edgeDarken;
      }

      gl_FragColor=vec4(q,1.0);
    }
  `,
};

export class PixelArtPass extends ShaderPass{
  constructor(){
    super(shader);
  }

  setResolution(width,height){
    this.uniforms.resolution.value.set(Math.max(1,width),Math.max(1,height));
  }
}
