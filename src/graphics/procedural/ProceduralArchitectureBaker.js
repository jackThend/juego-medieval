import * as THREE from "three";
import {
  createProceduralToonMaterial,
} from "./ProceduralMaterials.js";
import {
  createProceduralArch,
  createProceduralColumn,
  createProceduralWall,
  createProceduralStairs,
} from "./ProceduralGeometryFactory.js";

function makeTarget(width,height){
  const target=new THREE.WebGLRenderTarget(width,height,{
    format:THREE.RGBAFormat,
    type:THREE.UnsignedByteType,
    depthBuffer:true,
    stencilBuffer:false,
  });
  target.texture.magFilter=THREE.NearestFilter;
  target.texture.minFilter=THREE.NearestFilter;
  target.texture.generateMipmaps=false;
  target.texture.colorSpace=THREE.SRGBColorSpace;
  return target;
}

function makeShadow(width,depth,opacity=0.28){
  const shadow=new THREE.Mesh(
    new THREE.CircleGeometry(0.5,32),
    new THREE.MeshBasicMaterial({
      color:0x050605,
      transparent:true,
      opacity,
      depthWrite:false,
      toneMapped:false,
    }),
  );
  shadow.rotation.x=-Math.PI/2;
  shadow.scale.set(width,depth,1);
  shadow.position.y=0.012;
  return shadow;
}

export class ProceduralArchitectureBaker{
  constructor(renderer){
    this.renderer=renderer;
    this.targets=[];
  }

  _materials(){
    return {
      stone:createProceduralToonMaterial({color:0x6f7068,family:"bake-arch-stone-9f"}),
      darkStone:createProceduralToonMaterial({color:0x3e413b,family:"bake-arch-dark-9f"}),
      trim:createProceduralToonMaterial({color:0x8f8b7c,family:"bake-arch-trim-9f"}),
    };
  }

  _render({object,width,height,halfH,focusY=0.8,yaw=0,shadow=[1.4,0.62,0.26]}){
    const scene=new THREE.Scene();
    scene.background=null;

    const aspect=width/height;
    const halfW=halfH*aspect;
    const camera=new THREE.OrthographicCamera(-halfW,halfW,halfH,-halfH,0.1,30);
    camera.position.set(4.2,3.55,4.2);
    camera.lookAt(0,focusY,0);
    camera.updateMatrixWorld();

    object.rotation.y=yaw;
    scene.add(object);
    scene.add(makeShadow(shadow[0],shadow[1],shadow[2]));

    scene.add(new THREE.HemisphereLight(0xb5b7ad,0x191b17,1.18));

    const key=new THREE.DirectionalLight(0xe0ded0,2.75);
    key.position.set(-4.5,7.5,5.5);
    scene.add(key);

    const rim=new THREE.DirectionalLight(0x758084,0.42);
    rim.position.set(5.5,3.0,-5.0);
    scene.add(rim);

    const target=makeTarget(width,height);
    this.targets.push(target);

    const oldTarget=this.renderer.getRenderTarget();
    const oldColor=new THREE.Color();
    this.renderer.getClearColor(oldColor);
    const oldAlpha=this.renderer.getClearAlpha();
    const oldAutoClear=this.renderer.autoClear;

    this.renderer.autoClear=true;
    this.renderer.setClearColor(0x000000,0);

    try{
      this.renderer.setRenderTarget(target);
      this.renderer.clear(true,true,true);
      this.renderer.render(scene,camera);
    }finally{
      this.renderer.setRenderTarget(oldTarget);
      this.renderer.setClearColor(oldColor,oldAlpha);
      this.renderer.autoClear=oldAutoClear;
    }

    return {
      texture:target.texture,
      viewWidth:halfW*2,
      viewHeight:halfH*2,
    };
  }

  bakeLibrary(){
    const mats=this._materials();

    const column=this._render({
      object:createProceduralColumn(mats),
      width:124,
      height:176,
      halfH:1.55,
      focusY:1.05,
      shadow:[1.25,0.48,0.24],
    });

    const arch=this._render({
      object:createProceduralArch(mats),
      width:192,
      height:184,
      halfH:1.78,
      focusY:1.12,
      yaw:Math.PI/10,
      shadow:[2.25,0.72,0.26],
    });

    const rearWall=this._render({
      object:createProceduralWall({
        ...mats,width:4.8,height:1.85,depth:0.48,seed:17,broken:true,
      }),
      width:248,
      height:168,
      halfH:1.62,
      focusY:0.72,
      yaw:0.03,
      shadow:[3.2,0.58,0.23],
    });

    const sideWall=this._render({
      object:createProceduralWall({
        ...mats,width:3.5,height:1.65,depth:0.46,seed:29,broken:true,
      }),
      width:192,
      height:168,
      halfH:1.52,
      focusY:0.68,
      yaw:Math.PI/2,
      shadow:[2.2,0.55,0.22],
    });

    const stairs=this._render({
      object:createProceduralStairs({
        ...mats,width:2.35,steps:5,depth:2.0,height:0.70,
      }),
      width:184,
      height:136,
      halfH:1.18,
      focusY:0.30,
      shadow:[1.9,0.85,0.20],
    });

    const targets=this.targets.slice();
    const materials=Object.values(mats);
    return {
      column,
      arch,
      rearWall,
      sideWall,
      stairs,
      dispose(){
        targets.forEach((target)=>target.dispose());
        materials.forEach((material)=>material.dispose?.());
      },
    };
  }
}
