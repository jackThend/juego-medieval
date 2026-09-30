import * as THREE from "three";
import { ProceduralKnightBakeModel } from "./ProceduralKnightBakeModel.js";

export const BAKED_KNIGHT_ANIMATIONS=Object.freeze({
  idle:{frames:4,fps:2.2,loop:true},
  walk:{frames:6,fps:8.0,loop:true},
  run:{frames:6,fps:10.5,loop:true},
  attack:{frames:6,fps:15.0,loop:false},
  dash:{frames:4,fps:17.0,loop:false},
  hurt:{frames:2,fps:10.0,loop:false},
  death:{frames:6,fps:6.0,loop:false},
});

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

export class ProceduralKnightBaker{
  constructor(renderer,{width=72,height=96}={}){
    this.renderer=renderer;
    this.width=width;
    this.height=height;
    this.targets=[];

    this.scene=new THREE.Scene();
    this.scene.background=null;

    const aspect=width/height;
    const halfH=1.72;
    const halfW=halfH*aspect;
    this.camera=new THREE.OrthographicCamera(-halfW,halfW,halfH,-halfH,0.1,20);
    this.camera.position.set(4.2,3.55,4.2);
    this.camera.lookAt(0,1.08,0);
    this.camera.updateMatrixWorld();

    this.visual=new ProceduralKnightBakeModel();
    this.scene.add(this.visual.group);

    this.scene.add(new THREE.HemisphereLight(0xb8c8ce,0x171b18,1.35));

    const key=new THREE.DirectionalLight(0xe2ecec,3.0);
    key.position.set(-4.5,7.5,5.5);
    this.scene.add(key);

    const rim=new THREE.DirectionalLight(0x6e8ca5,0.75);
    rim.position.set(5.5,3.0,-5.0);
    this.scene.add(rim);

    const shadow=new THREE.Mesh(
      new THREE.CircleGeometry(0.52,32),
      new THREE.MeshBasicMaterial({
        color:0x060909,
        transparent:true,
        opacity:0.34,
        depthWrite:false,
        toneMapped:false,
      }),
    );
    shadow.rotation.x=-Math.PI/2;
    shadow.scale.set(1,0.62,1);
    shadow.position.y=0.012;
    this.scene.add(shadow);
  }

  bake(){
    const oldTarget=this.renderer.getRenderTarget();
    const oldColor=new THREE.Color();
    this.renderer.getClearColor(oldColor);
    const oldAlpha=this.renderer.getClearAlpha();
    const oldAutoClear=this.renderer.autoClear;

    this.renderer.autoClear=true;
    this.renderer.setClearColor(0x000000,0);

    const frames={};

    try{
      for(const [state,def] of Object.entries(BAKED_KNIGHT_ANIMATIONS)){
        frames[state]=Array.from({length:8},()=>[]);
        for(let dir=0;dir<8;dir+=1){
          for(let frame=0;frame<def.frames;frame+=1){
            const phase=def.frames<=1?0:(def.loop?frame/def.frames:frame/(def.frames-1));
            this.visual.setPose({
              state,
              phase,
              directionIndex:dir,
              hurt:state==="hurt",
            });

            const target=makeTarget(this.width,this.height);
            this.targets.push(target);
            this.renderer.setRenderTarget(target);
            this.renderer.clear(true,true,true);
            this.renderer.render(this.scene,this.camera);
            frames[state][dir].push(target.texture);
          }
        }
      }
    }finally{
      this.renderer.setRenderTarget(oldTarget);
      this.renderer.setClearColor(oldColor,oldAlpha);
      this.renderer.autoClear=oldAutoClear;
    }

    const targets=this.targets.slice();
    const visual=this.visual;
    return {
      frames,
      definitions:BAKED_KNIGHT_ANIMATIONS,
      width:this.width,
      height:this.height,
      dispose(){
        targets.forEach((target)=>target.dispose());
        visual.dispose();
      },
    };
  }
}
