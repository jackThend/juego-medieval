import * as THREE from "three";
import {
  ISO_MAP_WIDTH,
  ISO_MAP_HEIGHT,
  ISO_TILE_SIZE,
  SANCTUARY_GRID,
  SHRINE_POSITION,
  TILE,
  isWalkableTile,
  tileToWorld,
  worldToTile,
} from "../world/SanctuaryGrid.js";
import { IsoTileMapRenderer } from "./IsoTileMapRenderer.js";
import { IsoArchitectureRenderer } from "./IsoArchitectureRenderer.js";
import { IsoPropRenderer } from "./IsoPropRenderer.js";

export class WorldBuilder {
  constructor(scene, physics, materials) {
    this.scene = scene;
    this.physics = physics;
    this.materials = materials;
    this.destructibles = [];
    this.shrinePosition = new THREE.Vector3(SHRINE_POSITION.x, 0, SHRINE_POSITION.z);
    this.shrine = { activated: false };
    this.tileRenderer = null;
    this.architectureRenderer = null;
    this.propRenderer = null;
    this.tileWorld = new THREE.Vector3();
  }

  build() {
    this._buildPhysicsFoundation();
    this.tileRenderer = new IsoTileMapRenderer(this.scene, SANCTUARY_GRID).build();
    this.architectureRenderer = new IsoArchitectureRenderer(this.scene, this.physics).build();
    this.propRenderer = new IsoPropRenderer(this.scene, this.physics, this.materials).build();
    this.destructibles = this.propRenderer.destructibles;
  }

  _buildPhysicsFoundation() {
    const halfW = (ISO_MAP_WIDTH * ISO_TILE_SIZE) * 0.5;
    const halfH = (ISO_MAP_HEIGHT * ISO_TILE_SIZE) * 0.5;

    this.physics.createGround({
      y: -0.25,
      halfExtents: { x: halfW, y: 0.25, z: halfH },
    });

    // El mapa lógico gobierna también la navegación. Los tiles VOID son
    // colisionadores invisibles; el arte posterior no dictará la física.
    for (let row = 0; row < ISO_MAP_HEIGHT; row += 1) {
      for (let col = 0; col < ISO_MAP_WIDTH; col += 1) {
        const type = SANCTUARY_GRID[row][col];
        if (isWalkableTile(type)) continue;
        tileToWorld(col, row, this.tileWorld);
        this.physics.createStaticBox({
          x: this.tileWorld.x,
          y: 0.55,
          z: this.tileWorld.z,
          hx: ISO_TILE_SIZE * 0.49,
          hy: 0.55,
          hz: ISO_TILE_SIZE * 0.49,
        });
      }
    }

    // Seguridad exterior del mapa.
    const edgeX = halfW + 0.25;
    const edgeZ = halfH + 0.25;
    this.physics.createStaticBox({ x: -edgeX, y: 0.8, z: 0, hx: 0.25, hy: 0.8, hz: halfH });
    this.physics.createStaticBox({ x: edgeX, y: 0.8, z: 0, hx: 0.25, hy: 0.8, hz: halfH });
    this.physics.createStaticBox({ x: 0, y: 0.8, z: -edgeZ, hx: halfW, hy: 0.8, hz: 0.25 });
    this.physics.createStaticBox({ x: 0, y: 0.8, z: edgeZ, hx: halfW, hy: 0.8, hz: 0.25 });
  }

  getDestructibles() {
    return this.destructibles;
  }

  getShrinePosition(target = new THREE.Vector3()) {
    return target.copy(this.shrinePosition);
  }

  getTileAtWorld(x, z) {
    const tile = worldToTile(x, z);
    if (tile.col < 0 || tile.row < 0 || tile.col >= ISO_MAP_WIDTH || tile.row >= ISO_MAP_HEIGHT) {
      return TILE.VOID;
    }
    return SANCTUARY_GRID[tile.row][tile.col];
  }

  activateShrine() {
    this.shrine.activated = true;
    this.tileRenderer?.setSanctumActive(true);
    this.propRenderer?.setShrineActive(true);
  }

  update(time, dt = 1 / 60) {
    this.propRenderer?.update(time, dt);
    this.destructibles.forEach((prop) => prop.update(dt, time));
  }
}
