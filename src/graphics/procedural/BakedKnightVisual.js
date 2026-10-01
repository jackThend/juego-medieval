import * as THREE from "three";

function directionIndexFromFacing(facing){
  const angle=Math.atan2(-facing.x,-facing.z);
  const normalized=(angle+Math.PI*2)%(Math.PI*2);
  return Math.round(normalized/(Math.PI/4))%8;
}

export class BakedKnightVisual{
  constructor(baked){
    this.baked=baked;
    const initial=baked.frames.idle[0][0];
    this.material=new THREE.SpriteMaterial({
      map:initial,
      transparent:true,
      alphaTest:0.04,
      depthWrite:false,
      depthTest:true,
      toneMapped:false,
      fog:false,
    });
    this.sprite=new THREE.Sprite(this.material);
    this.sprite.name="baked-knight-sprite";
    this.sprite.center.set(0.5,0.08);
    this.sprite.scale.set(1.65,2.20,1);

    this.group=new THREE.Group();
    this.group.name="baked-knight-visual";
    this.group.add(this.sprite);

    this.state="idle";
    this.direction=0;
    this.frame=0;
  }

  update({time,facing,state,attackProgress=0,dashProgress=0,deathProgress=0}){
    const dir=directionIndexFromFacing(facing);
    const def=this.baked.definitions[state]??this.baked.definitions.idle;
    let frame=0;

    if(state==="attack")frame=Math.min(def.frames-1,Math.floor(attackProgress*def.frames));
    else if(state==="dash")frame=Math.min(def.frames-1,Math.floor(dashProgress*def.frames));
    else if(state==="death")frame=Math.min(def.frames-1,Math.floor(deathProgress*def.frames));
    else frame=Math.floor(time*def.fps)%def.frames;

    if(state!==this.state||dir!==this.direction||frame!==this.frame){
      this.material.map=this.baked.frames[state][dir][frame];
      this.material.needsUpdate=true;
      this.state=state;
      this.direction=dir;
      this.frame=frame;
    }

    const squash=state==="dash"?0.96:1;
    this.sprite.scale.set(1.65/squash,2.20*squash,1);
    this.material.opacity=state==="death"&&deathProgress>0.94?0.88:1;
  }

  dispose(){
    this.material.dispose();
    this.baked.dispose?.();
  }
}
