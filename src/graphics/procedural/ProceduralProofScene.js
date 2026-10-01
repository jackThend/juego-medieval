import * as THREE from "three";
import {
  createProceduralToonMaterial,
  createFloorMaterial,
  createShadowMaterial,
} from "./ProceduralMaterials.js";
import {
  createProceduralArch,
  createProceduralColumn,
  createProceduralWall,
  createProceduralStairs,
  createProceduralTree,
} from "./ProceduralGeometryFactory.js";

export class ProceduralProofScene {
  constructor(scene,physics){
    this.scene=scene;
    this.physics=physics;
    this.group=new THREE.Group();
    this.group.name="procedural-renderer-proof";

    this.architectureGroup=new THREE.Group();
    this.architectureGroup.name="live-procedural-architecture";
    this.group.add(this.architectureGroup);

    this.setDressingGroup=new THREE.Group();
    this.setDressingGroup.name="live-procedural-set-dressing";
    this.group.add(this.setDressingGroup);

    scene.add(this.group);
  }

  build(){
    const stone=createProceduralToonMaterial({color:0x657073,family:"stone"});
    const darkStone=createProceduralToonMaterial({color:0x354145,family:"stone-dark"});
    const trim=createProceduralToonMaterial({color:0x92958a,family:"stone-trim"});
    const bark=createProceduralToonMaterial({color:0x4d3d31,family:"bark"});
    const barkDark=createProceduralToonMaterial({color:0x28241f,family:"bark-dark"});
    const leaf=createProceduralToonMaterial({color:0x314d39,family:"leaf"});
    const leafDark=createProceduralToonMaterial({color:0x192f25,family:"leaf-dark"});

    const floor=new THREE.Mesh(
      new THREE.PlaneGeometry(16,16,1,1),
      createFloorMaterial(),
    );
    floor.rotation.x=-Math.PI/2;
    floor.position.set(0,0,7.0);
    floor.name="procedural-stone-floor";
    this.group.add(floor);

    const shadowPlane=new THREE.Mesh(
      new THREE.PlaneGeometry(16,16),
      createShadowMaterial(0.31),
    );
    shadowPlane.rotation.x=-Math.PI/2;
    shadowPlane.position.set(0,0.012,7.0);
    shadowPlane.receiveShadow=true;
    shadowPlane.renderOrder=2;
    this.group.add(shadowPlane);

    const column=createProceduralColumn({stone,darkStone});
    column.position.set(-2.35,0,6.8);
    this.architectureGroup.add(column);

    const stairs=createProceduralStairs({stone,darkStone,width:2.35,steps:5,depth:2.0,height:0.70});
    stairs.position.set(1.75,0,5.45);
    this.architectureGroup.add(stairs);

    const arch=createProceduralArch({stone,darkStone,trim});
    arch.position.set(1.75,0.70,3.95);
    arch.rotation.y=Math.PI/10;
    this.architectureGroup.add(arch);

    const rearWall=createProceduralWall({
      stone,darkStone,width:4.8,height:1.85,depth:0.48,seed:17,broken:true,
    });
    rearWall.position.set(-1.9,0,2.15);
    rearWall.rotation.y=0.03;
    this.architectureGroup.add(rearWall);

    const sideRuin=createProceduralWall({
      stone,darkStone,width:3.5,height:1.65,depth:0.46,seed:29,broken:true,
    });
    sideRuin.position.set(-5.15,0,7.2);
    sideRuin.rotation.y=Math.PI/2;
    this.architectureGroup.add(sideRuin);

    const tree=createProceduralTree({bark,barkDark,leaf,leafDark,seed:41});
    tree.position.set(5.15,0,6.5);
    tree.rotation.y=-0.35;
    tree.scale.setScalar(0.90);
    this.setDressingGroup.add(tree);

    const hemi=new THREE.HemisphereLight(0x9fbac8,0x101511,1.18);
    this.scene.add(hemi);

    const moon=new THREE.DirectionalLight(0xc8d9df,2.55);
    moon.position.set(6,11,8);
    moon.target.position.set(0,0,5);
    moon.castShadow=true;
    moon.shadow.mapSize.set(1024,1024);
    moon.shadow.camera.left=-9;
    moon.shadow.camera.right=9;
    moon.shadow.camera.top=9;
    moon.shadow.camera.bottom=-9;
    moon.shadow.camera.near=1;
    moon.shadow.camera.far=28;
    moon.shadow.bias=-0.0008;
    moon.shadow.normalBias=0.025;
    this.scene.add(moon,moon.target);

    this._buildColliders();
    return this;
  }

  setArchitectureVisible(flag){
    this.architectureGroup.visible=Boolean(flag);
  }

  setSetDressingVisible(flag){
    this.setDressingGroup.visible=Boolean(flag);
  }

  _buildColliders(){
    this.physics.createStaticBox({
      x:-2.35,y:1.14,z:6.8,
      hx:0.42,hy:1.14,hz:0.42,
    });

    const stairX=1.75;
    const stairStartZ=5.45;
    const stepDepth=2.0/5;
    const stepHeight=0.70/5;
    for(let i=0;i<5;i+=1){
      const h=stepHeight*(i+1);
      const localZ=1.0-stepDepth*(i+0.5);
      this.physics.createStaticBox({
        x:stairX,
        y:h/2,
        z:stairStartZ+localZ,
        hx:2.35/2,
        hy:h/2,
        hz:stepDepth/2,
      });
    }

    const archX=1.75;
    const archZ=3.95;
    const ry=Math.PI/10;
    const jambOffset=0.92;
    const sin=Math.sin(ry),cos=Math.cos(ry);
    for(const side of [-1,1]){
      const localX=side*jambOffset;
      this.physics.createStaticBox({
        x:archX+localX*cos,
        y:0.70+0.70,
        z:archZ-localX*sin,
        hx:0.24,
        hy:0.70,
        hz:0.30,
        rotationY:ry,
      });
    }

    this.physics.createStaticBox({x:-1.9,y:0.90,z:2.15,hx:2.35,hy:0.90,hz:0.25,rotationY:0.03});
    this.physics.createStaticBox({x:-5.15,y:0.78,z:7.2,hx:1.72,hy:0.78,hz:0.24,rotationY:Math.PI/2});
    this.physics.createStaticBox({x:5.15,y:1.25,z:6.5,hx:0.34,hy:1.25,hz:0.34});
  }
}
