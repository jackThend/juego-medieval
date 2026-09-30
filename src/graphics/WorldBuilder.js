import * as THREE from "three";
import { ProceduralProofScene } from "./procedural/ProceduralProofScene.js";

export class WorldBuilder {
  constructor(scene,physics,materials){
    this.scene=scene;
    this.physics=physics;
    this.materials=materials;
    this.destructibles=[];
    this.shrinePosition=new THREE.Vector3(0,0,-8.5);
    this.shrine={activated:false};
    this.proceduralProof=null;
  }

  build(){
    this._buildPhysicsFoundation();
    this.proceduralProof=new ProceduralProofScene(this.scene,this.physics).build();
  }

  _buildPhysicsFoundation(){
    this.physics.createGround({
      x:0,
      y:-0.25,
      z:7,
      halfExtents:{x:8,y:0.25,z:8},
    });

    const half=8.0;
    this.physics.createStaticBox({x:-half,y:0.8,z:7,hx:0.24,hy:0.8,hz:8});
    this.physics.createStaticBox({x:half,y:0.8,z:7,hx:0.24,hy:0.8,hz:8});
    this.physics.createStaticBox({x:0,y:0.8,z:-1,hx:8,hy:0.8,hz:0.24});
    this.physics.createStaticBox({x:0,y:0.8,z:15,hx:8,hy:0.8,hz:0.24});
  }

  getDestructibles(){return this.destructibles;}

  getShrinePosition(target=new THREE.Vector3()){
    return target.copy(this.shrinePosition);
  }

  getTileAtWorld(){return "stone";}

  setShrineHovered(){}

  activateShrine(){this.shrine.activated=true;}

  update(){}
}
