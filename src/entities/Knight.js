import * as THREE from "three";

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export class Knight {
  constructor({ scene, physics, input, camera, materials, audio }) {
    this.scene = scene;
    this.physics = physics;
    this.input = input;
    this.camera = camera;
    this.mat = materials;
    this.audio = audio;

    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.invulnerabilityTime = 0;
    this.hurtTime = 0;
    this.dead = false;

    this.walkSpeed = 3.25;
    this.runSpeed = 5.0;
    this.dashSpeed = 8.8;
    this.dashDuration = 0.22;
    this.dashCooldown = 0.68;
    this.dashTime = 0;
    this.dashCooldownTime = 0;

    this.attackTime = 0;
    this.attackDuration = 0.38;
    this.attackStrikeReady = false;
    this.attackStrikeFired = false;

    this.verticalVelocity = -0.4;
    this.grounded = false;
    this.facing = new THREE.Vector3(0, 0, -1);
    this.moveVelocity = new THREE.Vector3();
    this.knockback = new THREE.Vector3();
    this.desiredMove = new THREE.Vector3();
    this.screenForward = new THREE.Vector3();
    this.screenRight = new THREE.Vector3();
    this.worldUp = new THREE.Vector3(0, 1, 0);
    this.stepDistance = 0;
    this.moveTargetStopRadius = 0.34;
    this.queuedAttack = false;

    const physicsPlayer = this.physics.createPlayerCapsule({ x: 0, y: 0.74, z: 8.5 });
    this.body = physicsPlayer.body;
    this.collider = physicsPlayer.collider;
    this.colliderBottomOffset = physicsPlayer.halfHeight + physicsPlayer.radius;

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
    this.leftLeg.position.set(-0.17, 0.64, 0);
    this.rightLeg.position.set(0.17, 0.64, 0);
    this.model.add(this.leftLeg, this.rightLeg);

    this._mesh(new THREE.BoxGeometry(0.2, 0.56, 0.22), this.mat.armorDark, this.leftLeg, [0, -0.28, 0]);
    this._mesh(new THREE.BoxGeometry(0.2, 0.56, 0.22), this.mat.armorDark, this.rightLeg, [0, -0.28, 0]);
    this._mesh(new THREE.BoxGeometry(0.27, 0.16, 0.42), this.mat.leather, this.leftLeg, [0, -0.59, -0.07]);
    this._mesh(new THREE.BoxGeometry(0.27, 0.16, 0.42), this.mat.leather, this.rightLeg, [0, -0.59, -0.07]);

    this.torso = new THREE.Group();
    this.torso.position.y = 0.93;
    this.model.add(this.torso);
    this._mesh(new THREE.CylinderGeometry(0.38, 0.33, 0.7, 6), this.mat.armor, this.torso, [0, 0.28, 0]);
    this._mesh(new THREE.CylinderGeometry(0.39, 0.47, 0.42, 4), this.mat.cloth, this.torso, [0, -0.18, 0], [0, Math.PI / 4, 0]);
    this._mesh(new THREE.BoxGeometry(0.75, 0.11, 0.12), this.mat.leather, this.torso, [0, 0.0, 0.31]);
    this._mesh(new THREE.BoxGeometry(0.12, 0.42, 0.05), this.mat.cloth, this.torso, [0, 0.27, -0.35]);
    this._mesh(new THREE.SphereGeometry(0.23, 6, 4), this.mat.armor, this.torso, [-0.42, 0.48, 0], [0, 0, 0], [1.15, 0.65, 1]);
    this._mesh(new THREE.SphereGeometry(0.23, 6, 4), this.mat.armor, this.torso, [0.42, 0.48, 0], [0, 0, 0], [1.15, 0.65, 1]);

    this.head = new THREE.Group();
    this.head.position.set(0, 1.74, 0);
    this.model.add(this.head);
    this._mesh(new THREE.SphereGeometry(0.28, 7, 5), this.mat.armor, this.head, [0, 0, 0]);
    this._mesh(new THREE.BoxGeometry(0.48, 0.12, 0.28), this.mat.armorDark, this.head, [0, -0.02, -0.22]);
    this._mesh(new THREE.BoxGeometry(0.07, 0.42, 0.36), this.mat.armorDark, this.head, [0, 0.05, -0.2]);
    this._mesh(new THREE.ConeGeometry(0.16, 0.38, 5), this.mat.armor, this.head, [0, 0.36, 0]);
    this._mesh(new THREE.BoxGeometry(0.08, 0.44, 0.04), this.mat.cloth, this.head, [0, 0.48, -0.03], [0.22, 0, -0.02]);

    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.46, 1.34, 0);
    this.rightArm.position.set(0.46, 1.34, 0);
    this.model.add(this.leftArm, this.rightArm);
    this._mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.58, 6), this.mat.armorDark, this.leftArm, [0, -0.27, 0]);
    this._mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.58, 6), this.mat.armorDark, this.rightArm, [0, -0.27, 0]);

    this.shield = new THREE.Group();
    this.shield.position.set(-0.08, -0.34, 0.05);
    this.leftArm.add(this.shield);
    this._mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.09, 8), this.mat.wood, this.shield, [0, 0, 0], [Math.PI / 2, 0, 0], [0.88, 1, 1.12]);
    this._mesh(new THREE.BoxGeometry(0.06, 0.46, 0.04), this.mat.armor, this.shield, [0, 0, -0.05]);
    this._mesh(new THREE.BoxGeometry(0.28, 0.06, 0.04), this.mat.armor, this.shield, [0, 0, -0.05]);
    this._mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 8), this.mat.armor, this.shield, [0, 0, -0.04], [Math.PI / 2, 0, 0]);

    this.swordPivot = new THREE.Group();
    this.swordPivot.position.set(0, -0.48, 0);
    this.rightArm.add(this.swordPivot);
    this._mesh(new THREE.BoxGeometry(0.09, 0.82, 0.055), this.mat.armor, this.swordPivot, [0, -0.38, 0]);
    this._mesh(new THREE.BoxGeometry(0.48, 0.08, 0.08), this.mat.armorDark, this.swordPivot, [0, 0.02, 0]);
    this._mesh(new THREE.BoxGeometry(0.10, 0.28, 0.10), this.mat.leather, this.swordPivot, [0, 0.18, 0]);

    const capeGeo = new THREE.BufferGeometry();
    capeGeo.setAttribute("position", new THREE.Float32BufferAttribute([
      -0.34, 0.36, 0,
       0.34, 0.36, 0,
       0.28,-0.42, 0.08,
      -0.34, 0.36, 0,
       0.28,-0.42, 0.08,
      -0.26,-0.44,-0.02,
    ], 3));
    capeGeo.computeVertexNormals();
    this.cape = new THREE.Mesh(capeGeo, this.mat.cloth);
    this.cape.position.set(0, 1.25, 0.24);
    this.cape.rotation.x = -0.08;
    this.cape.castShadow = true;
    this.model.add(this.cape);

    this.destinationRing = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.28, 20),
      new THREE.MeshBasicMaterial({ color: 0xd6c48b, transparent: true, opacity: 0.0, depthWrite: false, toneMapped: false }),
    );
    this.destinationRing.rotation.x = -Math.PI / 2;
    this.destinationRing.position.y = 0.045;
    this.destinationRing.visible = false;
    this.scene.add(this.destinationRing);

    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.56, 24),
      new THREE.MeshBasicMaterial({ color: 0xf3dc8b, transparent: true, opacity: 0.65, depthWrite: false, toneMapped: false }),
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.035;
    this.root.add(this.selectionRing);

    this.model.scale.setScalar(1.04);
  }

  fixedUpdate(dt) {
    this.invulnerabilityTime = Math.max(0, this.invulnerabilityTime - dt);
    this.hurtTime = Math.max(0, this.hurtTime - dt);
    this.dashCooldownTime = Math.max(0, this.dashCooldownTime - dt);
    this.attackStrikeReady = false;

    if (this.dead) {
      this.moveVelocity.multiplyScalar(Math.exp(-8 * dt));
      this.knockback.multiplyScalar(Math.exp(-6 * dt));
      this._movePhysics(dt, this.knockback.x, this.knockback.z);
      return;
    }

    if (this.attackTime > 0) {
      this.attackTime = Math.max(0, this.attackTime - dt);
      const progress = 1 - this.attackTime / this.attackDuration;
      if (!this.attackStrikeFired && progress >= 0.34) {
        this.attackStrikeFired = true;
        this.attackStrikeReady = true;
      }
    }

    const attackRequested = this.input.consumePressed("KeyJ") || this.queuedAttack;
    this.queuedAttack = false;

    if (this.hurtTime <= 0 && attackRequested && this.attackTime <= 0 && this.dashTime <= 0) {
      this.attackTime = this.attackDuration;
      this.attackStrikeFired = false;
      this.audio.playSword();
    }

    if (this.hurtTime <= 0 && this.input.consumePressed("Space") && this.dashCooldownTime <= 0 && this.dashTime <= 0) {
      this.dashTime = this.dashDuration;
      this.dashCooldownTime = this.dashCooldown;
      this.invulnerabilityTime = Math.max(this.invulnerabilityTime, this.dashDuration + 0.06);
      this.audio.playDash();
    }

    const axes = this.input.getMovementAxes();
    this.camera.getWorldDirection(this.screenForward);
    this.screenForward.y = 0;
    this.screenForward.normalize();
    this.screenRight.crossVectors(this.screenForward, this.worldUp).normalize();

    this.desiredMove.set(0, 0, 0)
      .addScaledVector(this.screenForward, axes.y)
      .addScaledVector(this.screenRight, axes.x);

    if (this.desiredMove.lengthSq() > 1) this.desiredMove.normalize();

    const target = this.input.getMoveTarget();
    const hasManualInput = Math.abs(axes.x) > 0.001 || Math.abs(axes.y) > 0.001;
    if (!hasManualInput && target && this.hurtTime <= 0) {
      const p = this.body.translation();
      this.desiredMove.set(target.x - p.x, 0, target.z - p.z);
      const distance = this.desiredMove.length();
      const stopRadius = target.stopRadius ?? this.moveTargetStopRadius;
      if (distance <= stopRadius) {
        this.desiredMove.set(0, 0, 0);
        this.input.clearMoveTarget();
      } else {
        this.desiredMove.divideScalar(distance);
      }
    } else if (hasManualInput) {
      this.input.clearMoveTarget();
    }

    const moving = this.desiredMove.lengthSq() > 0.0001;
    if (moving && this.hurtTime <= 0) this.facing.lerp(this.desiredMove, 0.32).normalize();

    if (this.dashTime > 0) {
      this.dashTime = Math.max(0, this.dashTime - dt);
      if (!moving) this.desiredMove.copy(this.facing);
      this.moveVelocity.copy(this.desiredMove).normalize().multiplyScalar(this.dashSpeed);
    } else if (this.hurtTime > 0) {
      this.moveVelocity.multiplyScalar(Math.exp(-10 * dt));
    } else {
      const speed = this.input.isRunning() ? this.runSpeed : this.walkSpeed;
      const targetX = this.desiredMove.x * speed;
      const targetZ = this.desiredMove.z * speed;
      this.moveVelocity.x = damp(this.moveVelocity.x, targetX, 14, dt);
      this.moveVelocity.z = damp(this.moveVelocity.z, targetZ, 14, dt);
    }

    this.knockback.multiplyScalar(Math.exp(-7.5 * dt));
    this._movePhysics(dt, this.moveVelocity.x + this.knockback.x, this.moveVelocity.z + this.knockback.z);
  }

  _movePhysics(dt, vx, vz) {
    this.verticalVelocity += -18 * dt;
    if (this.grounded && this.verticalVelocity < -1) this.verticalVelocity = -1;

    const result = this.physics.moveCharacter(this.collider, this.body, {
      x: vx * dt,
      y: this.verticalVelocity * dt,
      z: vz * dt,
    });

    this.grounded = result.grounded;
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = -0.6;
  }

  receiveDamage(amount, direction) {
    if (this.dead || this.invulnerabilityTime > 0 || this.dashTime > 0) return false;

    this.health = Math.max(0, this.health - amount);
    this.invulnerabilityTime = 0.56;
    this.hurtTime = 0.24;
    this.knockback.copy(direction).setY(0);
    if (this.knockback.lengthSq() > 0.0001) this.knockback.normalize().multiplyScalar(4.2);
    this.audio.playPlayerHurt();

    if (this.health <= 0) {
      this.dead = true;
      this.attackTime = 0;
      this.dashTime = 0;
      this.audio.playDefeat();
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

    const planarSpeed = Math.hypot(this.moveVelocity.x, this.moveVelocity.z);
    const moveAmount = THREE.MathUtils.clamp(planarSpeed / this.runSpeed, 0, 1);

    if (this.facing.lengthSq() > 0.001) {
      const targetYaw = Math.atan2(-this.facing.x, -this.facing.z);
      let delta = targetYaw - this.model.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.model.rotation.y += delta * (1 - Math.exp(-14 * dt));
    }

    const stride = Math.sin(time * (planarSpeed > this.walkSpeed + 0.3 ? 11.5 : 8.4));
    const bob = Math.abs(Math.sin(time * 8.4)) * 0.035 * moveAmount;
    this.model.position.y = bob + (this.dashTime > 0 ? -0.08 : 0);
    this.leftLeg.rotation.x = stride * 0.55 * moveAmount;
    this.rightLeg.rotation.x = -stride * 0.55 * moveAmount;
    this.leftArm.rotation.x = -stride * 0.28 * moveAmount;
    this.rightArm.rotation.x = stride * 0.22 * moveAmount;
    this.leftArm.rotation.z = 0;
    this.torso.rotation.z = Math.sin(time * 4.2) * 0.015 * moveAmount;
    this.head.rotation.z = Math.sin(time * 3.8 + 1.1) * 0.012 * moveAmount;

    const capeLift = 0.10 + moveAmount * 0.26 + (this.dashTime > 0 ? 0.32 : 0);
    this.cape.rotation.x = -capeLift + Math.sin(time * 7.0) * 0.035 * moveAmount;

    if (this.attackTime > 0) {
      const progress = 1 - this.attackTime / this.attackDuration;
      const swing = Math.sin(progress * Math.PI);
      this.rightArm.rotation.z = -0.35 - swing * 1.55;
      this.rightArm.rotation.x += -0.55 + swing * 0.75;
      this.torso.rotation.y = -swing * 0.24;
    } else {
      this.rightArm.rotation.z = damp(this.rightArm.rotation.z, -0.08, 12, dt);
      this.torso.rotation.y = damp(this.torso.rotation.y, 0, 12, dt);
    }

    if (this.hurtTime > 0) {
      this.torso.rotation.z += Math.sin(time * 45) * 0.045;
    }

    if (this.dead) {
      this.model.rotation.z = damp(this.model.rotation.z, -1.28, 3.7, dt);
      this.model.position.y = damp(this.model.position.y, 0.08, 4, dt);
    } else {
      this.model.rotation.z = damp(this.model.rotation.z, 0, 12, dt);
    }

    // Parpadeo breve de invulnerabilidad, deliberadamente discreto para no romper la lectura.
    this.model.visible = !(this.invulnerabilityTime > 0 && Math.floor(time * 18) % 2 === 0 && this.hurtTime > 0);

    const ringPulse = 1.0 + Math.sin(time * 3.4) * 0.03 + moveAmount * 0.04;
    this.selectionRing.scale.setScalar(ringPulse);
    this.selectionRing.material.opacity = this.dead ? 0.18 : (this.dashTime > 0 ? 0.92 : 0.68);

    const moveTarget = this.input.getMoveTarget();
    if (moveTarget && !this.dead) {
      this.destinationRing.visible = true;
      this.destinationRing.position.set(moveTarget.x, 0.045, moveTarget.z);
      const pulse = 1.0 + Math.sin(time * 6.0) * 0.08;
      this.destinationRing.scale.setScalar(pulse);
      this.destinationRing.material.opacity = 0.58;
    } else {
      this.destinationRing.visible = false;
    }

    if (moveAmount > 0.16 && this.grounded && this.dashTime <= 0 && !this.dead) {
      this.stepDistance += planarSpeed * dt;
      const stepLength = planarSpeed > this.walkSpeed + 0.4 ? 0.74 : 0.9;
      if (this.stepDistance >= stepLength) {
        this.stepDistance = 0;
        this.audio.playFootstep();
      }
    } else {
      this.stepDistance = 0;
    }
  }

  queueAttack() {
    this.queuedAttack = true;
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

  dispose() {
    this.destinationRing?.removeFromParent();
    this.destinationRing?.geometry?.dispose?.();
    this.destinationRing?.material?.dispose?.();
  }
}
