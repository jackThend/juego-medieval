import * as THREE from "three";
import {
  createProceduralToonMaterial,
  createFloorMaterial,
  createShadowMaterial,
} from "./ProceduralMaterials.js";
import {
  createProceduralArch,
  createProceduralColumn,
} from "./ProceduralGeometryFactory.js";

export class ProceduralProofScene {
  constructor(scene,physics){
    this.scene=scene;
    this.physics=physics;
    this.group=new THREE.Group();
    this.group.name="procedural-renderer-proof";
    scene.add(this.group);
  }

  build(){
    const stone=createProceduralToonMaterial({color:0x667174,family:"stone"});
    const darkStone=createProceduralToonMaterial({color:0x364246,family:"stone-dark"});
    const trim=createProceduralToonMaterial({color:0x8c9188,family:"stone-trim"});

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
      createShadowMaterial(0.34),
    );
    shadowPlane.rotation.x=-Math.PI/2;
    shadowPlane.position.set(0,0.012,7.0);
    shadowPlane.receiveShadow=true;
    shadowPlane.renderOrder=2;
    this.group.add(shadowPlane);

    const column=createProceduralColumn({stone,darkStone});
    column.position.set(-2.35,0,6.75);
    this.group.add(column);

    const arch=createProceduralArch({stone,darkStone,trim});
    arch.position.set(0,0,4.1);
    arch.rotation.y=Math.PI/4;
    this.group.add(arch);

    const hemi=new THREE.HemisphereLight(0xa9c2d0,0x111613,1.65);
    this.scene.add(hemi);

    const moon=new THREE.DirectionalLight(0xd2e3ea,3.25);
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
    moon.shadow.normalBias=0.035;
    this.scene.add(moon,moon.target);

    this.physics.createStaticBox({
      x:-2.35,y:1.28,z:6.75,
      hx:0.48,hy:1.28,hz:0.48,
    });

    const ry=Math.PI/4;
    const jambOffset=1.22;
    const sin=Math.sin(ry),cos=Math.cos(ry);
    for(const side of [-1,1]){
      const localX=side*jambOffset;
      this.physics.createStaticBox({
        x:localX*cos,
        y:0.95,
        z:4.1-localX*sin,
        hx:0.28,
        hy:0.95,
        hz:0.36,
        rotationY:ry,
      });
    }

    return this;
  }
}
