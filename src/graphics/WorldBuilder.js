import * as THREE from "three";
import { createRuneTexture } from "./ProceduralTextures.js";
import { DestructibleProp } from "../entities/DestructibleProp.js";

function seededRandom(seed = 12345) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shadowify(object) {
  object.traverse?.((child) => {
    if (child.isMesh || child.isInstancedMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

export class WorldBuilder {
  constructor(scene, physics, materials) {
    this.scene = scene;
    this.physics = physics;
    this.mat = materials;
    this.random = seededRandom(0x0ca5cad0);
    this.animated = [];
    this.deltaTime = 0;
    this.shrine = null;
    this.destructibles = [];
    this.shrinePosition = new THREE.Vector3(0, 0, -10.5);
  }

  build() {
    this._ground();
    this._paths();
    this._arena();
    this._handcraftedComposition();
    this._forestFrame();
    this._ruins();
    this._processionalMarkers();
    this._sanctumBackdrop();
    this._rubble();
    this._destructibles();
    this._grass();
    this._graveyard();
    this._deadTrees();
    this._braziers();
    this._shrine();
    this._embers();
    this._mistWisps();
  }

  _ground() {
    const ground = new THREE.Mesh(new THREE.BoxGeometry(34, 0.5, 34), this.mat.ground);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.physics.createGround({ y: -0.25, halfExtents: { x: 17, y: 0.25, z: 17 } });

    // Límites físicos invisibles: mantienen al jugador dentro del diorama sin ensuciar la composición.
    const edge = 16.75;
    this.physics.createStaticBox({ x: -edge, y: 0.8, z: 0, hx: 0.25, hy: 0.8, hz: edge });
    this.physics.createStaticBox({ x: edge, y: 0.8, z: 0, hx: 0.25, hy: 0.8, hz: edge });
    this.physics.createStaticBox({ x: 0, y: 0.8, z: -edge, hx: edge, hy: 0.8, hz: 0.25 });
    this.physics.createStaticBox({ x: 0, y: 0.8, z: edge, hx: edge, hy: 0.8, hz: 0.25 });

    // Borde inferior visible del diorama, más oscuro, para que parezca una maqueta flotante.
    const under = new THREE.Mesh(new THREE.BoxGeometry(34.2, 1.2, 34.2), this.mat.darkStone);
    under.position.y = -0.9;
    under.receiveShadow = true;
    this.scene.add(under);
  }

  _paths() {
    const pathGeo = new THREE.BoxGeometry(5.8, 0.06, 23);
    const path = new THREE.Mesh(pathGeo, this.mat.path);
    path.position.set(0, 0.025, 1.2);
    path.rotation.y = Math.PI * 0.04;
    path.receiveShadow = true;
    this.scene.add(path);

    const cross = new THREE.Mesh(new THREE.BoxGeometry(16, 0.055, 4.2), this.mat.path);
    cross.position.set(-1.0, 0.03, -4.9);
    cross.rotation.y = -Math.PI * 0.06;
    cross.receiveShadow = true;
    this.scene.add(cross);
  }


  _arena() {
    const arena = new THREE.Group();
    arena.position.set(0, 0.04, -5.6);

    const disk = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.14, 8), this.mat.darkStone);
    disk.position.y = 0.02;
    disk.castShadow = true;
    disk.receiveShadow = true;
    arena.add(disk);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.18, 6, 18), this.mat.stone);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.09;
    ring.castShadow = true;
    ring.receiveShadow = true;
    arena.add(ring);

    const dummy = new THREE.Object3D();
    const pavers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.82, 0.08, 0.34), this.mat.path, 12);
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 2.2, 0.1, Math.sin(a) * 2.2);
      dummy.rotation.set(0, -a + Math.PI * 0.5, 0);
      dummy.scale.setScalar(0.95 + this.random() * 0.12);
      dummy.updateMatrix();
      pavers.setMatrixAt(i, dummy.matrix);
    }
    pavers.castShadow = false;
    pavers.receiveShadow = true;
    pavers.instanceMatrix.needsUpdate = true;
    arena.add(pavers);

    for (const [x, z, s] of [[-2.7, -1.5, 0.8], [2.8, -1.4, 0.95], [-2.4, 1.7, 0.72], [2.55, 1.6, 0.88]]) {
      const obelisk = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.58), this.mat.darkStone);
      plinth.position.y = 0.11;
      const shard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.15 * s, 0.32), this.mat.stone);
      shard.position.y = 0.68 * s;
      shard.rotation.z = (this.random() - 0.5) * 0.24;
      obelisk.add(plinth, shard);
      obelisk.position.set(x, 0, z);
      obelisk.rotation.y = this.random() * Math.PI;
      shadowify(obelisk);
      arena.add(obelisk);
    }

    this.scene.add(arena);
  }

  _handcraftedComposition() {
    const group = new THREE.Group();

    // Calzada ritual: piezas colocadas a mano para que el recorrido se lea como un lugar diseñado.
    const slabGeo = new THREE.BoxGeometry(1.05, 0.07, 0.72);
    const slabDummy = new THREE.Object3D();
    const placements = [
      [-0.55, 7.2, -0.02, 0.96], [0.62, 6.25, 0.03, 1.0], [-0.42, 5.25, -0.04, 0.92],
      [0.48, 4.15, 0.02, 1.04], [-0.34, 3.05, 0.01, 0.94], [0.35, 1.95, -0.03, 1.0],
      [-0.30, 0.8, 0.02, 0.96], [0.28, -0.4, -0.02, 0.98], [-0.22, -1.7, 0.03, 0.95],
    ];
    const slabs = new THREE.InstancedMesh(slabGeo, this.mat.stone, placements.length);
    placements.forEach(([x, z, yaw, scale], index) => {
      slabDummy.position.set(x, 0.075, z);
      slabDummy.rotation.set(0, yaw, 0);
      slabDummy.scale.set(scale, 1, scale);
      slabDummy.updateMatrix();
      slabs.setMatrixAt(index, slabDummy.matrix);
    });
    slabs.instanceMatrix.needsUpdate = true;
    slabs.receiveShadow = true;
    group.add(slabs);

    // Escalinata visual hacia el santuario.
    for (let i = 0; i < 3; i += 1) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(5.2 - i * 0.36, 0.14, 0.72), this.mat.darkStone);
      step.position.set(0, 0.07 + i * 0.11, -9.2 - i * 0.52);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }

    // Pedestales simétricos pero dañados: orden visual de RPG clásico, no dispersión aleatoria.
    const plinths = [
      [-3.65, 5.0, 0.0], [3.65, 5.0, 0.0],
      [-4.0, -1.1, 0.12], [4.0, -1.1, -0.12],
      [-3.35, -8.15, 0.05], [3.35, -8.15, -0.05],
    ];
    plinths.forEach(([x, z, lean], index) => {
      const plinth = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.28, 0.82), this.mat.darkStone);
      base.position.y = 0.14;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.46, index < 2 ? 1.45 : 1.05, 0.46), this.mat.stone);
      pillar.position.y = index < 2 ? 0.9 : 0.7;
      pillar.rotation.z = lean;
      plinth.add(base, pillar);
      plinth.position.set(x, 0, z);
      shadowify(plinth);
      group.add(plinth);
    });

    this.scene.add(group);
  }

  _createWall({ x, z, width, rows = 5, yaw = 0, missing = 0.18 }) {
    const blockW = 0.92;
    const blockH = 0.43;
    const blockD = 0.52;
    const columns = Math.max(2, Math.round(width / blockW));
    const transforms = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const edgeDamage = row >= rows - 2 ? missing * 1.8 : missing;
        if (this.random() < edgeDamage) continue;
        const px = (col - (columns - 1) * 0.5) * blockW + ((row % 2) * blockW * 0.5 - blockW * 0.25);
        const py = blockH * 0.5 + row * blockH;
        transforms.push({
          x: px + (this.random() - 0.5) * 0.06,
          y: py + (this.random() - 0.5) * 0.035,
          z: (this.random() - 0.5) * 0.04,
          ry: (this.random() - 0.5) * 0.045,
          s: 0.95 + this.random() * 0.09,
        });
      }
    }

    const geometry = new THREE.BoxGeometry(blockW * 0.96, blockH * 0.92, blockD);
    const mesh = new THREE.InstancedMesh(geometry, this.mat.stone, transforms.length);
    const dummy = new THREE.Object3D();
    transforms.forEach((t, i) => {
      dummy.position.set(t.x, t.y, t.z);
      dummy.rotation.set(0, t.ry, 0);
      dummy.scale.set(t.s, t.s, t.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.position.set(x, 0, z);
    mesh.rotation.y = yaw;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Collider simplificado: visualmente hay huecos, pero el volumen principal sigue siendo muro.
    this.physics.createStaticBox({
      x,
      y: (rows * blockH) * 0.5,
      z,
      hx: width * 0.5,
      hy: rows * blockH * 0.5,
      hz: blockD * 0.48,
      rotationY: yaw,
    });
  }

  _createArch({ x, z, yaw = 0 }) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = yaw;

    const sideGeo = new THREE.BoxGeometry(0.72, 2.45, 0.68);
    const left = new THREE.Mesh(sideGeo, this.mat.stone);
    const right = new THREE.Mesh(sideGeo, this.mat.stone);
    left.position.set(-1.2, 1.225, 0);
    right.position.set(1.2, 1.225, 0);
    group.add(left, right);

    // Dovelas del arco aproximadas con bloques instanciados sobre media circunferencia.
    const wedgeGeo = new THREE.BoxGeometry(0.54, 0.5, 0.72);
    const arch = new THREE.InstancedMesh(wedgeGeo, this.mat.stone, 9);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 9; i += 1) {
      const t = Math.PI - (i / 8) * Math.PI;
      const radius = 1.18;
      dummy.position.set(Math.cos(t) * radius, 2.45 + Math.sin(t) * radius, 0);
      dummy.rotation.set(0, 0, t - Math.PI / 2);
      dummy.scale.setScalar(0.96 + this.random() * 0.08);
      dummy.updateMatrix();
      arch.setMatrixAt(i, dummy.matrix);
    }
    arch.instanceMatrix.needsUpdate = true;
    group.add(arch);
    shadowify(group);
    this.scene.add(group);

    // Dos pilares físicos; el arco queda transitable por debajo.
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    for (const lx of [-1.2, 1.2]) {
      const wx = x + lx * c;
      const wz = z - lx * s;
      this.physics.createStaticBox({ x: wx, y: 1.22, z: wz, hx: 0.36, hy: 1.22, hz: 0.34, rotationY: yaw });
    }
  }

  _createColumn(x, z, height = 2.8, broken = false) {
    const group = new THREE.Group();
    const shaftHeight = broken ? height * 0.62 : height;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.24, 8), this.mat.stone);
    base.position.y = 0.12;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, shaftHeight, 10), this.mat.stone);
    shaft.position.y = 0.24 + shaftHeight * 0.5;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.22, 8), this.mat.stone);
    cap.position.y = 0.24 + shaftHeight + 0.1;
    cap.rotation.z = broken ? 0.08 : 0;
    group.add(base, shaft, cap);
    group.position.set(x, 0, z);
    shadowify(group);
    this.scene.add(group);
    this.physics.createStaticBox({ x, y: shaftHeight * 0.5, z, hx: 0.38, hy: shaftHeight * 0.5, hz: 0.38 });
  }

  _ruins() {
    this._createWall({ x: -6.2, z: -4.8, width: 7.4, rows: 5, yaw: 0.05, missing: 0.2 });
    this._createWall({ x: 6.5, z: -4.1, width: 6.4, rows: 6, yaw: -0.08, missing: 0.22 });
    this._createWall({ x: -7.3, z: 4.2, width: 5.2, rows: 4, yaw: Math.PI * 0.48, missing: 0.24 });
    this._createWall({ x: 7.8, z: 5.0, width: 6.2, rows: 4, yaw: Math.PI * 0.52, missing: 0.3 });
    this._createWall({ x: -1.9, z: 9.8, width: 5.5, rows: 3, yaw: -0.12, missing: 0.34 });

    this._createArch({ x: -2.5, z: -4.35, yaw: 0.02 });
    this._createArch({ x: 4.7, z: 5.8, yaw: Math.PI * 0.52 });

    this._createColumn(-8.6, -0.8, 3.4, false);
    this._createColumn(-5.0, -0.9, 3.1, true);
    this._createColumn(6.0, 1.3, 3.2, true);
    this._createColumn(9.1, -6.7, 3.8, false);
  }

  _processionalMarkers() {
    const markers = [
      [-2.7, 2.1, 0.16], [2.7, 2.1, -0.16],
      [-2.5, -1.3, 0.1], [2.5, -1.3, -0.1],
      [-2.3, -8.8, 0.08], [2.3, -8.8, -0.08],
    ];

    markers.forEach(([x, z, yaw], index) => {
      const group = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.55), this.mat.darkStone);
      base.position.y = 0.16;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.45, 0.28), this.mat.stone);
      shaft.position.y = 1.02;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), this.mat.stone);
      cap.position.y = 1.78;
      const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.16, 6), this.mat.armorDark);
      brazier.position.y = 1.96;
      const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), this.mat.ember);
      ember.position.y = 2.08;
      group.add(base, shaft, cap, brazier, ember);
      group.position.set(x, 0, z);
      group.rotation.y = yaw;
      shadowify(group);
      this.scene.add(group);

      const light = new THREE.PointLight(0xff8e42, 2.8, 3.2, 2.2);
      light.position.set(x, 2.05, z);
      this.scene.add(light);

      this.animated.push((time) => {
        const pulse = 0.92 + Math.sin(time * 7.4 + index * 1.13) * 0.08;
        ember.scale.setScalar(pulse);
        light.intensity = 2.3 + Math.sin(time * 8.0 + index) * 0.45;
      });
    });
  }

  _sanctumBackdrop() {
    const facade = new THREE.Group();
    facade.position.set(0, 0, -13.1);

    const wings = [
      [-4.1, 1.8, 2.8, 4.2, 0.9],
      [4.1, 1.8, 2.8, 4.2, 0.9],
    ];
    for (const [x, y, w, h, d] of wings) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat.darkStone);
      wall.position.set(x, y, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      facade.add(wall);
    }

    const centerLeft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.8, 0.95), this.mat.stone);
    const centerRight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.8, 0.95), this.mat.stone);
    centerLeft.position.set(-1.55, 2.2, 0);
    centerRight.position.set(1.55, 2.2, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.72, 1.0), this.mat.stone);
    lintel.position.set(0, 4.45, 0);
    facade.add(centerLeft, centerRight, lintel);

    const roseOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.22, 12), this.mat.stone);
    roseOuter.rotation.x = Math.PI / 2;
    roseOuter.position.set(0, 3.05, 0.48);
    const roseInner = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.12, 8), this.mat.moonGlass);
    roseInner.rotation.x = Math.PI / 2;
    roseInner.position.set(0, 3.05, 0.56);
    facade.add(roseOuter, roseInner);

    const brokenArch = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.14, 6, 18, Math.PI), this.mat.stone);
    brokenArch.rotation.z = Math.PI;
    brokenArch.position.set(0, 2.35, 0.45);
    facade.add(brokenArch);

    const bannerShape = new THREE.BufferGeometry();
    bannerShape.setAttribute('position', new THREE.Float32BufferAttribute([
      -0.30, 0.0, 0.0,
       0.30, 0.0, 0.0,
       0.22,-1.75, 0.06,
      -0.30, 0.0, 0.0,
       0.22,-1.75, 0.06,
      -0.14,-1.92,-0.02,
    ], 3));
    bannerShape.computeVertexNormals();

    const bannerLeft = new THREE.Mesh(bannerShape, this.mat.bannerBlue);
    bannerLeft.position.set(-2.65, 3.8, 0.48);
    const bannerRight = new THREE.Mesh(bannerShape, this.mat.bannerRed);
    bannerRight.position.set(2.65, 3.8, 0.48);
    facade.add(bannerLeft, bannerRight);

    const candlePositions = [-1.2, -0.55, 0.55, 1.2];
    candlePositions.forEach((x, index) => {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.44, 6), this.mat.wax);
      candle.position.set(x, 1.07, 1.04);
      facade.add(candle);
      const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), this.mat.ember);
      flame.position.set(x, 1.34, 1.04);
      facade.add(flame);
      const light = new THREE.PointLight(0xffb05a, 1.3, 2.1, 2.1);
      light.position.set(x, 1.35, 1.04);
      facade.add(light);
      this.animated.push((time) => {
        flame.scale.setScalar(0.95 + Math.sin(time * 8.2 + index) * 0.08);
        light.intensity = 1.0 + Math.sin(time * 9.3 + index * 1.7) * 0.18;
      });
    });

    shadowify(facade);
    this.scene.add(facade);
  }

  _rubble() {
    const count = 96;
    const geo = new THREE.DodecahedronGeometry(0.18, 0);
    const rubble = new THREE.InstancedMesh(geo, this.mat.darkStone, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i += 1) {
      // Concentramos escombros cerca de los bordes del camino para conservar legibilidad jugable.
      const side = this.random() < 0.5 ? -1 : 1;
      const x = side * (3.2 + this.random() * 10.5) + (this.random() - 0.5) * 2.3;
      const z = -10 + this.random() * 21;
      const scale = 0.35 + this.random() * 1.5;
      dummy.position.set(x, 0.08 + scale * 0.08, z);
      dummy.rotation.set(this.random() * Math.PI, this.random() * Math.PI, this.random() * Math.PI);
      dummy.scale.set(scale * 1.4, scale * 0.65, scale);
      dummy.updateMatrix();
      rubble.setMatrixAt(i, dummy.matrix);
    }
    rubble.castShadow = false;
    rubble.receiveShadow = true;
    rubble.instanceMatrix.needsUpdate = true;
    this.scene.add(rubble);
  }

  _forestFrame() {
    const treePositions = [
      [-14.2, 11.8, 6.8, 0.12], [-11.4, 14.2, 7.4, -0.1], [-7.8, 15.0, 6.2, 0.08],
      [8.8, 14.6, 7.0, -0.08], [12.6, 12.2, 7.8, 0.12], [14.4, 7.2, 6.6, -0.12],
      [-14.6, -2.8, 7.3, 0.1], [-14.0, -10.8, 6.8, -0.14], [-10.2, -14.0, 7.5, 0.08],
      [8.4, -14.4, 7.2, -0.08], [13.0, -11.8, 7.8, 0.1], [14.4, -5.0, 6.9, -0.1],
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.38, 1, 7);
    const branchGeo = new THREE.CylinderGeometry(0.08, 0.14, 1.5, 6);
    const crownGeo = new THREE.DodecahedronGeometry(0.9, 0);

    treePositions.forEach(([x, z, height, lean], treeIndex) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const trunk = new THREE.Mesh(trunkGeo, this.mat.barkDark);
      trunk.scale.y = height;
      trunk.position.y = height * 0.5;
      trunk.rotation.z = lean;
      group.add(trunk);

      for (let b = 0; b < 3; b += 1) {
        const branch = new THREE.Mesh(branchGeo, this.mat.barkDark);
        branch.position.set((b % 2 ? -1 : 1) * (0.35 + b * 0.08), height * (0.52 + b * 0.09), (b - 1) * 0.18);
        branch.rotation.z = (b % 2 ? 1 : -1) * (0.7 + b * 0.09);
        branch.rotation.y = b * 0.8 + treeIndex * 0.21;
        group.add(branch);
      }

      for (let c = 0; c < 5; c += 1) {
        const crown = new THREE.Mesh(crownGeo, c % 3 === 0 ? this.mat.foliageMid : this.mat.foliageDark);
        const angle = (c / 5) * Math.PI * 2 + treeIndex * 0.31;
        crown.position.set(
          Math.cos(angle) * (0.45 + (c % 2) * 0.34),
          height * 0.72 + (c % 3) * 0.62,
          Math.sin(angle) * (0.45 + ((c + 1) % 2) * 0.34),
        );
        const s = 0.75 + (c % 3) * 0.18;
        crown.scale.set(s * 1.25, s * 0.9, s * 1.15);
        crown.rotation.set(c * 0.22, angle, c * 0.16);
        group.add(crown);
      }

      group.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = true;
        }
      });
      this.scene.add(group);
    });

    const fernGeo = new THREE.ConeGeometry(0.12, 0.68, 4);
    const fernPositions = [
      [-5.5, 7.8], [5.8, 8.1], [-6.8, 2.0], [7.1, 1.4], [-5.7, -4.8], [5.9, -5.1],
      [-8.8, -9.0], [8.2, -8.7], [-9.2, 11.0], [9.7, 10.4],
    ];

    fernPositions.forEach(([x, z], index) => {
      const fern = new THREE.Group();
      for (let i = 0; i < 6; i += 1) {
        const leaf = new THREE.Mesh(fernGeo, i % 2 ? this.mat.foliageMid : this.mat.moss);
        const angle = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.18, 0.26, Math.sin(angle) * 0.18);
        leaf.rotation.z = 0.68;
        leaf.rotation.y = -angle;
        leaf.scale.set(0.65, 0.8 + (i % 3) * 0.16, 0.42);
        fern.add(leaf);
      }
      fern.position.set(x, 0, z);
      fern.rotation.y = index * 0.67;
      fern.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = true;
        }
      });
      this.scene.add(fern);
    });
  }

  _destructibles() {
    const placements = [
      { type: "crate", x: -3.1, z: 5.5, r: 0.16, health: 48 },
      { type: "urn", x: 3.3, z: 3.3, r: -0.2, health: 42 },
      { type: "crate", x: 4.0, z: -1.8, r: 0.36, health: 52 },
      { type: "urn", x: -3.7, z: -3.5, r: 0.08, health: 42 },
      { type: "crate", x: -4.6, z: -7.1, r: -0.28, health: 56 },
      { type: "urn", x: 3.4, z: -7.8, r: 0.2, health: 46 },
    ];

    this.destructibles = placements.map((entry) => new DestructibleProp({
      scene: this.scene,
      materials: this.mat,
      position: new THREE.Vector3(entry.x, 0, entry.z),
      type: entry.type,
      rotation: entry.r,
      health: entry.health,
    }));
  }

  _grass() {
    const count = 280;
    const geo = new THREE.ConeGeometry(0.11, 0.45, 4);
    const grass = new THREE.InstancedMesh(geo, this.mat.grass, count);
    const dry = new THREE.InstancedMesh(geo, this.mat.grassDry, Math.floor(count * 0.35));
    const dummy = new THREE.Object3D();

    const scatter = (mesh, amount, seedShift = 0) => {
      for (let i = 0; i < amount; i += 1) {
        const x = -15.5 + this.random() * 31;
        const z = -15.5 + this.random() * 31;
        const avoidPath = Math.abs(x) < 2.5 && z > -10 && z < 13;
        if (avoidPath) {
          i -= 1;
          continue;
        }
        const s = 0.5 + this.random() * 1.45 + seedShift;
        dummy.position.set(x, 0.2, z);
        dummy.rotation.set((this.random() - 0.5) * 0.25, this.random() * Math.PI, (this.random() - 0.5) * 0.25);
        dummy.scale.set(0.65 * s, s, 0.65 * s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
    };

    scatter(grass, count, 0);
    scatter(dry, dry.count, -0.05);
  }

  _graveyard() {
    const count = 20;
    const headstoneGeo = new THREE.BoxGeometry(0.48, 0.78, 0.18);
    const headstones = new THREE.InstancedMesh(headstoneGeo, this.mat.darkStone, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / 7);
      const col = i % 7;
      const x = -13.0 + col * 0.92 + (this.random() - 0.5) * 0.18;
      const z = -2.8 + row * 1.05 + (this.random() - 0.5) * 0.2;
      dummy.position.set(x, 0.38, z);
      dummy.rotation.set(
        (this.random() - 0.5) * 0.14,
        -0.06 + (this.random() - 0.5) * 0.22,
        (this.random() - 0.5) * 0.16,
      );
      dummy.scale.set(0.84 + this.random() * 0.25, 0.75 + this.random() * 0.48, 1);
      dummy.updateMatrix();
      headstones.setMatrixAt(i, dummy.matrix);
    }

    headstones.castShadow = false;
    headstones.receiveShadow = true;
    headstones.instanceMatrix.needsUpdate = true;
    this.scene.add(headstones);

    for (const [x, z, yaw] of [[-11.7, -4.0, 0.08], [-8.4, 1.4, -0.12]]) {
      const cross = new THREE.Group();
      const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.55, 0.2), this.mat.darkStone);
      const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.18, 0.2), this.mat.darkStone);
      vertical.position.y = 0.78;
      horizontal.position.y = 1.05;
      cross.add(vertical, horizontal);
      cross.position.set(x, 0, z);
      cross.rotation.y = yaw;
      shadowify(cross);
      this.scene.add(cross);
    }
  }

  _deadTrees() {
    const positions = [
      [-11.5, 8.8, 0.25],
      [11.4, 9.1, -0.35],
      [-12.6, -8.2, -0.2],
    ];

    positions.forEach(([x, z, lean]) => {
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.7, 7), this.mat.wood);
      trunk.position.y = 1.85;
      trunk.rotation.z = lean;
      group.add(trunk);

      for (let i = 0; i < 4; i += 1) {
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.6 - i * 0.12, 6), this.mat.wood);
        branch.position.set((i % 2 ? -1 : 1) * 0.45, 2.4 + i * 0.28, (i - 1.5) * 0.22);
        branch.rotation.z = (i % 2 ? 1 : -1) * (0.72 + i * 0.07);
        branch.rotation.y = i * 0.8;
        group.add(branch);
      }
      group.position.set(x, 0, z);
      group.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = true;
        }
      });
      this.scene.add(group);
    });
  }

  _braziers() {
    const positions = [[-2.2, -8.0], [2.2, -8.0]];
    positions.forEach(([x, z], index) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 0.34, 6), this.mat.darkStone);
      base.position.y = 0.17;
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 0.24, 8), this.mat.armorDark);
      bowl.position.y = 0.62;
      const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), this.mat.ember);
      ember.position.y = 0.78;
      ember.scale.set(1.0, 0.72, 1.0);
      group.add(base, bowl, ember);
      group.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = true;
        }
      });
      this.scene.add(group);

      const light = new THREE.PointLight(0xff7a2e, 2.8, 3.8, 2.2);
      light.position.set(x, 1.0, z);
      this.scene.add(light);

      this.animated.push((time) => {
        const pulse = 0.88 + Math.sin(time * 7.1 + index * 1.7) * 0.12;
        ember.scale.set(1.0, 0.72 * pulse, 1.0);
        light.intensity = 2.35 + Math.sin(time * 8.3 + index) * 0.42;
      });
    });
  }

  _shrine() {
    const group = new THREE.Group();
    group.position.set(0, 0, -10.5);

    const steps = [
      [3.8, 0.24, 3.2, 0.12],
      [3.0, 0.22, 2.45, 0.35],
      [2.2, 0.2, 1.75, 0.56],
    ];
    steps.forEach(([w, h, d, y]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat.darkStone);
      mesh.position.y = y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    const altar = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.2, 0.8), this.mat.stone);
    altar.position.y = 1.1;
    group.add(altar);

    const runeTexture = createRuneTexture(64);
    const runeMat = new THREE.MeshBasicMaterial({
      map: runeTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.76), runeMat);
    rune.position.set(0, 1.25, 0.415);
    group.add(rune);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 6, 24), this.mat.rune);
    halo.position.set(0, 2.15, 0);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const light = new THREE.PointLight(0xff9d43, 15, 8, 2);
    light.position.set(0, 2.0, 0.5);
    group.add(light);

    shadowify(group);
    this.scene.add(group);
    this.physics.createStaticBox({ x: 0, y: 1.0, z: -10.5, hx: 1.05, hy: 1.0, hz: 0.8 });

    this.shrine = { group, halo, rune, light, activated: false, activation: 0 };

    this.animated.push((time) => {
      const shrine = this.shrine;
      shrine.activation += (shrine.activated ? 1 : 0) * this.deltaTime * 0.72;
      shrine.activation = Math.min(1, shrine.activation);
      const awakened = shrine.activation;

      halo.rotation.z = time * (0.34 + awakened * 0.8);
      halo.rotation.x = Math.PI / 2 + Math.sin(time * 0.8) * awakened * 0.08;
      halo.position.y = 2.12 + Math.sin(time * (1.7 + awakened)) * (0.08 + awakened * 0.08);
      rune.scale.setScalar(0.95 + Math.sin(time * 3.1) * 0.05 + awakened * 0.2);
      light.intensity = 9 + Math.sin(time * 4.7) * 1.8 + Math.sin(time * 7.9) * 0.8 + awakened * 15;
    });
  }

  _embers() {
    const count = 70;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (this.random() - 0.5) * 6;
      positions[i * 3 + 1] = 0.4 + this.random() * 3.4;
      positions[i * 3 + 2] = -10.5 + (this.random() - 0.5) * 5;
      phases[i] = this.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffb650,
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.animated.push((time) => {
      const attr = geo.getAttribute("position");
      for (let i = 0; i < count; i += 1) {
        attr.array[i * 3 + 1] += 0.0025 + Math.sin(time * 0.8 + phases[i]) * 0.0006;
        attr.array[i * 3 + 0] += Math.sin(time * 1.2 + phases[i]) * 0.0007;
        if (attr.array[i * 3 + 1] > 4.0) attr.array[i * 3 + 1] = 0.35;
      }
      attr.needsUpdate = true;
      mat.opacity = 0.68 + Math.sin(time * 2.4) * 0.12;
    });
  }

  _mistWisps() {
    const count = 28;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = -15 + this.random() * 30;
      positions[i * 3 + 1] = 0.24 + this.random() * 0.65;
      positions[i * 3 + 2] = -15 + this.random() * 30;
      phases[i] = this.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xa8b1a5,
      size: 0.42,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.animated.push((time) => {
      const attr = geometry.getAttribute("position");
      for (let i = 0; i < count; i += 1) {
        attr.array[i * 3 + 0] += 0.002 + Math.sin(time * 0.23 + phases[i]) * 0.0012;
        attr.array[i * 3 + 2] += Math.cos(time * 0.19 + phases[i]) * 0.0009;
        if (attr.array[i * 3 + 0] > 16) attr.array[i * 3 + 0] = -16;
      }
      attr.needsUpdate = true;
    });
  }

  getDestructibles() {
    return this.destructibles;
  }

  getShrinePosition(target = new THREE.Vector3()) {
    return target.copy(this.shrinePosition);
  }

  activateShrine() {
    if (this.shrine) this.shrine.activated = true;
  }

  update(time, dt = 1 / 60) {
    this.deltaTime = dt;
    this.animated.forEach((fn) => fn(time));
    this.destructibles.forEach((prop) => prop.update(dt, time));
  }
}
