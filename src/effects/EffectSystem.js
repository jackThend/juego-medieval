import * as THREE from "three";
import { isoRenderOrder } from "../graphics/IsoDepth.js";
import {
  getSlashFxTexture,
  getImpactFxTexture,
  getParticleFxTexture,
  getSanctumFxTexture,
} from "../graphics/PixelFxArt.js";

function spriteMaterial(map){
  return new THREE.SpriteMaterial({
    map,
    transparent:true,
    depthWrite:false,
    depthTest:false,
    toneMapped:false,
    fog:false,
  });
}

export class EffectSystem {
  constructor(scene,cameraRig){
    this.scene=scene;
    this.cameraRig=cameraRig;
    this.shakeTime=0;
    this.shakePower=0;
    this.baseOffset=cameraRig.offset.clone();

    this.slashCursor=0;
    this.slashPool=Array.from({length:10},()=>{
      const sprite=new THREE.Sprite(spriteMaterial(getSlashFxTexture(false,0)));
      sprite.visible=false;
      sprite.scale.set(1.55,1.55,1);
      sprite.userData.life=0;
      sprite.userData.maxLife=0.19;
      sprite.userData.enemy=false;
      scene.add(sprite);
      return sprite;
    });

    this.impactCursor=0;
    this.impactPool=Array.from({length:14},()=>{
      const sprite=new THREE.Sprite(spriteMaterial(getImpactFxTexture("steel",0)));
      sprite.visible=false;
      sprite.scale.set(0.8,0.8,1);
      sprite.userData.life=0;
      sprite.userData.maxLife=0.22;
      sprite.userData.kind="steel";
      scene.add(sprite);
      return sprite;
    });

    this.particleCursor=0;
    this.particlePool=Array.from({length:64},(_,i)=>{
      const sprite=new THREE.Sprite(spriteMaterial(getParticleFxTexture("steel",i%4,0)));
      sprite.visible=false;
      sprite.scale.set(0.11,0.11,1);
      sprite.userData.active=false;
      sprite.userData.life=0;
      sprite.userData.maxLife=1;
      sprite.userData.kind="steel";
      sprite.userData.variant=i%4;
      sprite.userData.velocity=new THREE.Vector3();
      scene.add(sprite);
      return sprite;
    });

    this.sanctumPool=Array.from({length:2},()=>{
      const sprite=new THREE.Sprite(spriteMaterial(getSanctumFxTexture(0)));
      sprite.visible=false;
      sprite.scale.set(3.2,3.2,1);
      sprite.userData.life=0;
      sprite.userData.maxLife=0.72;
      scene.add(sprite);
      return sprite;
    });
    this.sanctumCursor=0;
  }

  _screenAngle(direction){
    const right=this.cameraRig.groundRight;
    const forward=this.cameraRig.groundForward;
    const sx=direction.x*right.x+direction.z*right.y;
    const sy=-(direction.x*forward.x+direction.z*forward.y)*0.58;
    return Math.atan2(sy,sx);
  }

  slash(position,direction,enemy=false){
    const sprite=this.slashPool[this.slashCursor];
    this.slashCursor=(this.slashCursor+1)%this.slashPool.length;
    sprite.visible=true;
    sprite.userData.life=sprite.userData.maxLife;
    sprite.userData.enemy=enemy;
    sprite.position.set(position.x,position.y+0.95,position.z);
    sprite.scale.setScalar(enemy?1.9:1.55);
    sprite.material.rotation=this._screenAngle(direction)+(enemy?0.28:-0.12);
    sprite.material.map=getSlashFxTexture(enemy,0);
    sprite.material.needsUpdate=true;
    sprite.renderOrder=isoRenderOrder(position.x,position.z,position.y,42);
  }

  impact(position,kind="steel",scale=1){
    const sprite=this.impactPool[this.impactCursor];
    this.impactCursor=(this.impactCursor+1)%this.impactPool.length;
    sprite.visible=true;
    sprite.userData.life=sprite.userData.maxLife;
    sprite.userData.kind=kind;
    sprite.position.copy(position);
    sprite.scale.setScalar(0.78*scale);
    sprite.material.map=getImpactFxTexture(kind,0);
    sprite.material.needsUpdate=true;
    sprite.renderOrder=isoRenderOrder(position.x,position.z,position.y,48);
  }

  burst(position,direction,amount=10,speed=5,kind="steel"){
    this.impact(position,kind,kind==="sanctum"?1.5:1);

    const count=Math.min(amount,kind==="sanctum"?22:14);
    for(let n=0;n<count;n++){
      const sprite=this.particlePool[this.particleCursor];
      this.particleCursor=(this.particleCursor+1)%this.particlePool.length;
      sprite.visible=true;
      sprite.userData.active=true;
      sprite.userData.life=0.24+Math.random()*0.24;
      sprite.userData.maxLife=sprite.userData.life;
      sprite.userData.kind=kind;
      sprite.userData.variant=n%4;
      sprite.userData.velocity.set(
        direction.x*speed*(0.28+Math.random()*0.28)+(Math.random()-0.5)*1.5,
        0.35+Math.random()*1.25,
        direction.z*speed*(0.28+Math.random()*0.28)+(Math.random()-0.5)*1.5,
      );
      sprite.position.copy(position);
      sprite.material.map=getParticleFxTexture(kind,n%4,0);
      sprite.material.needsUpdate=true;
      sprite.renderOrder=isoRenderOrder(position.x,position.z,position.y,50);
    }

    if(kind==="sanctum")this.sanctumBurst(position);
  }

  sanctumBurst(position){
    const sprite=this.sanctumPool[this.sanctumCursor];
    this.sanctumCursor=(this.sanctumCursor+1)%this.sanctumPool.length;
    sprite.visible=true;
    sprite.userData.life=sprite.userData.maxLife;
    sprite.position.set(position.x,position.y+0.9,position.z);
    sprite.material.map=getSanctumFxTexture(0);
    sprite.material.needsUpdate=true;
    sprite.renderOrder=isoRenderOrder(position.x,position.z,position.y,46);
  }

  shake(duration=0.12,power=0.1){
    this.shakeTime=Math.max(this.shakeTime,duration);
    this.shakePower=Math.max(this.shakePower,power);
  }

  update(dt){
    for(const sprite of this.slashPool){
      if(!sprite.visible)continue;
      sprite.userData.life-=dt;
      if(sprite.userData.life<=0){
        sprite.visible=false;
        continue;
      }
      const t=1-sprite.userData.life/sprite.userData.maxLife;
      const frame=Math.min(4,Math.floor(t*5));
      sprite.material.map=getSlashFxTexture(sprite.userData.enemy,frame);
      sprite.material.needsUpdate=true;
    }

    for(const sprite of this.impactPool){
      if(!sprite.visible)continue;
      sprite.userData.life-=dt;
      if(sprite.userData.life<=0){
        sprite.visible=false;
        continue;
      }
      const t=1-sprite.userData.life/sprite.userData.maxLife;
      const frame=Math.min(4,Math.floor(t*5));
      sprite.material.map=getImpactFxTexture(sprite.userData.kind,frame);
      sprite.material.needsUpdate=true;
    }

    for(const sprite of this.particlePool){
      if(!sprite.userData.active)continue;
      sprite.userData.life-=dt;
      if(sprite.userData.life<=0){
        sprite.userData.active=false;
        sprite.visible=false;
        continue;
      }
      sprite.userData.velocity.y-=8.5*dt;
      sprite.position.addScaledVector(sprite.userData.velocity,dt);

      const t=1-sprite.userData.life/sprite.userData.maxLife;
      const age=Math.min(2,Math.floor(t*3));
      sprite.material.map=getParticleFxTexture(
        sprite.userData.kind,
        sprite.userData.variant,
        age,
      );
      sprite.material.needsUpdate=true;
      const s=age===0?0.11:age===1?0.09:0.065;
      sprite.scale.setScalar(s);
      sprite.renderOrder=isoRenderOrder(
        sprite.position.x,
        sprite.position.z,
        sprite.position.y,
        50,
      );
    }

    for(const sprite of this.sanctumPool){
      if(!sprite.visible)continue;
      sprite.userData.life-=dt;
      if(sprite.userData.life<=0){
        sprite.visible=false;
        continue;
      }
      const t=1-sprite.userData.life/sprite.userData.maxLife;
      const frame=Math.min(7,Math.floor(t*8));
      sprite.material.map=getSanctumFxTexture(frame);
      sprite.material.needsUpdate=true;
    }

    if(this.shakeTime>0){
      this.shakeTime=Math.max(0,this.shakeTime-dt);
      const step=Math.max(0.001,this.cameraRig.pixelWorldSize||0.02);
      const power=this.shakePower;
      const jx=Math.round(((Math.random()-0.5)*power)/step)*step;
      const jy=Math.round(((Math.random()-0.5)*power*0.5)/step)*step;
      const jz=Math.round(((Math.random()-0.5)*power)/step)*step;
      this.cameraRig.offset.copy(this.baseOffset).add(new THREE.Vector3(jx,jy,jz));
      this.shakePower*=Math.exp(-9*dt);
    }else{
      this.cameraRig.offset.copy(this.baseOffset);
    }
  }
}
