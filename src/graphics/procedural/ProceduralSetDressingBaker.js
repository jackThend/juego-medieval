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
  mesh(g,new THREE.CylinderGeometry(0.20,0.15,0.18,16),materials.gold,[0,1.24,0]);
  mesh(g,new THREE.SphereGeometry(0.13,16,10),materials.ember,[0,1.39,0],[0,0,0],[1,0.75,1]);
  return g;
}

function makeBrazier(materials){
  const g=new THREE.Group();
  g.name="procedural-brazier";
  mesh(g,new THREE.CylinderGeometry(0.24,0.30,0.10,16),materials.iron,[0,0.08,0]);
  mesh(g,new THREE.CylinderGeometry(0.08,0.11,0.74,12),materials.iron,[0,0.47,0]);
  mesh(g,new THREE.CylinderGeometry(0.31,0.20,0.16,16),materials.iron,[0,0.90,0]);
  mesh(g,new THREE.SphereGeometry(0.16,14,9),materials.ember,[0,1.03,0],[0,0,0],[1,1.3,1]);
  mesh(g,new THREE.SphereGeometry(0.09,12,8),materials.emberHot,[0.03,1.13,0],[0,0,0],[0.75,1.2,0.75]);
  return g;
}

export class ProceduralSetDressingBaker{
  constructor(renderer){
    this.renderer=renderer;
    this.targets=[];
  }

  _materials(){
    return {
      stone:createProceduralToonMaterial({color:0x676e6c,family:"set-stone"}),
      darkStone:createProceduralToonMaterial({color:0x333b3b,family:"set-dark"}),
      trim:createProceduralToonMaterial({color:0x8b8879,family:"set-trim"}),
      gold:createProceduralToonMaterial({color:0xa47e3d,family:"set-gold"}),
      iron:createProceduralToonMaterial({color:0x383e40,family:"set-iron"}),
      ember:createProceduralToonMaterial({color:0xd55d2f,family:"set-ember",emissive:0x6d1f0e}),
      emberHot:createProceduralToonMaterial({color:0xf0b35d,family:"set-ember-hot",emissive:0xb34b1c}),
      bark:createProceduralToonMaterial({color:0x46382d,family:"set-bark"}),
      barkDark:createProceduralToonMaterial({color:0x24211d,family:"set-bark-dark"}),
      leaf:createProceduralToonMaterial({color:0x294334,family:"set-leaf"}),
      leafDark:createProceduralToonMaterial({color:0x14261e,family:"set-leaf-dark"}),
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
    scene.add(new THREE.HemisphereLight(0x9fb4bd,0x111512,warm?0.72:1.18));

    const key=new THREE.DirectionalLight(warm?0xd6b27a:0xcbdde2,warm?1.35:2.45);
    key.position.set(-4.5,7.5,5.5);
    scene.add(key);

    if(warm){
      const fire=new THREE.PointLight(0xff9a4a,6.0,5.0,2.0);
      fire.position.set(0,1.55,0.25);
      scene.add(fire);
    }else{
      const rim=new THREE.DirectionalLight(0x647f91,0.48);
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
      width:132,height:176,halfH:2.35,focusY:1.65,yaw:-0.35,
    });

    const treeSmall=this._render({
      object:createProceduralTree({bark:m.bark,barkDark:m.barkDark,leaf:m.leaf,leafDark:m.leafDark,seed:77}),
      width:112,height:156,halfH:2.10,focusY:1.55,yaw:0.55,
    });

    const altar=this._render({
      object:makeAltar(m),width:112,height:112,halfH:1.40,focusY:0.65,warm:true,yaw:0.02,
    });

    const brazier=this._render({
      object:makeBrazier(m),width:72,height:104,halfH:1.28,focusY:0.58,warm:true,
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
