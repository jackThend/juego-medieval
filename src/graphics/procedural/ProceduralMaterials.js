import * as THREE from "three";

let toonGradient=null;

function getToonGradient(){
  if(toonGradient)return toonGradient;
  const levels=[
    38,38,38,255,
    72,72,72,255,
    112,112,112,255,
    158,158,158,255,
    205,205,205,255,
    245,245,245,255,
  ];
  const data=new Uint8Array(levels);
  toonGradient=new THREE.DataTexture(data,6,1,THREE.RGBAFormat);
  toonGradient.magFilter=THREE.NearestFilter;
  toonGradient.minFilter=THREE.NearestFilter;
  toonGradient.generateMipmaps=false;
  toonGradient.colorSpace=THREE.NoColorSpace;
  toonGradient.needsUpdate=true;
  return toonGradient;
}

export function createProceduralToonMaterial({
  color=0x6b7372,
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
        "float cell=procHash(floor(vProcWorld*vec3(3.0,2.5,3.0)));float band=floor(cell*3.0)/2.0;float variation=mix(0.84,1.08,band);vec3 procDiffuse=diffuse*variation;vec4 diffuseColor=vec4(procDiffuse,opacity);"
      );
  };

  material.customProgramCacheKey=()=>"procedural-toon-"+family;
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
    "varying vec3 vWorld;",
    "float hash21(vec2 p){",
    "  p=fract(p*vec2(123.34,345.45));",
    "  p+=dot(p,p+34.345);",
    "  return fract(p.x*p.y);",
    "}",
    "void main(){",
    "  vec2 p=vWorld.xz*1.15;",
    "  float row=floor(p.y);",
    "  p.x+=mod(row,2.0)*0.48;",
    "  vec2 cell=floor(p);",
    "  vec2 f=fract(p);",
    "  float jitter=(hash21(cell)-0.5)*0.10;",
    "  f.x=fract(f.x+jitter);",
    "  float edge=min(min(f.x,1.0-f.x),min(f.y,1.0-f.y));",
    "  float mortarMask=1.0-step(0.045,edge);",
    "  float h=hash21(cell);",
    "  float tone=floor(h*3.0);",
    "  vec3 stone=tone<1.0?baseA:(tone<2.0?baseB:baseC);",
    "  float crackSeed=hash21(cell+17.0);",
    "  float crackLine=0.0;",
    "  if(crackSeed>0.80){",
    "    float line=abs(f.x-(0.25+f.y*0.42));",
    "    crackLine=1.0-step(0.022,line);",
    "  }",
    "  float mossSeed=hash21(cell+41.0);",
    "  float mossMask=step(0.87,mossSeed)*step(f.y,0.20)*step(f.x,0.55);",
    "  stone=mix(stone,moss,mossMask*0.65);",
    "  stone=mix(stone,mortar,mortarMask);",
    "  stone=mix(stone,mortar,crackLine*0.72);",
    "  float lightBand=floor((0.72+0.08*sin(vWorld.x*0.42))*5.0)/5.0;",
    "  stone*=0.80+lightBand*0.24;",
    "  gl_FragColor=vec4(stone,1.0);",
    "}",
  ].join("\n");

  return new THREE.ShaderMaterial({
    toneMapped:false,
    uniforms:{
      baseA:{value:new THREE.Color(0x313b3d)},
      baseB:{value:new THREE.Color(0x414b4b)},
      baseC:{value:new THREE.Color(0x58615e)},
      mortar:{value:new THREE.Color(0x1b2325)},
      moss:{value:new THREE.Color(0x314438)},
    },
    vertexShader,
    fragmentShader,
  });
}

export function createShadowMaterial(opacity=0.33){
  return new THREE.ShadowMaterial({
    color:0x050708,
    opacity,
    transparent:true,
    depthWrite:false,
  });
}