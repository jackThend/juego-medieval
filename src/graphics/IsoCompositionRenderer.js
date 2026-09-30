import * as THREE from "three";
import { isoRenderOrder } from "./IsoDepth.js";
import {
  getSanctuaryBackdropTexture,
  getFloorCompositionTexture,
  getFrameSpriteTexture,
} from "./IsoCompositionArt.js";

function groundMaterial(map){
  return new THREE.MeshBasicMaterial({
    map,
    transparent:true,
    depthWrite:false,
    depthTest:false,
    toneMapped:false,
  });
}

export class IsoCompositionRenderer {
  constructor(scene){
    this.scene=scene;
    this.group=new THREE.Group();
    this.group.name="iso-composition";
    scene.add(this.group);
  }

  build(){
    this._backdrop();
    this._floorDecals();
    this._worldFrame();
    return this;
  }

  _backdrop(){
    const material=new THREE.MeshBasicMaterial({
      map:getSanctuaryBackdropTexture(),
      color:0xffffff,
      toneMapped:false,
      depthWrite:false,
      depthTest:false,
    });
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(25.5,25.5),material);
    plane.rotation.x=-Math.PI/2;
    plane.position.y=-0.035;
    plane.renderOrder=-20;
    plane.name="sanctuary-dark-ground";
    this.group.add(plane);
  }

  _floorDecals(){
    const add=(kind,x,z,w,h,order=3)=>{
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),groundMaterial(getFloorCompositionTexture(kind)));
      mesh.rotation.x=-Math.PI/2;
      mesh.position.set(x,0.017,z);
      mesh.renderOrder=order;
      mesh.name="composition-"+kind;
      this.group.add(mesh);
    };

    // Focal hierarchy: entrance -> medallion -> boss -> altar.
    add("threshold",0,5.15,4.4,1.55,2);
    add("medallion",0,0.35,3.0,3.0,3);
    add("moon",-0.9,-1.6,5.9,4.15,4);
    add("arena",0,-5.5,4.8,4.0,5);
  }

  _worldFrame(){
    const add=(kind,x,z,w,h,variant=0,layer=0)=>{
      const material=new THREE.SpriteMaterial({
        map:getFrameSpriteTexture(kind,variant),
        transparent:true,
        alphaTest:0.04,
        depthWrite:false,
        depthTest:false,
        toneMapped:false,
        fog:false,
      });
      const sprite=new THREE.Sprite(material);
      sprite.center.set(0.5,0.03);
      sprite.scale.set(w,h,1);
      sprite.position.set(x,0.01,z);
      sprite.renderOrder=layer||isoRenderOrder(x,z,0,4);
      sprite.name="frame-"+kind+"-"+variant;
      this.group.add(sprite);
    };

    // Fondo: siluetas más oscuras que la arquitectura principal.
    add("tree",-8.4,-8.6,3.2,4.9,0);
    add("ruin",-5.8,-9.3,2.7,3.5,0);
    add("tree",7.7,-8.5,3.0,4.65,1);
    add("ruin",9.0,-3.8,2.45,3.15,1);
    add("tree",-9.0,-1.5,2.7,4.25,1);

    // Primer plano: sólo en esquinas; crea profundidad sin tapar el camino.
    add("ruin",-8.7,8.8,2.8,3.55,0,26000);
    add("tree",8.8,9.0,3.45,5.2,1,26010);
  }
}
