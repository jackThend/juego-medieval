import * as THREE from "three";

function configureMesh(mesh,{cast=true,receive=true}={}){
  mesh.castShadow=cast;
  mesh.receiveShadow=receive;
  mesh.frustumCulled=false;
  return mesh;
}

function mesh(geometry,material,parent,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  const m=configureMesh(new THREE.Mesh(geometry,material));
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.scale.set(...scale);
  parent.add(m);
  return m;
}

export function createProceduralColumn({stone,darkStone}){
  const group=new THREE.Group();
  group.name="procedural-column";

  mesh(new THREE.CylinderGeometry(0.48,0.52,0.16,32),darkStone,group,[0,0.08,0]);
  mesh(new THREE.CylinderGeometry(0.42,0.46,0.16,32),stone,group,[0,0.22,0]);
  mesh(new THREE.TorusGeometry(0.36,0.055,8,32),darkStone,group,[0,0.34,0],[Math.PI/2,0,0]);

  const shaft=mesh(new THREE.CylinderGeometry(0.30,0.34,1.78,32,1,false),stone,group,[0,1.22,0]);

  for(let i=0;i<12;i+=1){
    const angle=(i/12)*Math.PI*2;
    const flute=mesh(
      new THREE.CylinderGeometry(0.018,0.022,1.58,8),
      darkStone,
      group,
      [Math.cos(angle)*0.305,1.23,Math.sin(angle)*0.305],
    );
    flute.rotation.y=angle;
  }

  mesh(new THREE.TorusGeometry(0.33,0.048,8,32),darkStone,group,[0,2.11,0],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(0.46,0.34,0.22,32),stone,group,[0,2.24,0]);
  mesh(new THREE.BoxGeometry(0.92,0.16,0.92),darkStone,group,[0,2.39,0]);
  mesh(new THREE.BoxGeometry(0.76,0.10,0.76),stone,group,[0,2.52,0]);

  shaft.geometry.computeVertexNormals();
  return group;
}

function makeArchShape(){
  const outer=new THREE.Shape();
  outer.moveTo(-1.55,0);
  outer.lineTo(-1.55,1.72);
  outer.absarc(0,1.72,1.55,Math.PI,0,true);
  outer.lineTo(1.55,0);
  outer.closePath();

  const hole=new THREE.Path();
  hole.moveTo(-0.88,0);
  hole.lineTo(-0.88,1.60);
  hole.absarc(0,1.60,0.88,Math.PI,0,false);
  hole.lineTo(0.88,0);
  hole.closePath();
  outer.holes.push(hole);

  return outer;
}

export function createProceduralArch({stone,darkStone,trim}){
  const group=new THREE.Group();
  group.name="procedural-arch";

  const geometry=new THREE.ExtrudeGeometry(makeArchShape(),{
    depth:0.52,
    bevelEnabled:true,
    bevelThickness:0.055,
    bevelSize:0.045,
    bevelSegments:2,
    curveSegments:28,
    steps:1,
  });
  geometry.translate(0,0,-0.26);
  geometry.computeVertexNormals();

  mesh(geometry,stone,group);
  mesh(new THREE.BoxGeometry(0.62,0.22,0.72),darkStone,group,[-1.22,0.11,0]);
  mesh(new THREE.BoxGeometry(0.62,0.22,0.72),darkStone,group,[1.22,0.11,0]);
  mesh(new THREE.BoxGeometry(0.34,0.50,0.66),trim,group,[0,3.18,0],[0,0,0.06]);
  mesh(new THREE.BoxGeometry(0.13,1.58,0.62),darkStone,group,[-0.98,0.91,0]);
  mesh(new THREE.BoxGeometry(0.13,1.58,0.62),darkStone,group,[0.98,0.91,0]);

  return group;
}
