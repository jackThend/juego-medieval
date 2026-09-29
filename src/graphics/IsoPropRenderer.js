import * as THREE from "three";
import { SANCTUARY_PROPS, PROP_KIND } from "../world/SanctuaryProps.js";
import { tileToWorld } from "../world/SanctuaryGrid.js";
import { isoRenderOrder } from "./IsoDepth.js";
import { getIsoPropTexture, isoPropScale, getLightPoolTexture } from "./IsoPropArt.js";
import { DestructibleProp } from "../entities/DestructibleProp.js";

function ambientCollider(entry, world, physics) {
  if (!entry.solid) return;

  const sizes = {
    [PROP_KIND.ALTAR]: [0.55, 0.42],
    [PROP_KIND.SCRIBE_TABLE]: [0.62, 0.38],
    [PROP_KIND.BENCH]: [0.58, 0.22],
    [PROP_KIND.STATUE_BROKEN]: [0.38, 0.34],
    [PROP_KIND.BARREL]: [0.28, 0.28],
  };

  const [hx,hz]=sizes[entry.kind] ?? [0.28,0.28];
  physics.createStaticBox({
    x:world.x,
    y:0.42,
    z:world.z,
    hx,
    hy:0.42,
    hz,
  });
}

export class IsoPropRenderer {
  constructor(scene, physics, materials) {
    this.scene=scene;
    this.physics=physics;
    this.materials=materials;
    this.group=new THREE.Group();
    this.group.name="iso-props";
    this.scene.add(this.group);
    this.world=new THREE.Vector3();
    this.props=[];
    this.animated=[];
    this.destructibles=[];
    this.shrineSprite=null;
  }

  build() {
    SANCTUARY_PROPS.forEach((entry,index)=>{
      tileToWorld(entry.col,entry.row,this.world);

      if(entry.interactive){
        const prop=new DestructibleProp({
          scene:this.scene,
          materials:this.materials,
          position:this.world.clone(),
          type:entry.kind===PROP_KIND.URN?"urn":"crate",
          rotation:0,
          health:entry.kind===PROP_KIND.URN?42:52,
          variant:entry.variant ?? 0,
        });
        prop.pixelSprite.renderOrder=isoRenderOrder(this.world.x,this.world.z,0,22);
        this.destructibles.push(prop);
        return;
      }

      const material=new THREE.SpriteMaterial({
        map:getIsoPropTexture(entry.kind,entry.variant??0,"normal",0),
        transparent:true,
        alphaTest:0.05,
        depthTest:false,
        depthWrite:false,
        toneMapped:false,
        fog:false,
      });
      const sprite=new THREE.Sprite(material);
      const [w,h]=isoPropScale(entry.kind);
      sprite.center.set(0.5,0.03);
      sprite.scale.set(w,h,1);
      sprite.position.set(this.world.x,0.015,this.world.z);
      sprite.renderOrder=isoRenderOrder(this.world.x,this.world.z,0,20+(entry.sortOffset??0));
      sprite.userData.prop=entry;
      sprite.name="prop-"+entry.kind+"-"+index;
      this.group.add(sprite);
      this.props.push(sprite);

      if(entry.stateful==="shrine") this.shrineSprite=sprite;

      if(entry.kind===PROP_KIND.CANDLES){
        this.animated.push({sprite,entry,kind:"candles"});
      }

      if(entry.glow) this._addGlow(entry,this.world,index);
      ambientCollider(entry,this.world,this.physics);
    });

    return this;
  }

  _addGlow(entry,world,index){
    const strong=entry.glow==="warmStrong";
    const texture=getLightPoolTexture(strong?"strong":"small");
    const material=new THREE.MeshBasicMaterial({
      map:texture,
      transparent:true,
      depthWrite:false,
      depthTest:false,
      blending:THREE.AdditiveBlending,
      toneMapped:false,
    });
    const size=strong?3.6:entry.glow==="warmTiny"?1.55:2.1;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material);
    mesh.rotation.x=-Math.PI/2;
    mesh.position.set(world.x,0.018,world.z);
    mesh.renderOrder=isoRenderOrder(world.x,world.z,0,-8);
    mesh.name="prop-glow-"+index;
    this.group.add(mesh);
  }

  setShrineActive(active){
    if(!this.shrineSprite) return;
    const entry=this.shrineSprite.userData.prop;
    this.shrineSprite.material.map=getIsoPropTexture(
      PROP_KIND.ALTAR,
      entry.variant??0,
      active?"active":"normal",
      0,
    );
    this.shrineSprite.material.needsUpdate=true;
  }

  update(time){
    const frame=Math.floor(time*5)&1;
    for(const item of this.animated){
      item.sprite.material.map=getIsoPropTexture(
        item.entry.kind,
        item.entry.variant??0,
        "normal",
        frame,
      );
      item.sprite.material.needsUpdate=true;
    }
  }
}
