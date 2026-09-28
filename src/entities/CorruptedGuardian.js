import * as THREE from "three";

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export class CorruptedGuardian {
  constructor({ scene, physics, materials, audio, spawn = { x: 0, y: 0.78, z: -5.6 } }) {
    this.scene = scene;
    this.physics = physics;
    this.mat = materials;
    this.audio = audio;

    this.maxHealth = 120;
    this.health = this.maxHealth;
    this.dead = false;
    this.phaseTwo = false;
    this.aggroRange = 8.8;
    this.attackRange = 1.55;
    this.moveSpeed = 1.65;
    this.phaseTwoSpeed = 2.2;
    this.attackDuration = 0.82;
    this.attackTime = 0;
    this.attackCooldown = 0.75;
    this.attackCooldownTime = 0.6;
    this.attackStrikeReady = false;
    this.attackStrikeFired = false;
    this.staggerTime = 0;
    this.verticalVelocity = -0.5;
    this.grounded = false;
    this.facing = new THREE.Vector3(0, 0, 1);
    this.velocity = new THREE.Vector3();
    this.knockback = new THREE.Vector3();
    this.toPlayer = new THREE.Vector3();
    this.hovered = false;

    const character = this.physics.createCharacterCapsule({
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      halfHeight: 0.5,
      radius: 0.34,
    });
    this.body = character.body;
    this.collider = character.collider;
    this.colliderBottomOffset = character.halfHeight + character.radius;

    this.root = new THREE.Group();
    this.model = new THREE.Group();
    this.root.add(this.model);
    this.scene.add(this.root);
    this._buildModel();
    this.syncFromPhysics();
  }

  _mesh(geometry, material, parent, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  _buildModel() {
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.7, 0);
    this.rightLeg.position.set(0.2, 0.7, 0);
    this.model.add(this.leftLeg, this.rightLeg);
    this._mesh(new THREE.BoxGeometry(0.24, 0.66, 0.26), this.mat.enemyArmorDark, this.leftLeg, [0, -0.31, 0]);
    this._mesh(new THREE.BoxGeometry(0.24, 0.66, 0.26), this.mat.enemyArmorDark, this.rightLeg, [0, -0.31, 0]);
    this._mesh(new THREE.BoxGeometry(0.32, 0.16, 0.48), this.mat.enemyArmor, this.leftLeg, [0, -0.65, -0.08]);
    this._mesh(new THREE.BoxGeometry(0.32, 0.16, 0.48), this.mat.enemyArmor, this.rightLeg, [0, -0.65, -0.08]);

    this.torso = new THREE.Group();
    this.torso.position.y = 1.05;
    this.model.add(this.torso);
    this._mesh(new THREE.CylinderGeometry(0.44, 0.36, 0.82, 6), this.mat.enemyArmor, this.torso, [0, 0.28, 0]);
    this._mesh(new THREE.CylinderGeometry(0.43, 0.54, 0.5, 5), this.mat.enemyCloth, this.torso, [0, -0.28, 0], [0, Math.PI / 5, 0]);
    this._mesh(new THREE.BoxGeometry(0.16, 0.55, 0.07), this.mat.enemyGlow, this.torso, [0, 0.27, -0.42]);
    this._mesh(new THREE.SphereGeometry(0.29, 6, 4), this.mat.enemyArmorDark, this.torso, [-0.5, 0.55, 0], [0, 0, 0], [1.15, 0.72, 1.0]);
    this._mesh(new THREE.SphereGeometry(0.29, 6, 4), this.mat.enemyArmorDark, this.torso, [0.5, 0.55, 0], [0, 0, 0], [1.15, 0.72, 1.0]);
    this._mesh(new THREE.ConeGeometry(0.16, 0.46, 5), this.mat.enemyArmorDark, this.torso, [-0.75, 0.72, -0.02], [0, 0, -0.85]);
    this._mesh(new THREE.ConeGeometry(0.16, 0.46, 5), this.mat.enemyArmorDark, this.torso, [0.75, 0.72, -0.02], [0, 0, 0.85]);

    this.head = new THREE.Group();
    this.head.position.set(0, 1.98, 0);
    this.model.add(this.head);
    this._mesh(new THREE.SphereGeometry(0.31, 7, 5), this.mat.enemyArmorDark, this.head, [0, 0, 0]);
    this._mesh(new THREE.BoxGeometry(0.54, 0.16, 0.26), this.mat.enemyArmor, this.head, [0, -0.02, -0.24]);
    this._mesh(new THREE.BoxGeometry(0.08, 0.45, 0.32), this.mat.enemyArmor, this.head, [0, 0.04, -0.22]);
    this.eyeLeft = this._mesh(new THREE.BoxGeometry(0.09, 0.05, 0.03), this.mat.enemyGlow, this.head, [-0.12, 0.02, -0.39]);
    this.eyeRight = this._mesh(new THREE.BoxGeometry(0.09, 0.05, 0.03), this.mat.enemyGlow, this.head, [0.12, 0.02, -0.39]);

    // Astas rotas, exageradas para una silueta de jefe legible a resolución baja.
    this._mesh(new THREE.ConeGeometry(0.1, 0.62, 5), this.mat.bone, this.head, [-0.23, 0.42, 0], [0, 0, 0.48]);
    this._mesh(new THREE.ConeGeometry(0.1, 0.48, 5), this.mat.bone, this.head, [0.24, 0.4, 0], [0, 0, -0.55]);
    this._mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), this.mat.enemyGlow, this.head, [0, 0.62, 0.02], [0, 0, 0.16]);

    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.54, 1.46, 0);
    this.rightArm.position.set(0.54, 1.46, 0);
    this.model.add(this.leftArm, this.rightArm);
    this._mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.68, 6), this.mat.enemyArmorDark, this.leftArm, [0, -0.32, 0]);
    this._mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.68, 6), this.mat.enemyArmorDark, this.rightArm, [0, -0.32, 0]);

    this.weapon = new THREE.Group();
    this.weapon.position.set(0, -0.56, 0);
    this.rightArm.add(this.weapon);
    this._mesh(new THREE.BoxGeometry(0.11, 1.02, 0.08), this.mat.enemyArmor, this.weapon, [0, -0.48, 0]);
    this._mesh(new THREE.BoxGeometry(0.6, 0.12, 0.12), this.mat.enemyArmorDark, this.weapon, [0, 0.04, 0]);
    this._mesh(new THREE.BoxGeometry(0.17, 0.26, 0.22), this.mat.enemyGlow, this.weapon, [0, -0.97, 0]);

    const capeGeo = new THREE.BufferGeometry();
    capeGeo.setAttribute("position", new THREE.Float32BufferAttribute([
      -0.42, 0.44, 0, 0.42, 0.44, 0, 0.34, -0.62, 0.08,
      -0.42, 0.44, 0, 0.34, -0.62, 0.08, -0.32, -0.66, -0.04,
    ], 3));
    capeGeo.computeVertexNormals();
    this.cape = new THREE.Mesh(capeGeo, this.mat.enemyCloth);
    this.cape.position.set(0, 1.38, 0.29);
    this.cape.castShadow = true;
    this.model.add(this.cape);

    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.82, 26),
      new THREE.MeshBasicMaterial({ color: 0xff8c52, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }),
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.04;
    this.root.add(this.selectionRing);

    this.model.scale.setScalar(1.08);
  }

  fixedUpdate(dt, playerPosition) {
    this.attackCooldownTime = Math.max(0, this.attackCooldownTime - dt);
    this.attackStrikeReady = false;

    if (this.dead) {
      this.velocity.multiplyScalar(Math.exp(-8 * dt));
      return;
    }

    if (!this.phaseTwo && this.health <= this.maxHealth * 0.48) {
      this.phaseTwo = true;
      this.attackCooldownTime = Math.min(this.attackCooldownTime, 0.2);
      this.audio.playEnemyPhase();
    }

    this.toPlayer.copy(playerPosition).sub(this.root.position);
    this.toPlayer.y = 0;
    const distance = this.toPlayer.length();
    if (distance > 0.001) this.toPlayer.multiplyScalar(1 / distance);

    if (this.staggerTime > 0) {
      this.staggerTime = Math.max(0, this.staggerTime - dt);
      this.velocity.multiplyScalar(Math.exp(-11 * dt));
    } else if (this.attackTime > 0) {
      this.attackTime = Math.max(0, this.attackTime - dt);
      const progress = 1 - this.attackTime / this.attackDuration;
      if (!this.attackStrikeFired && progress >= 0.52) {
        this.attackStrikeFired = true;
        this.attackStrikeReady = true;
        this.audio.playEnemySwing();
      }
      this.velocity.multiplyScalar(Math.exp(-15 * dt));
    } else if (distance <= this.attackRange && this.attackCooldownTime <= 0) {
      this.attackTime = this.attackDuration * (this.phaseTwo ? 0.82 : 1);
      this.attackStrikeFired = false;
      this.attackCooldownTime = this.phaseTwo ? 0.5 : this.attackCooldown;
      this.velocity.set(0, 0, 0);
    } else if (distance <= this.aggroRange && distance > 0.05) {
      this.facing.lerp(this.toPlayer, 0.15).normalize();
      const speed = this.phaseTwo ? this.phaseTwoSpeed : this.moveSpeed;
      const stopFactor = THREE.MathUtils.smoothstep(distance, 1.25, 2.2);
      this.velocity.x = damp(this.velocity.x, this.toPlayer.x * speed * stopFactor, 8.5, dt);
      this.velocity.z = damp(this.velocity.z, this.toPlayer.z * speed * stopFactor, 8.5, dt);
    } else {
      this.velocity.x = damp(this.velocity.x, 0, 6, dt);
      this.velocity.z = damp(this.velocity.z, 0, 6, dt);
    }

    this.knockback.multiplyScalar(Math.exp(-7.5 * dt));
    this.verticalVelocity += -18 * dt;
    if (this.grounded && this.verticalVelocity < -1) this.verticalVelocity = -1;

    const result = this.physics.moveCharacter(this.collider, this.body, {
      x: (this.velocity.x + this.knockback.x) * dt,
      y: this.verticalVelocity * dt,
      z: (this.velocity.z + this.knockback.z) * dt,
    });
    this.grounded = result.grounded;
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = -0.6;
  }

  takeDamage(amount, direction) {
    if (this.dead) return false;
    this.health = Math.max(0, this.health - amount);
    this.staggerTime = 0.22;
    this.attackTime = 0;
    this.knockback.copy(direction).setY(0);
    if (this.knockback.lengthSq() > 0.0001) this.knockback.normalize().multiplyScalar(3.6);
    this.audio.playEnemyHurt();

    if (this.health <= 0) {
      this.dead = true;
      this.attackTime = 0;
      this.velocity.set(0, 0, 0);
      this.knockback.set(0, 0, 0);
      // El cadáver deja de ser una pared invisible y permite continuar hacia el altar.
      this.collider.setEnabled(false);
      this.audio.playEnemyDefeat();
    }
    return true;
  }

  consumeAttackStrike() {
    if (!this.attackStrikeReady) return false;
    this.attackStrikeReady = false;
    return true;
  }

  syncFromPhysics() {
    const p = this.body.translation();
    this.root.position.set(p.x, p.y - this.colliderBottomOffset, p.z);
  }

  updateVisuals(dt, time) {
    this.syncFromPhysics();

    if (this.facing.lengthSq() > 0.001) {
      const targetYaw = Math.atan2(-this.facing.x, -this.facing.z);
      let delta = targetYaw - this.model.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.model.rotation.y += delta * (1 - Math.exp(-10 * dt));
    }

    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const moveAmount = THREE.MathUtils.clamp(speed / this.phaseTwoSpeed, 0, 1);
    const stride = Math.sin(time * (this.phaseTwo ? 9.2 : 7.2));
    this.leftLeg.rotation.x = stride * 0.48 * moveAmount;
    this.rightLeg.rotation.x = -stride * 0.48 * moveAmount;
    this.leftArm.rotation.x = -stride * 0.18 * moveAmount;
    this.rightArm.rotation.x = stride * 0.16 * moveAmount;
    this.model.position.y = Math.abs(Math.sin(time * 7.2)) * 0.028 * moveAmount;
    this.cape.rotation.x = -0.12 - moveAmount * 0.18 + Math.sin(time * 5.4) * 0.04;

    if (this.attackTime > 0) {
      const progress = 1 - this.attackTime / (this.attackDuration * (this.phaseTwo ? 0.82 : 1));
      const anticipation = THREE.MathUtils.smoothstep(progress, 0.0, 0.46);
      const slash = Math.sin(THREE.MathUtils.clamp((progress - 0.40) / 0.48, 0, 1) * Math.PI);
      this.rightArm.rotation.x = -0.7 - anticipation * 1.15 + slash * 2.15;
      this.rightArm.rotation.z = -0.28 - slash * 1.15;
      this.torso.rotation.y = anticipation * 0.22 - slash * 0.45;
    } else {
      this.rightArm.rotation.z = damp(this.rightArm.rotation.z, -0.08, 9, dt);
      this.torso.rotation.y = damp(this.torso.rotation.y, 0, 9, dt);
    }

    const hoverBoost = this.hovered ? 0.08 : 0.0;
    const ringPulse = 1.0 + Math.sin(time * (this.phaseTwo ? 6.4 : 3.2)) * (this.phaseTwo ? 0.08 : 0.03) + hoverBoost;
    this.selectionRing.scale.setScalar(ringPulse);
    this.selectionRing.material.opacity = this.dead ? 0.0 : (this.hovered ? 0.96 : (this.phaseTwo ? 0.88 : 0.62));

    if (this.phaseTwo && !this.dead) {
      const pulse = 1 + Math.sin(time * 8.0) * 0.07;
      this.eyeLeft.scale.setScalar(pulse);
      this.eyeRight.scale.setScalar(pulse);
    }

    if (this.staggerTime > 0) {
      this.model.rotation.z = Math.sin(time * 42) * 0.07;
    } else if (this.dead) {
      this.model.rotation.z = damp(this.model.rotation.z, 1.36, 2.8, dt);
      this.model.position.y = damp(this.model.position.y, -0.12, 2.3, dt);
      this.model.scale.multiplyScalar(1 - Math.min(0.25 * dt, 0.01));
    } else {
      this.model.rotation.z = damp(this.model.rotation.z, 0, 10, dt);
    }
  }

  setHovered(flag) {
    this.hovered = Boolean(flag) && !this.dead;
  }

  getPosition(target = new THREE.Vector3()) {
    return target.copy(this.root.position);
  }

  getFacing(target = new THREE.Vector3()) {
    return target.copy(this.facing);
  }

  getHealthRatio() {
    return this.health / this.maxHealth;
  }
}
