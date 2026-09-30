import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const shader={
  uniforms:{
    tDiffuse:{value:null},
    resolution:{value:new THREE.Vector2(320,180)},
    colorSteps:{value:10.0},
    edgeThreshold:{value:0.16},
    edgeDarken:{value:0.78},
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

    float bayer2(vec2 p){
      vec2 m=mod(floor(p),2.0);
      if(m.x<0.5&&m.y<0.5)return 0.0;
      if(m.x>0.5&&m.y>0.5)return 1.0;
      if(m.x>0.5)return 0.5;
      return 0.75;
    }

    void main(){
      vec2 px=1.0/resolution;
      vec3 c=texture2D(tDiffuse,vUv).rgb;
      vec3 l=texture2D(tDiffuse,vUv-vec2(px.x,0.0)).rgb;
      vec3 r=texture2D(tDiffuse,vUv+vec2(px.x,0.0)).rgb;
      vec3 u=texture2D(tDiffuse,vUv+vec2(0.0,px.y)).rgb;
      vec3 d=texture2D(tDiffuse,vUv-vec2(0.0,px.y)).rgb;

      float edge=max(max(length(c-l),length(c-r)),max(length(c-u),length(c-d)));
      float ordered=(bayer2(gl_FragCoord.xy)-0.5)/(colorSteps*2.6);
      vec3 q=floor(clamp(c+ordered,0.0,1.0)*colorSteps+0.5)/colorSteps;

      if(edge>edgeThreshold){
        q*=edgeDarken;
      }

      // final hard clamp keeps tiny anti-aliased remnants from reappearing.
      q=floor(q*15.0+0.5)/15.0;
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
