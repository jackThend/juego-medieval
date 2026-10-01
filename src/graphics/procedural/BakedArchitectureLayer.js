import * as THREE from "three";

function makeSprite(texture,width,height,name){
  const material=new THREE.SpriteMaterial({
    map:texture,
    transparent:true,
    alphaTest:0.035,
    depthWrite:false,
    depthTest:true,
    toneMapped:false,
    fog:false,
  });
  const sprite=new THREE.Sprite(material);
  sprite.name=name;
  sprite.center.set(0.5,0.06);
  sprite.scale.set(width,height,1);
  return sprite;
}

export class BakedArchitectureLayer{
  constructor(scene,baked){
    this.scene=scene;
    this.baked=baked;
    this.group=new THREE.Group();
    this.group.name="baked-architecture-layer";
    scene.add(this.group);
    this.sprites=[];
    this._build();
  }

  _add(key,position,scaleMultiplier=1){
    const entry=this.baked[key];
    const sprite=makeSprite(
      entry.texture,
      entry.viewWidth*scaleMultiplier,
      entry.viewHeight*scaleMultiplier,
      "baked-"+key,
    );
    sprite.position.copy(position);
    this.group.add(sprite);
    this.sprites.push(sprite);
    return sprite;
  }

  _build(){
    this._add("column",new THREE.Vector3(-2.35,0.01,6.8),1.0);
    this._add("stairs",new THREE.Vector3(1.75,0.01,5.45),1.0);
    this._add("arch",new THREE.Vector3(1.75,0.70,3.95),1.0);
    this._add("rearWall",new THREE.Vector3(-1.9,0.01,2.15),1.0);
    this._add("sideWall",new THREE.Vector3(-5.15,0.01,7.2),1.0);
  }

  dispose(){
    this.sprites.forEach((sprite)=>sprite.material.dispose());
    this.scene.remove(this.group);
    this.baked.dispose?.();
  }
}
