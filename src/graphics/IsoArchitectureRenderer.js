import * as THREE from "three";
import { ARCH_KIND, SANCTUARY_ARCHITECTURE } from "../world/SanctuaryArchitecture.js";
import { tileToWorld } from "../world/SanctuaryGrid.js";
import { getArchitectureTexture, architectureScale } from "./IsoArchitectureArt.js";
import { isoRenderOrder } from "./IsoDepth.js";

function isWallX(kind) {
  return [
    ARCH_KIND.WALL_X,
    ARCH_KIND.WALL_BROKEN_X,
    ARCH_KIND.WALL_LOW_X,
  ].includes(kind);
}

function isWallZ(kind) {
  return [
    ARCH_KIND.WALL_Z,
    ARCH_KIND.WALL_BROKEN_Z,
    ARCH_KIND.WALL_LOW_Z,
  ].includes(kind);
}

export class IsoArchitectureRenderer {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.group = new THREE.Group();
    this.group.name = "iso-architecture";
    this.scene.add(this.group);
    this.sprites = [];
    this.world = new THREE.Vector3();
  }

  build() {
    SANCTUARY_ARCHITECTURE.forEach((entry, index) => {
      tileToWorld(entry.col, entry.row, this.world);

      const texture = getArchitectureTexture(entry.kind, entry.variant ?? 0);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.06,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      });

      const sprite = new THREE.Sprite(material);
      const [width,height] = architectureScale(entry.kind);
      sprite.center.set(0.5, 0.035);
      sprite.scale.set(width, height, 1);
      sprite.position.set(this.world.x, 0.012, this.world.z);
      sprite.renderOrder = isoRenderOrder(
        this.world.x,
        this.world.z,
        0,
        12 + (entry.sortOffset ?? 0),
      );
      sprite.userData.architecture = entry;
      sprite.name = "arch-" + entry.kind + "-" + index;
      this.group.add(sprite);
      this.sprites.push(sprite);

      this._createCollider(entry, this.world);
    });

    return this;
  }

  _createCollider(entry, world) {
    if (!entry.solid) return;

    if (entry.solid === "arch") {
      // Dos jambas físicas; el centro queda transitable.
      for (const dx of [-1.08, 1.08]) {
        this.physics.createStaticBox({
          x: world.x + dx,
          y: 0.9,
          z: world.z,
          hx: 0.23,
          hy: 0.9,
          hz: 0.18,
        });
      }
      return;
    }

    if (isWallX(entry.kind)) {
      this.physics.createStaticBox({
        x: world.x,
        y: 0.72,
        z: world.z,
        hx: 0.47,
        hy: 0.72,
        hz: 0.16,
      });
      return;
    }

    if (isWallZ(entry.kind)) {
      this.physics.createStaticBox({
        x: world.x,
        y: 0.72,
        z: world.z,
        hx: 0.16,
        hy: 0.72,
        hz: 0.47,
      });
      return;
    }

    if (entry.kind === ARCH_KIND.PILLAR || entry.kind === ARCH_KIND.CORNER) {
      this.physics.createStaticBox({
        x: world.x,
        y: 0.8,
        z: world.z,
        hx: entry.kind === ARCH_KIND.PILLAR ? 0.23 : 0.34,
        hy: 0.8,
        hz: entry.kind === ARCH_KIND.PILLAR ? 0.23 : 0.34,
      });
      return;
    }

    if (entry.kind === ARCH_KIND.DOOR) {
      this.physics.createStaticBox({
        x: world.x,
        y: 1.0,
        z: world.z,
        hx: 0.78,
        hy: 1.0,
        hz: 0.18,
      });
    }
  }

  dispose() {
    for (const sprite of this.sprites) sprite.material.dispose();
    this.scene.remove(this.group);
  }
}
