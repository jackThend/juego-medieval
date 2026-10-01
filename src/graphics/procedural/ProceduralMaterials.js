import * as THREE from "three";

let toonGradient=null;

function getToonGradient(){
  if(toonGradient)return toonGradient;

  // Cinco bandas: más detalle que 9E, pero aún claramente discreto.
  const levels=[
    28,28,28,255,
    68,68,68,255,
    112,112,112,255,
    168,168,168,255,
    228,228,228,255,
  ];

  const data=new Uint8Array(levels);
  toonGradient=new THREE.DataTexture(data,5,1,THREE.RGBAFormat);
  toonGradient.magFilter=THREE.NearestFilter;
  toonGradient.minFilter=THREE.NearestFilter;
  toonGradient.generateMipmaps=false;
  toonGradient.colorSpace=THREE.NoColorSpace;
  toonGradient.needsUpdate=true;
  return toonGradient;
}

export function createProceduralToonMaterial({
  color=0x686962,
  family="stone",
  emissive=0x000000,
  side=THREE.FrontSide,
}={}){
  const material=new THREE.MeshToonMaterial({
    color,
    emissive,
    gradientMap:getToonGradient(),
    side,
  });

  material.onBeforeCompile=(shader)=>{
    shader.vertexShader=shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vProcWorld;"
      )
      .replace(
        "#include <project_vertex>",
        "vProcWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>"
      );

    shader.fragmentShader=shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vProcWorld;\nfloat procHash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}"
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        "float cell=procHash(floor(vProcWorld*vec3(3.6,3.0,3.6)));float band=floor(cell*4.0)/3.0;float variation=mix(0.88,1.06,band);vec3 procDiffuse=diffuse*variation;vec4 diffuseColor=vec4(procDiffuse,opacity);"
      );
  };

  material.customProgramCacheKey=()=>"procedural-toon-v4-"+family;
  return material;
}

export function createFloorMaterial(){
  const vertexShader=[
    "varying vec3 vWorld;",
    "void main(){",
    "  vec4 world=modelMatrix*vec4(position,1.0);",
    "  vWorld=world.xyz;",
    "  gl_Position=projectionMatrix*viewMatrix*world;",
    "}",
  ].join("\n");

  const fragmentShader=[
    "uniform vec3 baseA;",
    "uniform vec3 baseB;",
    "uniform vec3 baseC;",
    "uniform vec3 mortar;",
    "uniform vec3 moss;",
    "uniform vec3 warmStone;",
    "uniform vec3 moonStone;",
    "varying vec3 vWorld;",
    "float hash21(vec2 p){",
    "  p=fract(p*vec2(123.34,345.45));",
    "  p+=dot(p,p+34.345);",
    "  return fract(p.x*p.y);",
    "}",
    "void main(){",
    "  vec2 p=vec2(vWorld.x*0.70,vWorld.z*1.05);",
    "  float row=floor(p.y);",
    "  p.x+=mod(row,2.0)*0.50;",
    "  vec2 cell=floor(p);",
    "  vec2 f=fract(p);",
    "  float edge=min(min(f.x,1.0-f.x),min(f.y,1.0-f.y));",
    "  float mortarMask=1.0-step(0.032,edge);",
    "  float h=hash21(cell);",
    "  float tone=floor(h*3.0);",
    "  vec3 stone=tone<1.0?baseA:(tone<2.0?baseB:baseC);",
    "  float crackSeed=hash21(cell+17.0);",
    "  float crackLine=0.0;",
    "  if(crackSeed>0.80){",
    "    float bend=0.22+0.34*f.y+0.07*sin(f.y*8.0);",
    "    crackLine=1.0-step(0.015,abs(f.x-bend));",
    "  }",
    "  float chipSeed=hash21(cell+73.0);",
    "  float chip=step(0.91,chipSeed)*step(length(f-vec2(0.15,0.82)),0.08);",
    "  float mossSeed=hash21(cell+41.0);",
    "  float mossMask=step(0.89,mossSeed)*step(f.y,0.16)*step(f.x,0.60);",
    "  stone=mix(stone,moss,mossMask*0.52);",
    "  stone=mix(stone,mortar,mortarMask);",
    "  stone=mix(stone,mortar,crackLine*0.78);",
    "  stone=mix(stone,mortar,chip*0.58);",
    "  float broad=floor((0.56+0.07*sin(vWorld.x*0.25)+0.04*cos(vWorld.z*0.19))*5.0)/5.0;",
    "  stone*=0.82+broad*0.16;",
    "  float warm0=1.0-smoothstep(0.9,4.3,distance(vWorld.xz,vec2(-0.15,1.15)));",
    "  float warm1=1.0-smoothstep(0.5,2.4,distance(vWorld.xz,vec2(-1.55,2.08)));",
    "  float warm2=1.0-smoothstep(0.5,2.4,distance(vWorld.xz,vec2(1.20,2.23)));",
    "  float warm=max(warm0*0.72,max(warm1,warm2)*0.52);",
    "  warm=floor(warm*5.0)/5.0;",
    "  stone=mix(stone,warmStone,warm*0.28);",
    "  float moon=1.0-smoothstep(1.0,5.3,distance(vWorld.xz,vec2(-1.0,6.2)));",
    "  moon=floor(moon*5.0)/5.0;",
    "  stone=mix(stone,moonStone,moon*0.10*(1.0-warm));",
    "  gl_FragColor=vec4(stone,1.0);",
    "}",
  ].join("\n");

  return new THREE.ShaderMaterial({
    toneMapped:false,
    uniforms:{
      baseA:{value:new THREE.Color(0x242522)},
      baseB:{value:new THREE.Color(0x343631)},
      baseC:{value:new THREE.Color(0x474941)},
      mortar:{value:new THREE.Color(0x121410)},
      moss:{value:new THREE.Color(0x303a2b)},
      warmStone:{value:new THREE.Color(0x6a5138)},
      moonStone:{value:new THREE.Color(0x41484a)},
    },
    vertexShader,
    fragmentShader,
  });
}

export function createShadowMaterial(opacity=0.33){
  return new THREE.ShadowMaterial({
    color:0x030403,
    opacity,
    transparent:true,
    depthWrite:false,
  });
}
