import * as THREE from "three";
import { makeBillboard } from "../graphics/PixelSpriteFactory.js";
import { getKnightPixelTexture, getKnightAnimationFrame, knightDirectionFromFacing } from "../graphics/KnightPixelArt.js";
import { createKnightGroundMarker } from "../graphics/KnightMarkerArt.js";
import { isoRenderOrder } from "../graphics/IsoDepth.js";

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
    this.deathVisualTime = 0;

    const physicsPlayer = this.physics.createPlayerCapsule({ x: 0, y: 0.74, z: 8.5 });
    this.body = physicsPlayer.body;
    this.collider = physicsPlayer.collider;
    this.colliderBottomOffset = physicsPlayer.halfHeight + physicsPlayer.radius;

    this.root = new THREE.Group();
    this.model = new THREE.Group();
    this.root.add(this.model);
    this.scene.add(this.root);

    this._buildModel();
    this.model.visible = false;
    this.shadowDisc.visible = false;
    this.pixelSprite = makeBillboard(getKnightPixelTexture("idle", "south", 0), 1.42, 1.78, { renderOrder: 6 });
    this.pixelSprite.position.y = 0.018;
    this.root.add(this.pixelSprite);
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
      new THREE.CircleGeometry(0.56, 18),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false }),
    );
    this.shadowDisc.rotation.x = -Math.PI / 2;
    this.shadowDisc.position.y = 0.02;
    this.root.add(this.shadowDisc);

    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.68, 0.01);
    this.rightLeg.position.set(0.2, 0.68, 0.01);
    this.model.add(this.leftLeg, this.rightLeg);

    this._mesh(new THREE.BoxGeometry(0.22, 0.64, 0.24), this.mat.armorDark, this.leftLeg, [0, -0.31, 0]);
    this._mesh(new THREE.BoxGeometry(0.22, 0.64, 0.24), this.mat.armorDark, this.rightLeg, [0, -0.31, 0]);
    this.leftKnee = this._mesh(new THREE.BoxGeometry(0.18, 0.16, 0.12), this.mat.armor, this.leftLeg, [0, -0.06, 0.11]);
    this.rightKnee = this._mesh(new THREE.BoxGeometry(0.18, 0.16, 0.12), this.mat.armor, this.rightLeg, [0, -0.06, 0.11]);
    this.leftBoot = this._mesh(new THREE.BoxGeometry(0.32, 0.18, 0.5), this.mat.leather, this.leftLeg, [0, -0.63, -0.08]);
    this.rightBoot = this._mesh(new THREE.BoxGeometry(0.32, 0.18, 0.5), this.mat.leather, this.rightLeg, [0, -0.63, -0.08]);

    this.torso = new THREE.Group();
    this.torso.position.y = 0.97;
    this.model.add(this.torso);
    this.chest = this._mesh(new THREE.CylinderGeometry(0.44, 0.36, 0.78, 6), this.mat.armor, this.torso, [0, 0.3, 0]);
    this.backPlate = this._mesh(new THREE.BoxGeometry(0.38, 0.56, 0.18), this.mat.armorDark, this.torso, [0, 0.31, 0.21]);
    this.fauld = this._mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.38, 5), this.mat.heroCloth, this.torso, [0, -0.18, 0], [0, Math.PI / 5, 0]);
    this.belt = this._mesh(new THREE.BoxGeometry(0.82, 0.12, 0.12), this.mat.leather, this.torso, [0, 0.04, 0.3]);
    this.surcoatFront = this._mesh(new THREE.BoxGeometry(0.24, 0.74, 0.05), this.mat.heroCloth, this.torso, [0, 0.03, -0.31]);
    this.surcoatStripe = this._mesh(new THREE.BoxGeometry(0.1, 0.68, 0.04), this.mat.rune, this.torso, [0, 0.06, -0.35]);
    this.waistClothLeft = this._mesh(new THREE.BoxGeometry(0.12, 0.46, 0.04), this.mat.heroCloth, this.torso, [-0.14, -0.33, -0.28], [0.12, 0, 0.08]);
    this.waistClothRight = this._mesh(new THREE.BoxGeometry(0.12, 0.46, 0.04), this.mat.heroCloth, this.torso, [0.14, -0.33, -0.28], [0.12, 0, -0.08]);
    this.leftShoulder = this._mesh(new THREE.SphereGeometry(0.28, 7, 5), this.mat.armor, this.torso, [-0.48, 0.54, 0], [0, 0, 0], [1.28, 0.72, 1.1]);
    this.rightShoulder = this._mesh(new THREE.SphereGeometry(0.3, 7, 5), this.mat.armor, this.torso, [0.49, 0.53, 0.01], [0, 0, 0], [1.34, 0.78, 1.12]);
    this._mesh(new THREE.BoxGeometry(0.1, 0.38, 0.08), this.mat.armorDark, this.torso, [0.25, 0.52, -0.17], [0.22, 0, 0.58]);
    this.gorget = this._mesh(new THREE.CylinderGeometry(0.29, 0.36, 0.14, 6), this.mat.heroTrim, this.torso, [0, 0.72, 0], [0, Math.PI / 6, 0]);
    this.breastRidge = this._mesh(new THREE.BoxGeometry(0.11, 0.55, 0.055), this.mat.heroTrim, this.torso, [0, 0.34, -0.405]);
    this._mesh(new THREE.BoxGeometry(0.21, 0.08, 0.06), this.mat.heroTrim, this.torso, [-0.25, 0.58, -0.31], [0, 0, -0.18]);
    this._mesh(new THREE.BoxGeometry(0.21, 0.08, 0.06), this.mat.heroTrim, this.torso, [0.25, 0.58, -0.31], [0, 0, 0.18]);

    this.head = new THREE.Group();
    this.head.position.set(0, 1.81, 0.02);
    this.model.add(this.head);
    this.helmet = this._mesh(new THREE.SphereGeometry(0.3, 7, 5), this.mat.armor, this.head, [0, 0.02, 0]);
    this._mesh(new THREE.BoxGeometry(0.52, 0.14, 0.32), this.mat.armorDark, this.head, [0, 0.0, -0.23]);
    this._mesh(new THREE.BoxGeometry(0.08, 0.48, 0.36), this.mat.armorDark, this.head, [0, 0.09, -0.19]);
    this._mesh(new THREE.BoxGeometry(0.08, 0.24, 0.12), this.mat.armor, this.head, [-0.18, -0.05, -0.18], [0.16, 0, -0.22]);
    this._mesh(new THREE.BoxGeometry(0.08, 0.24, 0.12), this.mat.armor, this.head, [0.18, -0.05, -0.18], [0.16, 0, 0.22]);
    this.crestBase = this._mesh(new THREE.ConeGeometry(0.16, 0.24, 5), this.mat.heroTrim, this.head, [0, 0.34, -0.03], [Math.PI, 0, 0]);
    this.plume = this._mesh(new THREE.BoxGeometry(0.09, 0.58, 0.07), this.mat.heroClothLight, this.head, [0, 0.5, -0.01], [0.28, 0, -0.04]);
    this.visorGlowLeft = this._mesh(new THREE.BoxGeometry(0.09, 0.03, 0.02), this.mat.moonGlass, this.head, [-0.09, 0.02, -0.37]);
    this.visorGlowRight = this._mesh(new THREE.BoxGeometry(0.09, 0.03, 0.02), this.mat.moonGlass, this.head, [0.09, 0.02, -0.37]);
    this._mesh(new THREE.BoxGeometry(0.46, 0.055, 0.04), this.mat.heroTrim, this.head, [0, 0.14, -0.335]);
    this._mesh(new THREE.BoxGeometry(0.05, 0.28, 0.055), this.mat.heroTrim, this.head, [0, -0.01, -0.385]);

    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.5, 1.35, 0);
    this.rightArm.position.set(0.52, 1.35, 0);
    this.model.add(this.leftArm, this.rightArm);
    this._mesh(new THREE.CylinderGeometry(0.115, 0.145, 0.64, 6), this.mat.armorDark, this.leftArm, [0, -0.3, 0]);
    this._mesh(new THREE.CylinderGeometry(0.115, 0.145, 0.64, 6), this.mat.armorDark, this.rightArm, [0, -0.3, 0]);
    this._mesh(new THREE.BoxGeometry(0.16, 0.26, 0.16), this.mat.armor, this.leftArm, [0, -0.51, 0.03]);
    this._mesh(new THREE.BoxGeometry(0.16, 0.26, 0.16), this.mat.armor, this.rightArm, [0, -0.51, 0.03]);

    this.shield = new THREE.Group();
    this.shield.position.set(-0.08, -0.34, 0.04);
    this.leftArm.add(this.shield);
    this._mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.11, 7), this.mat.wood, this.shield, [0, -0.02, -0.02], [Math.PI / 2, 0, 0], [0.92, 1.0, 1.24]);
    this._mesh(new THREE.BoxGeometry(0.07, 0.62, 0.04), this.mat.heroTrim, this.shield, [0, -0.03, -0.08]);
    this._mesh(new THREE.BoxGeometry(0.34, 0.07, 0.04), this.mat.heroTrim, this.shield, [0, -0.02, -0.08]);
    this.shieldBoss = this._mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 8), this.mat.heroTrim, this.shield, [0, -0.03, -0.07], [Math.PI / 2, 0, 0]);

    this.swordPivot = new THREE.Group();
    this.swordPivot.position.set(0, -0.5, 0);
    this.rightArm.add(this.swordPivot);
    this.swordBlade = this._mesh(new THREE.BoxGeometry(0.12, 1.12, 0.065), this.mat.armor, this.swordPivot, [0, -0.53, 0]);
    this.swordFuller = this._mesh(new THREE.BoxGeometry(0.026, 0.92, 0.072), this.mat.heroTrim, this.swordPivot, [0, -0.5, -0.002]);
    this.swordTip = this._mesh(new THREE.ConeGeometry(0.072, 0.19, 4), this.mat.armor, this.swordPivot, [0, -1.17, 0], [Math.PI, Math.PI / 4, 0]);
    this._mesh(new THREE.BoxGeometry(0.62, 0.1, 0.08), this.mat.heroTrim, this.swordPivot, [0, 0.03, 0]);
    this._mesh(new THREE.BoxGeometry(0.12, 0.32, 0.12), this.mat.leather, this.swordPivot, [0, 0.22, 0]);
    this._mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.12, 6), this.mat.heroTrim, this.swordPivot, [0, 0.4, 0]);

    this.attackTrail = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.78, 20, 1, -0.52, 1.28),
      new THREE.MeshBasicMaterial({ color: 0xffe8ad, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
    );
    this.attackTrail.rotation.set(0.22, -Math.PI / 2, 0.2);
    this.attackTrail.position.set(0.15, -0.38, 0.02);
    this.attackTrail.visible = false;
    this.swordPivot.add(this.attackTrail);

    const capeGeo = new THREE.BufferGeometry();
    capeGeo.setAttribute("position", new THREE.Float32BufferAttribute([
      -0.38, 0.42, 0,
       0.38, 0.42, 0,
       0.31, -0.56, 0.1,
      -0.38, 0.42, 0,
       0.31, -0.56, 0.1,
      -0.28, -0.58, -0.03,
    ], 3));
    capeGeo.computeVertexNormals();
    this.cape = new THREE.Mesh(capeGeo, this.mat.heroCloth);
    this.cape.position.set(0, 1.3, 0.27);
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
      new THREE.RingGeometry(0.42, 0.58, 24),
      new THREE.MeshBasicMaterial({ color: 0xf3dc8b, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false }),
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.035;
    this.selectionRing.visible = false;
    this.root.add(this.selectionRing);

    this.pixelSelectionMarker = createKnightGroundMarker("selection", 1.18);
    this.pixelSelectionMarker.renderOrder = isoRenderOrder(0, 0, 0, -14);
    this.root.add(this.pixelSelectionMarker);

    this.destinationRing.visible = false;
    this.pixelDestinationMarker = createKnightGroundMarker("destination", 0.78);
    this.pixelDestinationMarker.visible = false;
    this.scene.add(this.pixelDestinationMarker);

    this.heroLight = new THREE.PointLight(0x8fb7d4, 0, 2.5, 2.2);
    this.heroLight.position.set(0, 1.42, -0.42);
    this.model.add(this.heroLight);

    this.model.scale.setScalar(1.1);
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
      this.deathVisualTime = 0;
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
    const running = planarSpeed > this.walkSpeed + 0.35;

    let spriteState = "idle";
    if (this.dead) spriteState = "death";
    else if (this.hurtTime > 0) spriteState = "hurt";
    else if (this.attackTime > 0) spriteState = "attack";
    else if (this.dashTime > 0) spriteState = "dash";
    else if (planarSpeed > 0.24) spriteState = running ? "run" : "walk";

    if (this.dead) this.deathVisualTime = Math.min(1.0, this.deathVisualTime + dt);

    const attackProgress = this.attackTime > 0
      ? THREE.MathUtils.clamp(1 - this.attackTime / this.attackDuration, 0, 0.999)
      : 0;
    const hurtProgress = this.hurtTime > 0
      ? THREE.MathUtils.clamp(1 - this.hurtTime / 0.24, 0, 0.999)
      : 0;
    const dashProgress = this.dashTime > 0
      ? THREE.MathUtils.clamp(1 - this.dashTime / this.dashDuration, 0, 0.999)
      : 0;
    const deathProgress = THREE.MathUtils.clamp(this.deathVisualTime / 0.82, 0, 0.999);

    const spriteDirection = knightDirectionFromFacing(this.facing);
    const spriteFrame = getKnightAnimationFrame(spriteState, time, {
      attackProgress,
      hurtProgress,
      dashProgress,
      deathProgress,
    });

    if (
      spriteState !== this._pixelState ||
      spriteDirection !== this._pixelDirection ||
      spriteFrame !== this._pixelFrame
    ) {
      this.pixelSprite.material.map = getKnightPixelTexture(spriteState, spriteDirection, spriteFrame);
      this.pixelSprite.material.needsUpdate = true;
      this._pixelState = spriteState;
      this._pixelDirection = spriteDirection;
      this._pixelFrame = spriteFrame;
    }

    // Deliberadamente más pequeño que el sprite anterior: ahora pertenece al
    // tileset en vez de dominarlo como una figura de juguete.
    this.pixelSprite.scale.set(1.42, 1.78, 1);
    this.pixelSprite.material.opacity = this.dead && deathProgress >= 0.96 ? 0.88 : 1.0;

    // Hurt flicker afecta al sprite real, no al viejo modelo 3D oculto.
    const flicker = !this.dead &&
      this.invulnerabilityTime > 0 &&
      this.hurtTime > 0.08 &&
      Math.floor(time * 22) % 2 === 0;
    this.pixelSprite.visible = !flicker;
    this.pixelSprite.renderOrder = isoRenderOrder(
      this.root.position.x,
      this.root.position.z,
      this.root.position.y,
      24,
    );

    // Mantener el modelo legado totalmente fuera del render. Sólo conserva
    // referencias internas para evitar alterar gameplay antiguo.
    this.model.visible = false;
    this.shadowDisc.visible = false;
    this.attackTrail.visible = false;
    this.heroLight.intensity = 0;

    const ringPulse = 1 + Math.sin(time * 3.2) * 0.035;
    this.pixelSelectionMarker.visible = !this.dead;
    this.pixelSelectionMarker.scale.setScalar(ringPulse);
    this.pixelSelectionMarker.material.opacity = this.dashTime > 0 ? 0.94 : 0.72;
    this.pixelSelectionMarker.renderOrder = isoRenderOrder(
      this.root.position.x,
      this.root.position.z,
      this.root.position.y,
      -14,
    );

    const moveTarget = this.input.getMoveTarget();
    if (moveTarget && !this.dead) {
      this.pixelDestinationMarker.visible = true;
      this.pixelDestinationMarker.position.set(moveTarget.x, 0.035, moveTarget.z);
      const pulse = 1 + Math.sin(time * 6.0) * 0.07;
      this.pixelDestinationMarker.scale.setScalar(pulse);
      this.pixelDestinationMarker.material.opacity = 0.62;
      this.pixelDestinationMarker.renderOrder = isoRenderOrder(
        moveTarget.x,
        moveTarget.z,
        0,
        -18,
      );
    } else {
      this.pixelDestinationMarker.visible = false;
    }

    if (planarSpeed > 0.16 && this.grounded && this.dashTime <= 0 && !this.dead) {
      this.stepDistance += planarSpeed * dt;
      const stepLength = running ? 0.68 : 0.84;
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

  faceToward(position) {
    const p = this.body.translation();
    this.facing.set(position.x - p.x, 0, position.z - p.z);
    if (this.facing.lengthSq() > 0.0001) this.facing.normalize();
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
    this.pixelDestinationMarker?.removeFromParent();
    this.pixelDestinationMarker?.geometry?.dispose?.();
    this.pixelDestinationMarker?.material?.dispose?.();
    this.pixelSelectionMarker?.geometry?.dispose?.();
    this.pixelSelectionMarker?.material?.dispose?.();
  }
}
