import * as THREE from "three";
import { makeBillboard } from "../graphics/PixelSpriteFactory.js";
import { getGuardianPixelTexture, getGuardianAnimationFrame, guardianDirectionFromFacing } from "../graphics/GuardianPixelArt.js";
import { createGuardianMarker } from "../graphics/GuardianMarkerArt.js";
import { isoRenderOrder } from "../graphics/IsoDepth.js";

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
    this.phaseVisualTime = 0;
    this.deathVisualTime = 0;

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
    this.model.visible = false;
    this.shadowDisc.visible = false;
    this.pixelSprite = makeBillboard(getGuardianPixelTexture("idle", "south", 0, false), 2.0, 2.36, { renderOrder: 5 });
    this.pixelSprite.position.y = 0.012;
    this.root.add(this.pixelSprite);

    this.selectionRing.visible = false;
    this.pixelSelectionMarker = createGuardianMarker("boss", 1.65);
    this.pixelSelectionMarker.renderOrder = isoRenderOrder(0, 0, 0, -13);
    this.root.add(this.pixelSelectionMarker);

    this._pixelState = "";
    this._pixelDirection = "";
    this._pixelFrame = -1;
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
    this.shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.82, 22),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false }),
    );
    this.shadowDisc.rotation.x = -Math.PI / 2;
    this.shadowDisc.position.y = 0.02;
    this.root.add(this.shadowDisc);

    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.72, 0.02);
    this.rightLeg.position.set(0.22, 0.72, 0.02);
    this.model.add(this.leftLeg, this.rightLeg);
    this._mesh(new THREE.BoxGeometry(0.26, 0.7, 0.28), this.mat.enemyArmorDark, this.leftLeg, [0, -0.33, 0]);
    this._mesh(new THREE.BoxGeometry(0.26, 0.7, 0.28), this.mat.enemyArmorDark, this.rightLeg, [0, -0.33, 0]);
    this._mesh(new THREE.BoxGeometry(0.38, 0.18, 0.5), this.mat.enemyArmor, this.leftLeg, [0, -0.67, -0.08]);
    this._mesh(new THREE.BoxGeometry(0.38, 0.18, 0.5), this.mat.enemyArmor, this.rightLeg, [0, -0.67, -0.08]);
    this._mesh(new THREE.BoxGeometry(0.18, 0.2, 0.13), this.mat.enemyArmor, this.leftLeg, [0, -0.08, 0.12]);
    this._mesh(new THREE.BoxGeometry(0.18, 0.2, 0.13), this.mat.enemyArmor, this.rightLeg, [0, -0.08, 0.12]);

    this.torso = new THREE.Group();
    this.torso.position.y = 1.06;
    this.model.add(this.torso);
    this.bodyCore = this._mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.92, 6), this.mat.enemyArmor, this.torso, [0, 0.3, 0]);
    this.hipSkirt = this._mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.52, 5), this.mat.enemyCloth, this.torso, [0, -0.3, 0], [0, Math.PI / 5, 0]);
    this.leftPauldron = this._mesh(new THREE.SphereGeometry(0.34, 7, 5), this.mat.darkStone, this.torso, [-0.58, 0.58, 0.02], [0.15, 0, 0], [1.35, 0.92, 1.18]);
    this.rightPauldron = this._mesh(new THREE.SphereGeometry(0.28, 7, 5), this.mat.enemyArmorDark, this.torso, [0.56, 0.55, 0.02], [0, 0, 0], [1.18, 0.74, 1.06]);
    this._mesh(new THREE.ConeGeometry(0.14, 0.44, 5), this.mat.enemyArmorDark, this.torso, [0.76, 0.76, -0.04], [0, 0, 0.95]);
    this._mesh(new THREE.ConeGeometry(0.12, 0.34, 5), this.mat.darkStone, this.torso, [-0.84, 0.68, 0.06], [0.15, 0.2, -1.05]);
    this.coreGlow = this._mesh(new THREE.BoxGeometry(0.24, 0.62, 0.11), this.mat.enemyGlowHot, this.torso, [0, 0.25, -0.41]);
    this._mesh(new THREE.BoxGeometry(0.12, 0.64, 0.08), this.mat.enemyBone, this.torso, [-0.22, 0.27, -0.43], [0, 0, -0.28]);
    this._mesh(new THREE.BoxGeometry(0.12, 0.64, 0.08), this.mat.enemyBone, this.torso, [0.22, 0.27, -0.43], [0, 0, 0.28]);
    this._mesh(new THREE.BoxGeometry(0.48, 0.09, 0.07), this.mat.enemyBone, this.torso, [0, 0.52, -0.44]);
    this._mesh(new THREE.BoxGeometry(0.42, 0.08, 0.07), this.mat.enemyBone, this.torso, [0, 0.0, -0.44]);
    this.coreHalo = this._mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.04, 10), this.mat.enemyGlow, this.torso, [0, 0.23, -0.44], [Math.PI / 2, 0, 0]);
    this._mesh(new THREE.BoxGeometry(0.08, 0.62, 0.05), this.mat.enemyArmorDark, this.torso, [0, 0.26, -0.47]);
    this._mesh(new THREE.BoxGeometry(0.06, 0.42, 0.05), this.mat.enemyArmorDark, this.torso, [-0.1, 0.26, -0.46], [0, 0, -0.26]);
    this._mesh(new THREE.BoxGeometry(0.06, 0.42, 0.05), this.mat.enemyArmorDark, this.torso, [0.1, 0.26, -0.46], [0, 0, 0.26]);
    this.backSpine = this._mesh(new THREE.BoxGeometry(0.16, 0.82, 0.14), this.mat.enemyGlow, this.torso, [0, 0.34, 0.39], [0.16, 0, 0.05]);
    this.tatterFrontLeft = this._mesh(new THREE.BoxGeometry(0.1, 0.56, 0.04), this.mat.enemyCloth, this.torso, [-0.16, -0.32, -0.3], [0.18, 0, 0.1]);
    this.tatterFrontRight = this._mesh(new THREE.BoxGeometry(0.12, 0.68, 0.04), this.mat.enemyCloth, this.torso, [0.1, -0.28, -0.32], [0.22, 0, -0.05]);

    this.orbitShards = [];
    for (let i = 0; i < 4; i += 1) {
      const shard = this._mesh(new THREE.BoxGeometry(0.08, 0.18, 0.06), i % 2 === 0 ? this.mat.enemyGlow : this.mat.bone, this.torso, [0, 0.18, -0.05], [0.2, 0.3, 0.1]);
      shard.userData.angle = (i / 4) * Math.PI * 2;
      this.orbitShards.push(shard);
    }

    this.head = new THREE.Group();
    this.head.position.set(0, 1.98, 0.02);
    this.model.add(this.head);
    this._mesh(new THREE.SphereGeometry(0.32, 7, 5), this.mat.enemyArmorDark, this.head, [0, 0.01, 0]);
    this._mesh(new THREE.BoxGeometry(0.56, 0.17, 0.28), this.mat.enemyArmor, this.head, [0, -0.02, -0.24]);
    this._mesh(new THREE.BoxGeometry(0.08, 0.48, 0.34), this.mat.enemyArmor, this.head, [0, 0.05, -0.22]);
    this.eyeLeft = this._mesh(new THREE.BoxGeometry(0.1, 0.05, 0.03), this.mat.enemyGlow, this.head, [-0.12, 0.02, -0.39]);
    this.eyeRight = this._mesh(new THREE.BoxGeometry(0.1, 0.05, 0.03), this.mat.enemyGlow, this.head, [0.12, 0.02, -0.39]);
    this._mesh(new THREE.ConeGeometry(0.115, 0.76, 5), this.mat.enemyBone, this.head, [-0.24, 0.44, 0], [0, 0, 0.52]);
    this._mesh(new THREE.ConeGeometry(0.11, 0.58, 5), this.mat.enemyBone, this.head, [0.25, 0.42, 0], [0, 0, -0.58]);
    this._mesh(new THREE.BoxGeometry(0.18, 0.58, 0.18), this.mat.enemyGlowHot, this.head, [0, 0.64, 0.03], [0, 0, 0.16]);
    this._mesh(new THREE.ConeGeometry(0.085, 0.45, 5), this.mat.enemyStone, this.head, [0, 0.53, 0.16], [0.42, 0, 0]);
    this._mesh(new THREE.ConeGeometry(0.07, 0.34, 5), this.mat.enemyBone, this.head, [-0.36, 0.24, 0.08], [0.12, -0.25, 0.86]);

    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.58, 1.46, 0.02);
    this.rightArm.position.set(0.56, 1.46, 0.02);
    this.model.add(this.leftArm, this.rightArm);
    this._mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.78, 6), this.mat.enemyStone, this.leftArm, [0, -0.34, 0]);
    this._mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.72, 6), this.mat.enemyArmorDark, this.rightArm, [0, -0.34, 0]);
    this._mesh(new THREE.BoxGeometry(0.26, 0.34, 0.22), this.mat.enemyStone, this.leftArm, [0, -0.55, 0.04]);
    this._mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), this.mat.enemyArmor, this.rightArm, [0, -0.55, 0.04]);

    this.leftClaw = new THREE.Group();
    this.leftClaw.position.set(0, -0.58, 0);
    this.leftArm.add(this.leftClaw);
    this._mesh(new THREE.BoxGeometry(0.24, 0.34, 0.22), this.mat.enemyStone, this.leftClaw, [0, -0.02, 0.02]);
    this._mesh(new THREE.ConeGeometry(0.06, 0.34, 5), this.mat.enemyBone, this.leftClaw, [-0.1, -0.22, -0.08], [0.24, 0.05, -0.2]);
    this._mesh(new THREE.ConeGeometry(0.065, 0.37, 5), this.mat.enemyBone, this.leftClaw, [0, -0.24, -0.1], [0.24, 0.0, 0]);
    this._mesh(new THREE.ConeGeometry(0.06, 0.34, 5), this.mat.enemyBone, this.leftClaw, [0.1, -0.22, -0.08], [0.24, -0.05, 0.2]);

    this.weapon = new THREE.Group();
    this.weapon.position.set(0, -0.58, 0);
    this.rightArm.add(this.weapon);
    this._mesh(new THREE.BoxGeometry(0.12, 1.08, 0.08), this.mat.enemyArmor, this.weapon, [0, -0.5, 0]);
    this._mesh(new THREE.BoxGeometry(0.66, 0.14, 0.12), this.mat.enemyArmorDark, this.weapon, [0, 0.03, 0]);
    this.weaponHead = this._mesh(new THREE.BoxGeometry(0.34, 0.48, 0.3), this.mat.enemyGlowHot, this.weapon, [0, -1.0, 0], [0, 0, 0.12]);
    this._mesh(new THREE.ConeGeometry(0.1, 0.34, 5), this.mat.enemyGlowHot, this.weapon, [0, -1.38, 0], [Math.PI, 0, 0]);
    this._mesh(new THREE.ConeGeometry(0.09, 0.36, 5), this.mat.enemyBone, this.weapon, [0.29, -1.0, 0], [0, 0, -Math.PI / 2]);

    this.weaponTrail = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.92, 22, 1, -0.72, 1.44),
      new THREE.MeshBasicMaterial({ color: 0xff9d67, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
    );
    this.weaponTrail.rotation.set(0.18, -Math.PI / 2, -0.15);
    this.weaponTrail.position.set(0.04, -0.5, 0.02);
    this.weaponTrail.visible = false;
    this.weapon.add(this.weaponTrail);

    const capeGeo = new THREE.BufferGeometry();
    capeGeo.setAttribute("position", new THREE.Float32BufferAttribute([
      -0.44, 0.46, 0,
       0.44, 0.46, 0,
       0.36, -0.68, 0.1,
      -0.44, 0.46, 0,
       0.36, -0.68, 0.1,
      -0.34, -0.72, -0.04,
    ], 3));
    capeGeo.computeVertexNormals();
    this.cape = new THREE.Mesh(capeGeo, this.mat.enemyCloth);
    this.cape.position.set(0, 1.4, 0.3);
    this.cape.castShadow = true;
    this.model.add(this.cape);

    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.82, 26),
      new THREE.MeshBasicMaterial({ color: 0xff8c52, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }),
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.04;
    this.root.add(this.selectionRing);

    this.corruptionLight = new THREE.PointLight(0xff6740, 0.55, 3.4, 2.0);
    this.corruptionLight.position.set(0, 1.55, -0.35);
    this.model.add(this.corruptionLight);

    this.model.scale.setScalar(1.16);
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
      this.phaseVisualTime = 0.82;
      this.attackCooldownTime = Math.min(this.attackCooldownTime, 0.2);
      this.audio.playEnemyPhase();
    }

    this.toPlayer.copy(playerPosition).sub(this.root.position);
    this.toPlayer.y = 0;
    const distance = this.toPlayer.length();
    if (distance > 0.001) this.toPlayer.multiplyScalar(1 / distance);

    this.phaseVisualTime = Math.max(0, this.phaseVisualTime - dt);

    if (this.phaseVisualTime > 0) {
      this.velocity.multiplyScalar(Math.exp(-14 * dt));
    } else if (this.staggerTime > 0) {
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
      this.deathVisualTime = 0;
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

    const speed = Math.hypot(this.velocity.x, this.velocity.z);

    if (this.dead) this.deathVisualTime = Math.min(1.4, this.deathVisualTime + dt);

    let spriteState = "idle";
    if (this.dead) spriteState = "death";
    else if (this.phaseVisualTime > 0) spriteState = "phase";
    else if (this.staggerTime > 0) spriteState = "hurt";
    else if (this.attackTime > 0) spriteState = "attack";
    else if (speed > 0.18) spriteState = "walk";

    const attackDuration = this.attackDuration * (this.phaseTwo ? 0.82 : 1);
    const attackProgress = this.attackTime > 0
      ? THREE.MathUtils.clamp(1 - this.attackTime / attackDuration, 0, 0.999)
      : 0;
    const hurtProgress = this.staggerTime > 0
      ? THREE.MathUtils.clamp(1 - this.staggerTime / 0.22, 0, 0.999)
      : 0;
    const phaseProgress = this.phaseVisualTime > 0
      ? THREE.MathUtils.clamp(1 - this.phaseVisualTime / 0.82, 0, 0.999)
      : 0;
    const deathProgress = THREE.MathUtils.clamp(this.deathVisualTime / 1.15, 0, 0.999);

    const direction = guardianDirectionFromFacing(this.facing);
    const frame = getGuardianAnimationFrame(spriteState, time, {
      attackProgress,
      hurtProgress,
      phaseProgress,
      deathProgress,
    });

    if (
      spriteState !== this._pixelState ||
      direction !== this._pixelDirection ||
      frame !== this._pixelFrame ||
      this._pixelPhaseTwo !== this.phaseTwo
    ) {
      this.pixelSprite.material.map = getGuardianPixelTexture(
        spriteState,
        direction,
        frame,
        this.phaseTwo,
      );
      this.pixelSprite.material.needsUpdate = true;
      this._pixelState = spriteState;
      this._pixelDirection = direction;
      this._pixelFrame = frame;
      this._pixelPhaseTwo = this.phaseTwo;
    }

    const phaseScale = this.phaseTwo ? 1.045 : 1;
    this.pixelSprite.scale.set(2.0 * phaseScale, 2.36 * phaseScale, 1);
    this.pixelSprite.material.opacity = this.dead && deathProgress > 0.94 ? 0.86 : 1;
    this.pixelSprite.visible = true;
    this.pixelSprite.renderOrder = isoRenderOrder(
      this.root.position.x,
      this.root.position.z,
      this.root.position.y,
      23,
    );

    // Todo el modelo legado queda fuera de la presentación. La lógica y el
    // collider siguen vivos, pero visualmente el jefe es 100% pixel-art.
    this.model.visible = false;
    this.shadowDisc.visible = false;
    this.weaponTrail.visible = false;
    this.corruptionLight.intensity = 0;
    this.selectionRing.visible = false;

    const pulse = 1 +
      Math.sin(time * (this.phaseTwo ? 6.6 : 3.4)) * (this.phaseTwo ? 0.055 : 0.025) +
      (this.hovered ? 0.055 : 0);

    this.pixelSelectionMarker.visible = !this.dead;
    this.pixelSelectionMarker.scale.setScalar(pulse);
    this.pixelSelectionMarker.material.opacity = this.hovered
      ? 0.98
      : this.phaseTwo
        ? 0.84
        : 0.62;
    this.pixelSelectionMarker.renderOrder = isoRenderOrder(
      this.root.position.x,
      this.root.position.z,
      this.root.position.y,
      -13,
    );
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
