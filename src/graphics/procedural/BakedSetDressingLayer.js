import * as THREE from "three";

function makeSprite(texture,width,height,name,opacity=1){
  const material=new THREE.SpriteMaterial({
    map:texture,
    transparent:true,
    alphaTest:0.035,
    depthWrite:false,
    depthTest:true,
    toneMapped:false,
    fog:false,
    opacity,
  });
  const sprite=new THREE.Sprite(material);
  sprite.name=name;
  sprite.center.set(0.5,0.06);
  sprite.scale.set(width,height,1);
  return sprite;
}

function makeGroundGlow(color,opacity,size){
  const material=new THREE.MeshBasicMaterial({
    color,
    transparent:true,
    opacity,
    depthWrite:false,
    depthTest:false,
    blending:THREE.AdditiveBlending,
    toneMapped:false,
  });
  const mesh=new THREE.Mesh(new THREE.CircleGeometry(0.5,32),material);
  mesh.rotation.x=-Math.PI/2;
  mesh.scale.set(size,size*0.58,1);
  mesh.position.y=0.018;
  return mesh;
}

export class BakedSetDressingLayer{
  constructor(scene,baked){
    this.scene=scene;
    this.baked=baked;
    this.group=new THREE.Group();
    this.group.name="baked-set-dressing-layer";
    scene.add(this.group);
    this.sprites=[];
    this.glows=[];
    this._build();
  }

  _add(key,position,scale=1){
    const entry=this.baked[key];
    const sprite=makeSprite(entry.texture,entry.viewWidth*scale,entry.viewHeight*scale,"baked-set-"+key);
    sprite.position.copy(position);
    this.group.add(sprite);
    this.sprites.push(sprite);
    return sprite;
  }

  _build(){
    this._add("tree",new THREE.Vector3(5.15,0.01,6.5),0.90);
    this._add("treeSmall",new THREE.Vector3(-6.2,0.01,4.2),0.72);
    this._add("altar",new THREE.Vector3(-0.15,0.01,1.0),1.0);
    this._add("brazier",new THREE.Vector3(-1.55,0.01,2.0),0.92);
    this._add("brazier",new THREE.Vector3(1.2,0.01,2.15),0.92);

    const altarGlow=makeGroundGlow(0xe08a43,0.14,3.7);
    altarGlow.position.set(-0.15,0.019,1.15);
    this.group.add(altarGlow);
    this.glows.push(altarGlow);

    const leftGlow=makeGroundGlow(0xd77837,0.10,2.0);
    leftGlow.position.set(-1.55,0.019,2.08);
    this.group.add(leftGlow);
    this.glows.push(leftGlow);

    const rightGlow=makeGroundGlow(0xd77837,0.10,2.0);
    rightGlow.position.set(1.2,0.019,2.23);
    this.group.add(rightGlow);
    this.glows.push(rightGlow);
  }

  update(time){
    const pulse=0.92+Math.sin(time*5.1)*0.08;
    this.glows.forEach((g,i)=>{
      g.material.opacity=(i===0?0.14:0.10)*pulse;
    });
  }

  dispose(){
    this.sprites.forEach((sprite)=>sprite.material.dispose());
    this.glows.forEach((glow)=>{
      glow.geometry.dispose();
      glow.material.dispose();
    });
    this.scene.remove(this.group);
    this.baked.dispose?.();
  }
}
