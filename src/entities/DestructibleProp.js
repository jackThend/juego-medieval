import * as THREE from "three";

export class DestructibleProp {
  constructor({ scene, materials, position, type = "crate", rotation = 0, health = 52 }) {
    this.scene = scene;
    this.mat = materials;
    this.type = type;
    this.maxHealth = health;
    this.health = health;
    this.dead = false;
    this.hovered = false;
    this.flashTime = 0;
    this.breakAge = 0;
    this.parts = [];
    this.hitDirection = new THREE.Vector3();
    this.unitScale = new THREE.Vector3(1, 1, 1);

    this.root = new THREE.Group();
    this.root.position.copy(position);
    this.root.rotation.y = rotation;
    this.scene.add(this.root);

    if (type === "urn") this._buildUrn();
    else this._buildCrate();

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(type === "urn" ? 0.38 : 0.48, type === "urn" ? 0.48 : 0.60, 20),
      new THREE.MeshBasicMaterial({
        color: 0xe0c788,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.035;
    this.root.add(this.ring);

    this.hitLight = new THREE.PointLight(0xffc37c, 0, 2.1, 2.2);
    this.hitLight.position.set(0, type === "urn" ? 0.66 : 0.56, 0);
    this.root.add(this.hitLight);
  }

  _piece(geometry, material, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.velocity = new THREE.Vector3();
    mesh.userData.spin = new THREE.Vector3();
    this.parts.push(mesh);
    this.root.add(mesh);
    return mesh;
  }

  _buildCrate() {
    this._piece(new THREE.BoxGeometry(0.92, 0.76, 0.88), this.mat.destructibleWood, [0, 0.4, 0]);
    this._piece(new THREE.BoxGeometry(1.02, 0.09, 0.09), this.mat.ironDark, [0, 0.42, -0.46]);
    this._piece(new THREE.BoxGeometry(0.09, 0.76, 0.09), this.mat.ironDark, [-0.31, 0.4, -0.46]);
    this._piece(new THREE.BoxGeometry(0.09, 0.76, 0.09), this.mat.ironDark, [0.31, 0.4, -0.46]);
    this._piece(new THREE.BoxGeometry(0.12, 0.9, 0.06), this.mat.destructibleWoodDark, [0, 0.4, -0.49], [0, 0, 0.72]);
    this._piece(new THREE.BoxGeometry(0.12, 0.9, 0.06), this.mat.destructibleWoodDark, [0, 0.4, -0.495], [0, 0, -0.72]);
  }

  _buildUrn() {
    this._piece(new THREE.CylinderGeometry(0.28, 0.38, 0.5, 8), this.mat.destructibleStone, [0, 0.28, 0]);
    this._piece(new THREE.CylinderGeometry(0.34, 0.28, 0.2, 8), this.mat.wetStone, [0, 0.62, 0]);
    this._piece(new THREE.CylinderGeometry(0.18, 0.24, 0.22, 8), this.mat.destructibleStone, [0, 0.82, 0]);
    this._piece(new THREE.TorusGeometry(0.2, 0.045, 5, 10), this.mat.ironDark, [0, 0.94, 0], [Math.PI / 2, 0, 0]);
  }

  getPosition(target = new THREE.Vector3()) {
    return target.copy(this.root.position);
  }

  getAimPoint(target = new THREE.Vector3()) {
    return target.set(
      this.root.position.x,
      this.root.position.y + (this.type === "urn" ? 0.62 : 0.48),
      this.root.position.z,
    );
  }

  getClickRadius() {
    return this.type === "urn" ? 0.52 : 0.7;
  }

  setHovered(flag) {
    this.hovered = Boolean(flag) && !this.dead;
  }

  takeDamage(amount, direction = new THREE.Vector3()) {
    if (this.dead) return false;
    this.health = Math.max(0, this.health - amount);
    this.flashTime = 0.12;
    this.hitDirection.copy(direction);
    if (this.hitDirection.lengthSq() > 0.001) this.hitDirection.normalize();
    if (this.health <= 0) this._break();
    return true;
  }

  _break() {
    this.dead = true;
    this.breakAge = 0;
    this.ring.visible = false;

    this.parts.forEach((part, index) => {
      const angle = (index / Math.max(1, this.parts.length)) * Math.PI * 2;
      part.userData.velocity.set(
        Math.cos(angle) * (0.85 + Math.random() * 0.8) + this.hitDirection.x * 1.4,
        1.6 + Math.random() * 1.4,
        Math.sin(angle) * (0.85 + Math.random() * 0.8) + this.hitDirection.z * 1.4,
      );
      part.userData.spin.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 6,
      );
    });
  }

  update(dt, time) {
    if (!this.dead) {
      const pulse = 1 + Math.sin(time * 5.2) * 0.045;
      this.ring.visible = this.hovered;
      this.ring.scale.setScalar(pulse);
      this.ring.material.opacity = this.hovered ? 0.72 : 0;

      if (this.flashTime > 0) {
        this.flashTime = Math.max(0, this.flashTime - dt);
        const flash = this.flashTime / 0.12;
        this.hitLight.intensity = flash * 3.2;
        this.root.scale.setScalar(1 + flash * 0.045);
      } else {
        this.hitLight.intensity *= Math.exp(-18 * dt);
        this.root.scale.lerp(this.unitScale, 1 - Math.exp(-18 * dt));
      }
      return;
    }

    this.breakAge += dt;
    this.hitLight.intensity *= Math.exp(-10 * dt);

    for (const part of this.parts) {
      const velocity = part.userData.velocity;
      const spin = part.userData.spin;
      velocity.y -= 5.8 * dt;
      part.position.addScaledVector(velocity, dt);
      part.rotation.x += spin.x * dt;
      part.rotation.y += spin.y * dt;
      part.rotation.z += spin.z * dt;

      if (part.position.y < 0.08) {
        part.position.y = 0.08;
        velocity.y *= -0.18;
        velocity.x *= 0.72;
        velocity.z *= 0.72;
      }

      if (this.breakAge > 0.72) {
        const shrink = Math.max(0, 1 - (this.breakAge - 0.72) / 0.45);
        part.scale.setScalar(shrink);
      }
    }

    if (this.breakAge > 1.2) this.root.visible = false;
  }
}
