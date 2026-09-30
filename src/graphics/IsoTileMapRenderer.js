import * as THREE from "three";
import {
  ISO_MAP_WIDTH,
  ISO_MAP_HEIGHT,
  ISO_TILE_SIZE,
  TILE,
  tileToWorld,
} from "../world/SanctuaryGrid.js";
import { createIsoTileMaterial, updateSanctumMaterial } from "./IsoTileArt.js";

const VISUAL_TYPES=[
  TILE.STONE,
  TILE.STONE_DARK,
  TILE.MOSS,
  TILE.PATH,
  TILE.SANCTUM,
];

const VARIANT_COUNT=6;

function variantFor(col,row){
  const a=(col*17+row*31)^(col*row*7)^(col<<2);
  return Math.abs(a)%VARIANT_COUNT;
}

export class IsoTileMapRenderer {
  constructor(scene,grid){
    this.scene=scene;
    this.grid=grid;
    this.group=new THREE.Group();
    this.group.name="iso-tile-map";
    this.group.position.y=0.008;
    this.scene.add(this.group);

    this.geometry=new THREE.PlaneGeometry(ISO_TILE_SIZE*1.004,ISO_TILE_SIZE*1.004);
    this.geometry.rotateX(-Math.PI/2);

    this.meshes=[];
    this.sanctumMaterials=[];
    this.temp=new THREE.Object3D();
    this.world=new THREE.Vector3();
  }

  build(){
    for(const type of VISUAL_TYPES){
      for(let variant=0;variant<VARIANT_COUNT;variant+=1){
        const cells=[];
        for(let row=0;row<ISO_MAP_HEIGHT;row+=1){
          for(let col=0;col<ISO_MAP_WIDTH;col+=1){
            if(this.grid[row][col]!==type)continue;
            if(variantFor(col,row)!==variant)continue;
            cells.push([col,row]);
          }
        }

        if(!cells.length)continue;

        const material=createIsoTileMaterial(type,variant);
        const mesh=new THREE.InstancedMesh(this.geometry,material,cells.length);
        mesh.name="tile-"+type+"-"+variant;
        mesh.castShadow=false;
        mesh.receiveShadow=false;
        mesh.frustumCulled=false;

        cells.forEach(([col,row],index)=>{
          tileToWorld(col,row,this.world);
          this.temp.position.set(this.world.x,0,this.world.z);
          this.temp.rotation.set(0,0,0);
          this.temp.scale.set(1,1,1);
          this.temp.updateMatrix();
          mesh.setMatrixAt(index,this.temp.matrix);
        });

        mesh.instanceMatrix.needsUpdate=true;
        this.group.add(mesh);
        this.meshes.push(mesh);

        if(type===TILE.SANCTUM)this.sanctumMaterials.push({material,variant});
      }
    }

    return this;
  }

  setSanctumActive(active){
    for(const entry of this.sanctumMaterials){
      updateSanctumMaterial(entry.material,entry.variant,active);
    }
  }

  dispose(){
    for(const mesh of this.meshes)mesh.material.dispose();
    this.geometry.dispose();
    this.scene.remove(this.group);
  }
}
