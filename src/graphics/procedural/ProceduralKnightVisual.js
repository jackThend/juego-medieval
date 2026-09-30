import * as THREE from "three";
import { createProceduralToonMaterial } from "./ProceduralMaterials.js";

function setup(mesh){
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  mesh.frustumCulled=false;
  return mesh;
}

function add(geometry,material,parent,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  const m=setup(new THREE.Mesh(geometry,material));
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.scale.set(...scale);
  parent.add(m);
  return m;
}

export class ProceduralKnightVisual {
  constructor(){
    this.group=new THREE.Group();
    this.group.name="procedural-knight";

    this.materials={
      steel:createProceduralToonMaterial({color:0x8496a0,family:"steel"}),
      steelDark:createProceduralToonMaterial({color:0x3c4b55,family:"steel-dark"}),
      steelBright:createProceduralToonMaterial({color:0xbfcbd0,family:"steel-bright"}),
      gold:createProceduralToonMaterial({color:0xb28f48,family:"gold"}),
      blue:createProceduralToonMaterial({color:0x264c70,family:"cloth",side:THREE.DoubleSide}),
      blueDark:createProceduralToonMaterial({color:0x142b45,family:"cloth-dark",side:THREE.DoubleSide}),
      leather:createProceduralToonMaterial({color:0x503a2c,family:"leather"}),
      shield:createProceduralToonMaterial({color:0x6a4b31,family:"wood"}),
    };

    this._build();
  }

  _build(){
    const m=this.materials;

    this.body=new THREE.Group();
    this.group.add(this.body);

    this.leftLeg=new THREE.Group();
    this.rightLeg=new THREE.Group();
    this.leftLeg.position.set(-0.16,0.62,0);
    this.rightLeg.position.set(0.16,0.62,0);
    this.body.add(this.leftLeg,this.rightLeg);

    add(new THREE.CylinderGeometry(0.105,0.13,0.62,18),m.steelDark,this.leftLeg,[0,-0.28,0]);
    add(new THREE.CylinderGeometry(0.105,0.13,0.62,18),m.steelDark,this.rightLeg,[0,-0.28,0]);
    add(new THREE.SphereGeometry(0.13,18,10),m.steel,this.leftLeg,[0,-0.08,-0.02],[0,0,0],[1,0.72,1]);
    add(new THREE.SphereGeometry(0.13,18,10),m.steel,this.rightLeg,[0,-0.08,-0.02],[0,0,0],[1,0.72,1]);
    add(new THREE.CapsuleGeometry(0.12,0.18,6,12),m.leather,this.leftLeg,[0,-0.61,-0.08],[Math.PI/2,0,0],[1,1,1.35]);
    add(new THREE.CapsuleGeometry(0.12,0.18,6,12),m.leather,this.rightLeg,[0,-0.61,-0.08],[Math.PI/2,0,0],[1,1,1.35]);

    const profile=[
      new THREE.Vector2(0.28,-0.36),
      new THREE.Vector2(0.38,-0.24),
      new THREE.Vector2(0.43,0.06),
      new THREE.Vector2(0.39,0.33),
      new THREE.Vector2(0.29,0.46),
      new THREE.Vector2(0.22,0.50),
    ];
    this.torso=add(new THREE.LatheGeometry(profile,28),m.steel,this.body,[0,1.18,0],[0,0,0],[1,1,0.86]);
    add(new THREE.TorusGeometry(0.31,0.035,8,28),m.gold,this.body,[0,0.92,0],[Math.PI/2,0,0]);

    const surcoat=new THREE.Shape();
    surcoat.moveTo(-0.16,0.28);
    surcoat.lineTo(0.16,0.28);
    surcoat.lineTo(0.13,-0.47);
    surcoat.lineTo(0,-0.38);
    surcoat.lineTo(-0.13,-0.47);
    surcoat.closePath();
    add(new THREE.ShapeGeometry(surcoat),m.blue,this.body,[0,1.15,-0.37]);

    const capeGeo=new THREE.PlaneGeometry(0.68,0.92,4,6);
    const pos=capeGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i);
      const x=pos.getX(i);
      const t=(0.46-y)/0.92;
      pos.setZ(i,0.04+0.12*t+0.03*Math.abs(x));
    }
    capeGeo.computeVertexNormals();
    this.cape=add(capeGeo,m.blueDark,this.body,[0,1.18,0.34],[0.08,Math.PI,0]);

    this.leftArm=new THREE.Group();
    this.rightArm=new THREE.Group();
    this.leftArm.position.set(-0.46,1.40,0);
    this.rightArm.position.set(0.46,1.40,0);
    this.body.add(this.leftArm,this.rightArm);

    add(new THREE.SphereGeometry(0.22,20,12),m.steel,this.leftArm,[0,0,0],[0,0,0],[1.25,0.75,1.15]);
    add(new THREE.SphereGeometry(0.22,20,12),m.steel,this.rightArm,[0,0,0],[0,0,0],[1.25,0.75,1.15]);
    add(new THREE.CylinderGeometry(0.10,0.12,0.55,16),m.steelDark,this.leftArm,[0,-0.31,0]);
    add(new THREE.CylinderGeometry(0.10,0.12,0.55,16),m.steelDark,this.rightArm,[0,-0.31,0]);

    this.shield=new THREE.Group();
    this.shield.position.set(-0.08,-0.43,-0.03);
    this.leftArm.add(this.shield);
    add(new THREE.CylinderGeometry(0.34,0.34,0.08,32),m.shield,this.shield,[0,0,0],[Math.PI/2,0,0],[0.95,1,1.14]);
    add(new THREE.TorusGeometry(0.30,0.035,8,32),m.gold,this.shield,[0,0,-0.045],[0,0,0],[0.95,1.14,1]);
    add(new THREE.SphereGeometry(0.095,16,8),m.steelBright,this.shield,[0,0,-0.075],[0,0,0],[1,1,0.6]);

    this.swordPivot=new THREE.Group();
    this.swordPivot.position.set(0,-0.49,0);
    this.rightArm.add(this.swordPivot);
    add(new THREE.BoxGeometry(0.075,0.90,0.045),m.steelBright,this.swordPivot,[0,-0.42,0]);
    add(new THREE.BoxGeometry(0.42,0.055,0.06),m.gold,this.swordPivot,[0,0.05,0]);
    add(new THREE.CylinderGeometry(0.045,0.045,0.22,12),m.leather,this.swordPivot,[0,0.19,0]);

    this.head=new THREE.Group();
    this.head.position.set(0,1.86,-0.01);
    this.body.add(this.head);

    add(new THREE.SphereGeometry(0.285,28,16),m.steel,this.head,[0,0,0],[0,0,0],[1,0.92,1]);
    add(new THREE.BoxGeometry(0.48,0.10,0.07),m.steelDark,this.head,[0,-0.015,-0.26]);
    add(new THREE.BoxGeometry(0.055,0.36,0.075),m.gold,this.head,[0,0.04,-0.285]);
    add(new THREE.BoxGeometry(0.34,0.035,0.055),m.steelBright,this.head,[0,0.05,-0.305]);

    const plumeShape=new THREE.Shape();
    plumeShape.moveTo(-0.045,0);
    plumeShape.bezierCurveTo(-0.04,0.20,0.03,0.40,0.16,0.55);
    plumeShape.lineTo(0.06,0.18);
    plumeShape.lineTo(0.04,0);
    plumeShape.closePath();
    const plumeGeo=new THREE.ExtrudeGeometry(plumeShape,{
      depth:0.035,
      bevelEnabled:false,
      curveSegments:8,
    });
    plumeGeo.translate(0,0,-0.017);
    add(plumeGeo,m.blue,this.head,[0,0.24,0.02],[0,0,-0.10]);

    this.group.scale.setScalar(0.88);
  }

  update({dt,time,facing,state,attackProgress=0,dashProgress=0,deathProgress=0,hurt=false}){
    const yaw=Math.atan2(-facing.x,-facing.z);
    this.group.rotation.y=yaw;

    const moving=state==="walk"||state==="run";
    const stride=state==="run"?9.5:7.0;
    const swing=moving?Math.sin(time*stride)*0.48:0;
    const bob=moving?Math.abs(Math.sin(time*stride))*0.055:Math.sin(time*2.2)*0.018;

    this.body.position.y=bob;
    this.leftLeg.rotation.x=swing;
    this.rightLeg.rotation.x=-swing;

    this.leftArm.rotation.x=-swing*0.42;
    this.rightArm.rotation.x=swing*0.42;
    this.leftArm.rotation.z=0;
    this.rightArm.rotation.z=0;

    if(state==="attack"){
      const p=attackProgress;
      const wind=Math.min(1,p/0.32);
      const release=Math.max(0,(p-0.32)/0.68);
      this.rightArm.rotation.z=-0.45*wind+1.05*release;
      this.rightArm.rotation.x=-0.85*wind+1.25*release;
      this.swordPivot.rotation.z=-0.22*wind+0.45*release;
    }else{
      this.swordPivot.rotation.z=0;
    }

    if(state==="dash"){
      this.body.rotation.x=-0.22*(1-Math.abs(dashProgress*2-1));
      this.cape.rotation.x=0.25;
    }else{
      this.body.rotation.x=THREE.MathUtils.lerp(this.body.rotation.x,0,1-Math.exp(-10*dt));
      this.cape.rotation.x=0.08+Math.sin(time*5.5)*0.035+(moving?0.06:0);
    }

    const flash=hurt&&Math.floor(time*18)%2===0;
    for(const material of Object.values(this.materials)){
      material.emissive.setHex(flash?0x5b1f1a:0x000000);
      material.emissiveIntensity=flash?0.85:0;
    }

    this.group.rotation.z=-deathProgress*(Math.PI*0.46);
    this.group.position.y=deathProgress*-0.12;
  }

  dispose(){
    this.group.traverse((obj)=>obj.geometry?.dispose?.());
    Object.values(this.materials).forEach((m)=>m.dispose?.());
  }
}
