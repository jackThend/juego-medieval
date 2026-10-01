import * as THREE from "three";
import { createProceduralToonMaterial } from "./ProceduralMaterials.js";
import { createProceduralTree } from "./ProceduralGeometryFactory.js";

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

function mesh(parent,geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  const m=new THREE.Mesh(geometry,material);
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.scale.set(...scale);
  m.castShadow=true;
  m.receiveShadow=true;
  parent.add(m);
  return m;
}

function makeAltar(materials){
  const g=new THREE.Group();
  g.name="procedural-altar";
  mesh(g,new THREE.BoxGeometry(1.55,0.18,0.78),materials.darkStone,[0,0.09,0]);
  mesh(g,new THREE.BoxGeometry(1.32,0.24,0.66),materials.stone,[0,0.29,0]);
  mesh(g,new THREE.BoxGeometry(1.12,0.62,0.54),materials.stone,[0,0.70,0]);
  mesh(g,new THREE.BoxGeometry(1.38,0.16,0.72),materials.trim,[0,1.08,0]);
  mesh(g,new THREE.BoxGeometry(0.16,0.54,0.08),materials.gold,[0,0.71,-0.31]);
  mesh(g,new THREE.BoxGeometry(0.58,0.12,0.08),materials.gold,[0,0.78,-0.315]);
  mesh(g,new THREE.CylinderGeometry(0.20,0.15,0.18,18),materials.gold,[0,1.24,0]);
  mesh(g,new THREE.SphereGeometry(0.13,18,12),materials.ember,[0,1.39,0],[0,0,0],[1,0.75,1]);
  return g;
}

function makeBrazier(materials){
  const g=new THREE.Group();
  g.name="procedural-brazier";
  mesh(g,new THREE.CylinderGeometry(0.24,0.30,0.10,18),materials.iron,[0,0.08,0]);
  mesh(g,new THREE.CylinderGeometry(0.08,0.11,0.74,14),materials.iron,[0,0.47,0]);
  mesh(g,new THREE.CylinderGeometry(0.31,0.20,0.16,18),materials.iron,[0,0.90,0]);
  mesh(g,new THREE.SphereGeometry(0.16,16,10),materials.ember,[0,1.03,0],[0,0,0],[1,1.3,1]);
  mesh(g,new THREE.SphereGeometry(0.09,14,9),materials.emberHot,[0.03,1.13,0],[0,0,0],[0.75,1.2,0.75]);
  return g;
}

export class ProceduralSetDressingBaker{
  constructor(renderer){
    this.renderer=renderer;
    this.targets=[];
  }

  _materials(){
    return {
      stone:createProceduralToonMaterial({color:0x6b6a60,family:"set-stone-9f"}),
      darkStone:createProceduralToonMaterial({color:0x393a34,family:"set-dark-9f"}),
      trim:createProceduralToonMaterial({color:0x8d8778,family:"set-trim-9f"}),
      gold:createProceduralToonMaterial({color:0x9a793f,family:"set-gold-9f"}),
      iron:createProceduralToonMaterial({color:0x343634,family:"set-iron-9f"}),
      ember:createProceduralToonMaterial({color:0xb9552f,family:"set-ember-9f",emissive:0x5b2412}),
      emberHot:createProceduralToonMaterial({color:0xd8a45d,family:"set-ember-hot-9f",emissive:0x8d4a20}),
      bark:createProceduralToonMaterial({color:0x49382b,family:"set-bark-9f"}),
      barkDark:createProceduralToonMaterial({color:0x27231d,family:"set-bark-dark-9f"}),
      leaf:createProceduralToonMaterial({color:0x3a4930,family:"set-leaf-9f"}),
      leafDark:createProceduralToonMaterial({color:0x20291d,family:"set-leaf-dark-9f"}),
    };
  }

  _render({object,width,height,halfH,focusY=0.8,warm=false,yaw=0}){
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
    scene.add(new THREE.HemisphereLight(warm?0xb8ab91:0xaeb2a7,0x171914,warm?0.68:1.08));

    const key=new THREE.DirectionalLight(warm?0xd0ad74:0xd2d1c4,warm?1.25:2.25);
    key.position.set(-4.5,7.5,5.5);
    scene.add(key);

    if(warm){
      const fire=new THREE.PointLight(0xe89448,4.8,5.0,2.0);
      fire.position.set(0,1.55,0.25);
      scene.add(fire);
    }else{
      const rim=new THREE.DirectionalLight(0x727b77,0.34);
      rim.position.set(5.5,3.0,-5.0);
      scene.add(rim);
    }

    const target=makeTarget(width,height);
    this.targets.push(target);
    const oldTarget=this.renderer.getRenderTarget();
    const oldColor=new THREE.Color();
    this.renderer.getClearColor(oldColor);
    const oldAlpha=this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000,0);

    try{
      this.renderer.setRenderTarget(target);
      this.renderer.clear(true,true,true);
      this.renderer.render(scene,camera);
    }finally{
      this.renderer.setRenderTarget(oldTarget);
      this.renderer.setClearColor(oldColor,oldAlpha);
    }

    return {texture:target.texture,viewWidth:halfW*2,viewHeight:halfH*2};
  }

  bakeLibrary(){
    const m=this._materials();

    const tree=this._render({
      object:createProceduralTree({bark:m.bark,barkDark:m.barkDark,leaf:m.leaf,leafDark:m.leafDark,seed:41}),
      width:184,height:248,halfH:2.35,focusY:1.65,yaw:-0.35,
    });

    const treeSmall=this._render({
      object:createProceduralTree({bark:m.bark,barkDark:m.barkDark,leaf:m.leaf,leafDark:m.leafDark,seed:77}),
      width:160,height:220,halfH:2.10,focusY:1.55,yaw:0.55,
    });

    const altar=this._render({
      object:makeAltar(m),width:160,height:160,halfH:1.40,focusY:0.65,warm:true,yaw:0.02,
    });

    const brazier=this._render({
      object:makeBrazier(m),width:104,height:148,halfH:1.28,focusY:0.58,warm:true,
    });

    const targets=this.targets.slice();
    const materials=Object.values(m);
    return {
      tree,treeSmall,altar,brazier,
      dispose(){
        targets.forEach((target)=>target.dispose());
        materials.forEach((material)=>material.dispose?.());
      },
    };
  }
}
