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
      steel:createProceduralToonMaterial({color:0x7c8f9a,family:"steel"}),
      steelDark:createProceduralToonMaterial({color:0x33434d,family:"steel-dark"}),
      steelBright:createProceduralToonMaterial({color:0xb9c8cf,family:"steel-bright"}),
      gold:createProceduralToonMaterial({color:0x9f7e3f,family:"gold"}),
      blue:createProceduralToonMaterial({color:0x203f60,family:"cloth",side:THREE.DoubleSide}),
      blueDark:createProceduralToonMaterial({color:0x10263d,family:"cloth-dark",side:THREE.DoubleSide}),
      leather:createProceduralToonMaterial({color:0x493429,family:"leather"}),
      shield:createProceduralToonMaterial({color:0x5d412e,family:"wood"}),
    };

    this._build();
  }

  _build(){
    const m=this.materials;

    this.body=new THREE.Group();
    this.group.add(this.body);

    this.leftLeg=new THREE.Group();
    this.rightLeg=new THREE.Group();
    this.leftLeg.position.set(-0.145,0.64,0);
    this.rightLeg.position.set(0.145,0.64,0);
    this.body.add(this.leftLeg,this.rightLeg);

    add(new THREE.CylinderGeometry(0.085,0.105,0.68,16),m.steelDark,this.leftLeg,[0,-0.31,0]);
    add(new THREE.CylinderGeometry(0.085,0.105,0.68,16),m.steelDark,this.rightLeg,[0,-0.31,0]);
    add(new THREE.SphereGeometry(0.105,16,9),m.steel,this.leftLeg,[0,-0.05,-0.025],[0,0,0],[0.92,0.66,1]);
    add(new THREE.SphereGeometry(0.105,16,9),m.steel,this.rightLeg,[0,-0.05,-0.025],[0,0,0],[0.92,0.66,1]);
    add(new THREE.CapsuleGeometry(0.095,0.20,5,10),m.leather,this.leftLeg,[0,-0.69,-0.085],[Math.PI/2,0,0],[0.9,1,1.32]);
    add(new THREE.CapsuleGeometry(0.095,0.20,5,10),m.leather,this.rightLeg,[0,-0.69,-0.085],[Math.PI/2,0,0],[0.9,1,1.32]);

    const profile=[
      new THREE.Vector2(0.22,-0.40),
      new THREE.Vector2(0.31,-0.27),
      new THREE.Vector2(0.36,0.02),
      new THREE.Vector2(0.34,0.28),
      new THREE.Vector2(0.27,0.47),
      new THREE.Vector2(0.18,0.53),
    ];
    this.torso=add(new THREE.LatheGeometry(profile,24),m.steel,this.body,[0,1.19,0],[0,0,0],[0.94,1.02,0.78]);
    add(new THREE.TorusGeometry(0.27,0.028,8,24),m.gold,this.body,[0,0.91,0],[Math.PI/2,0,0]);

    const surcoat=new THREE.Shape();
    surcoat.moveTo(-0.13,0.30);
    surcoat.lineTo(0.13,0.30);
    surcoat.lineTo(0.11,-0.52);
    surcoat.lineTo(0,-0.43);
    surcoat.lineTo(-0.11,-0.52);
    surcoat.closePath();
    add(new THREE.ShapeGeometry(surcoat),m.blue,this.body,[0,1.13,-0.31]);

    const capeGeo=new THREE.PlaneGeometry(0.56,1.02,3,6);
    const pos=capeGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i);
      const x=pos.getX(i);
      const t=(0.51-y)/1.02;
      pos.setZ(i,0.03+0.09*t+0.02*Math.abs(x));
    }
    capeGeo.computeVertexNormals();
    this.cape=add(capeGeo,m.blueDark,this.body,[0,1.16,0.28],[0.06,Math.PI,0]);

    this.leftArm=new THREE.Group();
    this.rightArm=new THREE.Group();
    this.leftArm.position.set(-0.38,1.43,0);
    this.rightArm.position.set(0.38,1.43,0);
    this.body.add(this.leftArm,this.rightArm);

    add(new THREE.SphereGeometry(0.17,18,10),m.steel,this.leftArm,[0,0,0],[0,0,0],[1.15,0.68,1.05]);
    add(new THREE.SphereGeometry(0.17,18,10),m.steel,this.rightArm,[0,0,0],[0,0,0],[1.15,0.68,1.05]);
    add(new THREE.CylinderGeometry(0.075,0.09,0.60,14),m.steelDark,this.leftArm,[0,-0.33,0]);
    add(new THREE.CylinderGeometry(0.075,0.09,0.60,14),m.steelDark,this.rightArm,[0,-0.33,0]);

    this.shield=new THREE.Group();
    this.shield.position.set(-0.06,-0.46,-0.025);
    this.leftArm.add(this.shield);
    add(new THREE.CylinderGeometry(0.285,0.285,0.065,28),m.shield,this.shield,[0,0,0],[Math.PI/2,0,0],[0.88,1,1.16]);
    add(new THREE.TorusGeometry(0.255,0.026,8,28),m.gold,this.shield,[0,0,-0.037],[0,0,0],[0.88,1.16,1]);
    add(new THREE.SphereGeometry(0.075,14,8),m.steelBright,this.shield,[0,0,-0.060],[0,0,0],[1,1,0.55]);

    this.swordPivot=new THREE.Group();
    this.swordPivot.position.set(0,-0.53,0);
    this.rightArm.add(this.swordPivot);
    add(new THREE.BoxGeometry(0.055,1.02,0.035),m.steelBright,this.swordPivot,[0,-0.48,0]);
    add(new THREE.BoxGeometry(0.35,0.045,0.045),m.gold,this.swordPivot,[0,0.045,0]);
    add(new THREE.CylinderGeometry(0.035,0.035,0.22,10),m.leather,this.swordPivot,[0,0.18,0]);

    this.head=new THREE.Group();
    this.head.position.set(0,1.89,-0.01);
    this.body.add(this.head);

    add(new THREE.SphereGeometry(0.235,24,14),m.steel,this.head,[0,0,0],[0,0,0],[0.92,1.0,0.90]);
    add(new THREE.BoxGeometry(0.39,0.075,0.055),m.steelDark,this.head,[0,-0.005,-0.215]);
    add(new THREE.BoxGeometry(0.04,0.30,0.060),m.gold,this.head,[0,0.04,-0.235]);
    add(new THREE.BoxGeometry(0.28,0.026,0.04),m.steelBright,this.head,[0,0.05,-0.248]);

    const plumeShape=new THREE.Shape();
    plumeShape.moveTo(-0.03,0);
    plumeShape.bezierCurveTo(-0.02,0.18,0.04,0.34,0.13,0.45);
    plumeShape.lineTo(0.05,0.14);
    plumeShape.lineTo(0.03,0);
    plumeShape.closePath();
    const plumeGeo=new THREE.ExtrudeGeometry(plumeShape,{depth:0.025,bevelEnabled:false,curveSegments:7});
    plumeGeo.translate(0,0,-0.0125);
    add(plumeGeo,m.blue,this.head,[0,0.21,0.015],[0,0,-0.08]);

    this.group.scale.setScalar(0.92);
  }

  setPose({state="idle",phase=0,directionIndex=0,hurt=false}={}){
    const angle=(directionIndex/8)*Math.PI*2;
    const facing=new THREE.Vector3(-Math.sin(angle),0,-Math.cos(angle));
    const t=THREE.MathUtils.clamp(phase,0,0.999);

    this.update({
      dt:1/60,
      time:t*Math.PI*2,
      facing,
      state,
      attackProgress:state==="attack"?t:0,
      dashProgress:state==="dash"?t:0,
      deathProgress:state==="death"?t:0,
      hurt,
    });
  }

  update({dt,time,facing,state,attackProgress=0,dashProgress=0,deathProgress=0,hurt=false}){
    const yaw=Math.atan2(-facing.x,-facing.z);
    this.group.rotation.y=yaw;

    const moving=state==="walk"||state==="run";
    const stride=state==="run"?9.4:7.2;
    const swing=moving?Math.sin(time*stride)*0.42:0;
    const bob=moving?Math.abs(Math.sin(time*stride))*0.045:Math.sin(time*2.2)*0.014;

    this.body.position.y=bob;
    this.leftLeg.rotation.x=swing;
    this.rightLeg.rotation.x=-swing;

    this.leftArm.rotation.x=-swing*0.34;
    this.rightArm.rotation.x=swing*0.34;
    this.leftArm.rotation.z=0;
    this.rightArm.rotation.z=0;

    if(state==="attack"){
      const p=attackProgress;
      const wind=Math.min(1,p/0.30);
      const release=THREE.MathUtils.clamp((p-0.30)/0.50,0,1);
      const recover=THREE.MathUtils.clamp((p-0.80)/0.20,0,1);
      this.rightArm.rotation.z=(-0.40*wind+1.08*release)*(1-recover);
      this.rightArm.rotation.x=(-0.75*wind+1.18*release)*(1-recover);
      this.swordPivot.rotation.z=(-0.18*wind+0.38*release)*(1-recover);
    }else{
      this.swordPivot.rotation.z=0;
    }

    if(state==="dash"){
      this.body.rotation.x=-0.18*Math.sin(Math.PI*dashProgress);
      this.cape.rotation.x=0.20;
    }else{
      this.body.rotation.x=THREE.MathUtils.lerp(this.body.rotation.x,0,1-Math.exp(-10*dt));
      this.cape.rotation.x=0.06+Math.sin(time*4.7)*0.025+(moving?0.05:0);
    }

    const flash=hurt&&Math.floor(time*18)%2===0;
    for(const material of Object.values(this.materials)){
      material.emissive.setHex(flash?0x542018:0x000000);
      material.emissiveIntensity=flash?0.65:0;
    }

    this.group.rotation.z=-deathProgress*(Math.PI*0.46);
    this.group.position.y=deathProgress*-0.11;
  }

  dispose(){
    this.group.traverse((obj)=>obj.geometry?.dispose?.());
    Object.values(this.materials).forEach((m)=>m.dispose?.());
  }
}
