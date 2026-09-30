import * as THREE from "three";
import { createProceduralToonMaterial } from "./ProceduralMaterials.js";

function add(parent,geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}

function extrudeShape(shape,depth=0.06){
  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth,
    bevelEnabled:true,
    bevelThickness:0.015,
    bevelSize:0.012,
    bevelSegments:1,
    curveSegments:4,
  });
  geometry.translate(0,0,-depth*0.5);
  return geometry;
}

function shieldGeometry(){
  const s=new THREE.Shape();
  s.moveTo(0,0.43);
  s.bezierCurveTo(0.30,0.38,0.34,0.18,0.30,-0.06);
  s.bezierCurveTo(0.24,-0.34,0.08,-0.55,0,-0.62);
  s.bezierCurveTo(-0.08,-0.55,-0.24,-0.34,-0.30,-0.06);
  s.bezierCurveTo(-0.34,0.18,-0.30,0.38,0,0.43);
  return extrudeShape(s,0.075);
}

function bladeGeometry(){
  const s=new THREE.Shape();
  s.moveTo(-0.055,0.12);
  s.lineTo(0.055,0.12);
  s.lineTo(0.045,-0.73);
  s.lineTo(0,-0.90);
  s.lineTo(-0.045,-0.73);
  s.closePath();
  return extrudeShape(s,0.035);
}

export class ProceduralKnightBakeModel{
  constructor(){
    this.group=new THREE.Group();
    this.group.name="procedural-knight-bake-model";

    this.materials={
      steel:createProceduralToonMaterial({color:0x788a95,family:"bake-steel"}),
      steelDark:createProceduralToonMaterial({color:0x35444d,family:"bake-steel-dark"}),
      steelBright:createProceduralToonMaterial({color:0xaebbc0,family:"bake-steel-bright"}),
      gold:createProceduralToonMaterial({color:0xa38245,family:"bake-gold"}),
      blue:createProceduralToonMaterial({color:0x24496b,family:"bake-blue",side:THREE.DoubleSide}),
      blueDark:createProceduralToonMaterial({color:0x152d47,family:"bake-blue-dark",side:THREE.DoubleSide}),
      leather:createProceduralToonMaterial({color:0x49372b,family:"bake-leather"}),
      shield:createProceduralToonMaterial({color:0x65472f,family:"bake-shield"}),
      shadow:createProceduralToonMaterial({color:0x202b31,family:"bake-shadow"}),
    };

    this._build();
  }

  _build(){
    const m=this.materials;
    this.body=new THREE.Group();
    this.group.add(this.body);

    this.leftLeg=new THREE.Group();
    this.rightLeg=new THREE.Group();
    this.leftLeg.position.set(-0.13,0.61,0);
    this.rightLeg.position.set(0.13,0.61,0);
    this.body.add(this.leftLeg,this.rightLeg);

    add(this.leftLeg,new THREE.CylinderGeometry(0.085,0.105,0.56,12),m.steelDark,[0,-0.26,0]);
    add(this.rightLeg,new THREE.CylinderGeometry(0.085,0.105,0.56,12),m.steelDark,[0,-0.26,0]);
    add(this.leftLeg,new THREE.SphereGeometry(0.11,12,8),m.steel,[0,-0.02,-0.02],[0,0,0],[1,0.72,1]);
    add(this.rightLeg,new THREE.SphereGeometry(0.11,12,8),m.steel,[0,-0.02,-0.02],[0,0,0],[1,0.72,1]);
    add(this.leftLeg,new THREE.CapsuleGeometry(0.10,0.17,4,10),m.leather,[0,-0.56,-0.07],[Math.PI/2,0,0],[0.92,1,1.30]);
    add(this.rightLeg,new THREE.CapsuleGeometry(0.10,0.17,4,10),m.leather,[0,-0.56,-0.07],[Math.PI/2,0,0],[0.92,1,1.30]);

    const torsoProfile=[
      new THREE.Vector2(0.20,-0.42),
      new THREE.Vector2(0.28,-0.30),
      new THREE.Vector2(0.34,-0.05),
      new THREE.Vector2(0.38,0.22),
      new THREE.Vector2(0.31,0.43),
      new THREE.Vector2(0.20,0.48),
    ];
    this.torso=add(this.body,new THREE.LatheGeometry(torsoProfile,24),m.steel,[0,1.18,0],[0,0,0],[0.88,1,0.72]);
    add(this.body,new THREE.TorusGeometry(0.255,0.028,6,20),m.gold,[0,0.91,0],[Math.PI/2,0,0],[0.90,1,0.80]);

    const fauldShape=new THREE.Shape();
    fauldShape.moveTo(-0.28,0.20);
    fauldShape.lineTo(0.28,0.20);
    fauldShape.lineTo(0.22,-0.28);
    fauldShape.lineTo(0.08,-0.37);
    fauldShape.lineTo(0,-0.30);
    fauldShape.lineTo(-0.08,-0.37);
    fauldShape.lineTo(-0.22,-0.28);
    fauldShape.closePath();
    add(this.body,new THREE.ShapeGeometry(fauldShape),m.blue,[0,0.91,-0.28],[0,0,0]);

    const capeGeo=new THREE.PlaneGeometry(0.58,0.92,4,5);
    const pos=capeGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i);
      const x=pos.getX(i);
      const t=(0.46-y)/0.92;
      pos.setZ(i,0.03+0.13*t+0.025*Math.abs(x));
    }
    capeGeo.computeVertexNormals();
    this.cape=add(this.body,capeGeo,m.blueDark,[0,1.22,0.27],[0.05,Math.PI,0]);

    this.leftArm=new THREE.Group();
    this.rightArm=new THREE.Group();
    this.leftArm.position.set(-0.37,1.42,0);
    this.rightArm.position.set(0.37,1.42,0);
    this.body.add(this.leftArm,this.rightArm);

    add(this.leftArm,new THREE.SphereGeometry(0.17,14,9),m.steel,[0,0,0],[0,0,0],[1.18,0.72,1.0]);
    add(this.rightArm,new THREE.SphereGeometry(0.17,14,9),m.steel,[0,0,0],[0,0,0],[1.18,0.72,1.0]);
    add(this.leftArm,new THREE.CylinderGeometry(0.075,0.095,0.50,12),m.steelDark,[0,-0.28,0],[0,0,0.04]);
    add(this.rightArm,new THREE.CylinderGeometry(0.075,0.095,0.50,12),m.steelDark,[0,-0.28,0],[0,0,-0.04]);

    this.shieldPivot=new THREE.Group();
    this.shieldPivot.position.set(-0.03,-0.43,-0.18);
    this.shieldPivot.rotation.x=-0.12;
    this.leftArm.add(this.shieldPivot);
    add(this.shieldPivot,shieldGeometry(),m.shield,[0,0,0]);
    add(this.shieldPivot,new THREE.TorusGeometry(0.245,0.023,6,24),m.gold,[0,-0.04,-0.052],[0,0,0],[0.92,1.12,1]);
    add(this.shieldPivot,new THREE.SphereGeometry(0.073,12,8),m.steelBright,[0,-0.04,-0.075],[0,0,0],[1,1,0.55]);

    this.swordPivot=new THREE.Group();
    this.swordPivot.position.set(0,-0.45,-0.01);
    this.rightArm.add(this.swordPivot);
    add(this.swordPivot,bladeGeometry(),m.steelBright,[0,-0.02,0]);
    add(this.swordPivot,new THREE.BoxGeometry(0.34,0.045,0.055),m.gold,[0,0.11,0]);
    add(this.swordPivot,new THREE.CylinderGeometry(0.035,0.035,0.21,10),m.leather,[0,0.22,0]);
    add(this.swordPivot,new THREE.SphereGeometry(0.055,10,6),m.gold,[0,0.34,0]);

    this.head=new THREE.Group();
    this.head.position.set(0,1.82,-0.01);
    this.body.add(this.head);

    const helmetProfile=[
      new THREE.Vector2(0.21,-0.22),
      new THREE.Vector2(0.255,-0.10),
      new THREE.Vector2(0.25,0.09),
      new THREE.Vector2(0.20,0.25),
      new THREE.Vector2(0.08,0.32),
      new THREE.Vector2(0.0,0.34),
    ];
    add(this.head,new THREE.LatheGeometry(helmetProfile,24),m.steel,[0,0,0],[0,0,0],[0.92,1,0.92]);
    add(this.head,new THREE.BoxGeometry(0.40,0.085,0.055),m.shadow,[0,-0.01,-0.235]);
    add(this.head,new THREE.BoxGeometry(0.045,0.30,0.055),m.gold,[0,0.03,-0.255]);
    add(this.head,new THREE.BoxGeometry(0.30,0.025,0.045),m.steelBright,[0,0.05,-0.273]);

    const plume=new THREE.Shape();
    plume.moveTo(-0.025,0);
    plume.bezierCurveTo(-0.02,0.16,0.02,0.32,0.13,0.43);
    plume.lineTo(0.05,0.14);
    plume.lineTo(0.025,0);
    plume.closePath();
    add(this.head,extrudeShape(plume,0.025),m.blue,[0,0.27,0.015],[0,0,-0.07]);

    this.group.scale.set(0.90,0.94,0.90);
  }

  setPose({state="idle",phase=0,directionIndex=0,hurt=false}={}){
    const angle=(directionIndex%8)*(Math.PI/4);
    this.group.rotation.set(0,angle,0);
    this.group.position.set(0,0,0);
    this.body.position.set(0,0,0);
    this.body.rotation.set(0,0,0);
    this.leftLeg.rotation.set(0,0,0);
    this.rightLeg.rotation.set(0,0,0);
    this.leftArm.rotation.set(0,0,0);
    this.rightArm.rotation.set(0,0,0);
    this.swordPivot.rotation.set(0,0,0);
    this.cape.rotation.set(0.05,Math.PI,0);

    const cycle=phase*Math.PI*2;
    if(state==="idle"){
      this.body.position.y=Math.sin(cycle)*0.012;
      this.cape.rotation.x=0.05+Math.sin(cycle)*0.025;
    }else if(state==="walk"||state==="run"){
      const amp=state==="run"?0.56:0.42;
      const swing=Math.sin(cycle)*amp;
      this.leftLeg.rotation.x=swing;
      this.rightLeg.rotation.x=-swing;
      this.leftArm.rotation.x=-swing*0.35;
      this.rightArm.rotation.x=swing*0.30;
      this.body.position.y=Math.abs(Math.sin(cycle))*0.045;
      this.cape.rotation.x=0.08+Math.abs(Math.sin(cycle))*0.08;
    }else if(state==="attack"){
      const wind=Math.min(1,phase/0.34);
      const release=Math.max(0,(phase-0.34)/0.66);
      this.rightArm.rotation.x=-1.0*wind+1.18*release;
      this.rightArm.rotation.z=-0.50*wind+0.88*release;
      this.swordPivot.rotation.z=-0.18*wind+0.42*release;
      this.body.rotation.y=-0.15*wind+0.20*release;
    }else if(state==="dash"){
      const bell=1-Math.abs(phase*2-1);
      this.body.rotation.x=-0.22*bell;
      this.cape.rotation.x=0.18+0.18*bell;
    }else if(state==="hurt"){
      this.body.rotation.z=phase<0.5?-0.08:0.06;
      this.body.position.x=phase<0.5?-0.035:0.02;
    }else if(state==="death"){
      this.group.rotation.z=-phase*(Math.PI*0.46);
      this.group.position.y=-phase*0.14;
    }

    const flash=hurt&&phase<0.55;
    for(const material of Object.values(this.materials)){
      material.emissive.setHex(flash?0x4a1b18:0x000000);
      material.emissiveIntensity=flash?0.7:0;
    }
  }

  dispose(){
    this.group.traverse((obj)=>obj.geometry?.dispose?.());
    Object.values(this.materials).forEach((material)=>material.dispose?.());
  }
}
