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

function seeded(seed=1){
  let s=seed>>>0;
  return ()=>{
    s=(s*1664525+1013904223)>>>0;
    return s/4294967296;
  };
}

function roughBlockGeometry(w,h,d,rnd){
  const j=Math.min(w,h)*0.07;
  const shape=new THREE.Shape();
  shape.moveTo(-w/2+rnd()*j,-h/2+rnd()*j);
  shape.lineTo(w/2-rnd()*j,-h/2+rnd()*j);
  shape.lineTo(w/2-rnd()*j,h/2-rnd()*j);
  shape.lineTo(-w/2+rnd()*j,h/2-rnd()*j);
  shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{
    depth:d,
    steps:1,
    bevelEnabled:true,
    bevelSegments:1,
    bevelSize:Math.min(0.035,Math.min(w,h)*0.08),
    bevelThickness:Math.min(0.025,d*0.08),
  });
  geo.translate(0,0,-d/2);
  geo.computeVertexNormals();
  return geo;
}

export function createProceduralColumn({stone,darkStone}){
  const group=new THREE.Group();
  group.name="procedural-column";

  mesh(new THREE.CylinderGeometry(0.42,0.46,0.14,24),darkStone,group,[0,0.07,0]);
  mesh(new THREE.CylinderGeometry(0.37,0.41,0.14,24),stone,group,[0,0.20,0]);
  mesh(new THREE.TorusGeometry(0.32,0.045,6,24),darkStone,group,[0,0.31,0],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(0.27,0.31,1.55,24,1,false),stone,group,[0,1.10,0]);

  for(let i=0;i<10;i+=1){
    const angle=(i/10)*Math.PI*2;
    const flute=mesh(
      new THREE.CylinderGeometry(0.016,0.018,1.34,6),
      darkStone,
      group,
      [Math.cos(angle)*0.274,1.11,Math.sin(angle)*0.274],
    );
    flute.rotation.y=angle;
  }

  mesh(new THREE.TorusGeometry(0.30,0.042,6,24),darkStone,group,[0,1.88,0],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(0.41,0.31,0.20,24),stone,group,[0,2.00,0]);
  mesh(new THREE.BoxGeometry(0.80,0.14,0.80),darkStone,group,[0,2.15,0]);
  mesh(new THREE.BoxGeometry(0.67,0.09,0.67),stone,group,[0,2.27,0]);
  return group;
}

function makeArchShape(){
  const outer=new THREE.Shape();
  outer.moveTo(-1.18,0);
  outer.lineTo(-1.18,1.36);
  outer.absarc(0,1.36,1.18,Math.PI,0,true);
  outer.lineTo(1.18,0);
  outer.closePath();

  const hole=new THREE.Path();
  hole.moveTo(-0.69,0);
  hole.lineTo(-0.69,1.26);
  hole.absarc(0,1.26,0.69,Math.PI,0,false);
  hole.lineTo(0.69,0);
  hole.closePath();
  outer.holes.push(hole);
  return outer;
}

export function createProceduralArch({stone,darkStone,trim}){
  const group=new THREE.Group();
  group.name="procedural-arch";

  const geometry=new THREE.ExtrudeGeometry(makeArchShape(),{
    depth:0.46,
    bevelEnabled:true,
    bevelThickness:0.045,
    bevelSize:0.04,
    bevelSegments:1,
    curveSegments:18,
    steps:1,
  });
  geometry.translate(0,0,-0.23);
  geometry.computeVertexNormals();
  mesh(geometry,stone,group);

  mesh(new THREE.BoxGeometry(0.48,0.18,0.62),darkStone,group,[-0.92,0.09,0]);
  mesh(new THREE.BoxGeometry(0.48,0.18,0.62),darkStone,group,[0.92,0.09,0]);
  mesh(new THREE.BoxGeometry(0.24,0.38,0.54),trim,group,[0,2.44,0],[0,0,0.055]);
  mesh(new THREE.BoxGeometry(0.10,1.22,0.54),darkStone,group,[-0.78,0.70,0]);
  mesh(new THREE.BoxGeometry(0.10,1.22,0.54),darkStone,group,[0.78,0.70,0]);
  return group;
}

export function createProceduralWall({stone,darkStone,width=4.2,height=2.1,depth=0.50,seed=11,broken=false}){
  const group=new THREE.Group();
  group.name=broken?"procedural-ruin-wall":"procedural-wall";
  const rnd=seeded(seed);
  const courseH=0.34;
  const rows=Math.max(2,Math.floor(height/courseH));

  for(let row=0;row<rows;row+=1){
    let x=-width/2;
    let index=0;
    while(x<width/2-0.06){
      const bw=Math.min(width/2-x,0.48+rnd()*0.50);
      const bh=courseH*(0.82+rnd()*0.20);
      const topLoss=broken ? (Math.abs(x)/(width/2))*0.55+rnd()*0.36 : 0;
      const normalizedRow=row/(rows-1);
      const missing=broken && normalizedRow>0.55 && rnd()<topLoss;
      if(!missing){
        const d=depth*(0.88+rnd()*0.20);
        const material=(index+row)%4===0?darkStone:stone;
        const block=mesh(
          roughBlockGeometry(bw*0.94,bh*0.90,d,rnd),
          material,
          group,
          [x+bw/2+(rnd()-0.5)*0.035,row*courseH+bh/2,(rnd()-0.5)*0.055],
          [(rnd()-0.5)*0.025,(rnd()-0.5)*0.035,(rnd()-0.5)*0.025],
        );
        block.name="masonry-block";
      }
      x+=bw;
      index+=1;
    }
  }

  return group;
}

export function createProceduralStairs({stone,darkStone,width=2.25,steps=5,depth=2.2,height=0.78}){
  const group=new THREE.Group();
  group.name="procedural-stairs";
  const stepDepth=depth/steps;
  const stepHeight=height/steps;

  for(let i=0;i<steps;i+=1){
    const h=stepHeight*(i+1);
    const z=depth/2-stepDepth*(i+0.5);
    const material=i%3===0?darkStone:stone;
    mesh(
      new THREE.BoxGeometry(width,h,stepDepth+0.025),
      material,
      group,
      [0,h/2,z],
    );
  }
  return group;
}

function tubeBetween(points,radius,material,parent,segments=8){
  const curve=new THREE.CatmullRomCurve3(points);
  const geometry=new THREE.TubeGeometry(curve,Math.max(6,points.length*4),radius,segments,false);
  return mesh(geometry,material,parent);
}

export function createProceduralTree({bark,barkDark,leaf,leafDark,seed=31}){
  const group=new THREE.Group();
  group.name="procedural-tree";
  const rnd=seeded(seed);

  const trunkPoints=[
    new THREE.Vector3(0,0,0),
    new THREE.Vector3(0.04,0.8,0.02),
    new THREE.Vector3(-0.07,1.6,0.04),
    new THREE.Vector3(0.06,2.45,-0.03),
    new THREE.Vector3(0.02,3.15,0),
  ];
  tubeBetween(trunkPoints,0.20,bark,group,10);
  tubeBetween(trunkPoints.map((p)=>p.clone().add(new THREE.Vector3(0.08,0,-0.04))),0.055,barkDark,group,6);

  const branchDefs=[
    [new THREE.Vector3(0,1.45,0),new THREE.Vector3(-0.65,2.00,0.10),new THREE.Vector3(-1.05,2.28,0.02)],
    [new THREE.Vector3(0,1.85,0),new THREE.Vector3(0.62,2.25,-0.08),new THREE.Vector3(1.00,2.52,-0.02)],
    [new THREE.Vector3(0,2.25,0),new THREE.Vector3(-0.42,2.70,-0.18),new THREE.Vector3(-0.63,3.02,-0.20)],
  ];
  branchDefs.forEach((pts,i)=>tubeBetween(pts,0.105-i*0.014,bark,group,7));

  const clusters=[
    [-0.92,2.55,0.05,0.82,0.52,0.72],
    [0.93,2.72,-0.03,0.86,0.56,0.76],
    [-0.34,3.24,-0.13,0.82,0.60,0.72],
    [0.28,3.42,0.06,0.78,0.56,0.70],
    [-0.10,2.82,0.18,0.95,0.62,0.78],
  ];
  clusters.forEach(([x,y,z,sx,sy,sz],i)=>{
    const material=i%2?leaf:leafDark;
    const crown=mesh(
      new THREE.SphereGeometry(0.72,16,10),
      material,
      group,
      [x+(rnd()-0.5)*0.10,y+(rnd()-0.5)*0.08,z+(rnd()-0.5)*0.10],
      [(rnd()-0.5)*0.15,(rnd()-0.5)*0.5,(rnd()-0.5)*0.15],
      [sx,sy,sz],
    );
    crown.name="foliage-cluster";
  });

  return group;
}
