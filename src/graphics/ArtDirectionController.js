import * as THREE from "three";

const PALETTES={
  neutral:{background:0x101816,top:0x162439,horizon:0x263a33,bottom:0x0f1815},
  corruption:{background:0x171315,top:0x201d2b,horizon:0x352a2a,bottom:0x151111},
  sanctum:{background:0x111a1b,top:0x192a3e,horizon:0x2d443c,bottom:0x111d19},
};

function smoothstep(edge0,edge1,value){
  const x=THREE.MathUtils.clamp((value-edge0)/(edge1-edge0),0,1);
  return x*x*(3-2*x);
}

export class ArtDirectionController {
  constructor(scene,{enemy,world}={}){
    this.scene=scene;
    this.enemy=enemy;
    this.world=world;
    this.playerPosition=new THREE.Vector3();

    const art=scene.userData.artDirection;
    if(!art)throw new Error("GameScene no expone scene.userData.artDirection");

    this.skyMaterial=art.skyMaterial;
    this.current={
      background:scene.background.clone(),
      top:this.skyMaterial.uniforms.topColor.value.clone(),
      horizon:this.skyMaterial.uniforms.horizonColor.value.clone(),
      bottom:this.skyMaterial.uniforms.bottomColor.value.clone(),
    };
    this.target={
      background:new THREE.Color(PALETTES.neutral.background),
      top:new THREE.Color(PALETTES.neutral.top),
      horizon:new THREE.Color(PALETTES.neutral.horizon),
      bottom:new THREE.Color(PALETTES.neutral.bottom),
    };
    this.a=new THREE.Color();
  }

  update(dt,playerPosition){
    this.playerPosition.copy(playerPosition);

    const enemyAlive=!this.enemy?.dead;
    const shrineActive=Boolean(this.world?.shrine?.activated);
    const arenaDistance=Math.abs(this.playerPosition.z+5.6);
    const corruption=enemyAlive?1-smoothstep(2.0,7.5,arenaDistance):0;
    const shrineApproach=!enemyAlive?smoothstep(-4.5,-9.5,-this.playerPosition.z):0;
    const sanctum=Math.max(shrineApproach,shrineActive?1:0);

    for(const key of ["background","top","horizon","bottom"]){
      const neutral=new THREE.Color(PALETTES.neutral[key]);
      const corrupt=new THREE.Color(PALETTES.corruption[key]);
      const holy=new THREE.Color(PALETTES.sanctum[key]);
      this.a.copy(neutral).lerp(corrupt,corruption*0.18);
      this.target[key].copy(this.a).lerp(holy,sanctum*(shrineActive?0.48:0.28));
    }

    const t=1-Math.exp(-1.6*dt);
    for(const key of ["background","top","horizon","bottom"]){
      this.current[key].lerp(this.target[key],t);
    }

    this.scene.background.copy(this.current.background);
    this.skyMaterial.uniforms.topColor.value.copy(this.current.top);
    this.skyMaterial.uniforms.horizonColor.value.copy(this.current.horizon);
    this.skyMaterial.uniforms.bottomColor.value.copy(this.current.bottom);
  }
}
