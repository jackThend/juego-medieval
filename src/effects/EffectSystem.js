import * as THREE from "three";

export class EffectSystem {
  constructor(scene, cameraRig) {
    this.scene = scene;
    this.cameraRig = cameraRig;
    this.maxParticles = 96;
    this.cursor = 0;
    this.shakeTime = 0;
    this.shakePower = 0;
    this.baseOffset = cameraRig.offset.clone();

    this.positions = new Float32Array(this.maxParticles * 3);
    this.particles = Array.from({ length: this.maxParticles }, () => ({
      active: false,
      life: 0,
      maxLife: 1,
      velocity: new THREE.Vector3(),
    }));

    for (let i = 0; i < this.maxParticles; i += 1) {
      this.positions[i * 3 + 1] = -100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffb05a,
      size: 0.11,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);

    this.slashPool = Array.from({ length: 8 }, (_, index) => {
      const slashMaterial = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? 0xffe3a1 : 0xc7d7e6,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const slash = new THREE.Mesh(
        new THREE.RingGeometry(0.58, 1.02, 16, 1, -0.78, 1.56),
        slashMaterial,
      );
      slash.rotation.x = -Math.PI / 2;
      slash.visible = false;
      slash.userData.life = 0;
      slash.userData.maxLife = 0.16;
      slash.userData.enemy = false;
      this.scene.add(slash);
      return slash;
    });
    this.slashCursor = 0;
  }

  burst(position, direction, amount = 10, speed = 5) {
    for (let n = 0; n < amount; n += 1) {
      const index = this.cursor;
      this.cursor = (this.cursor + 1) % this.maxParticles;
      const particle = this.particles[index];
      particle.active = true;
      particle.life = 0.24 + Math.random() * 0.24;
      particle.maxLife = particle.life;

      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        0.35 + Math.random() * 1.4,
        (Math.random() - 0.5) * 1.8,
      );
      particle.velocity.copy(direction).multiplyScalar(speed * (0.35 + Math.random() * 0.4)).add(spread);

      this.positions[index * 3 + 0] = position.x;
      this.positions[index * 3 + 1] = position.y;
      this.positions[index * 3 + 2] = position.z;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  slash(position, direction, enemy = false) {
    const slash = this.slashPool[this.slashCursor];
    this.slashCursor = (this.slashCursor + 1) % this.slashPool.length;
    slash.visible = true;
    slash.userData.life = slash.userData.maxLife;
    slash.userData.enemy = enemy;
    slash.position.set(position.x, position.y + 0.08, position.z);
    slash.rotation.set(-Math.PI / 2, 0, Math.atan2(direction.z, direction.x) + (enemy ? 0.18 : -0.18));
    slash.scale.setScalar(enemy ? 1.24 : 1.0);
    slash.material.color.setHex(enemy ? 0xff7652 : 0xffe7ad);
    slash.material.opacity = 0.78;
  }

  shake(duration = 0.12, power = 0.1) {
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakePower = Math.max(this.shakePower, power);
  }

  update(dt) {
    for (let i = 0; i < this.maxParticles; i += 1) {
      const particle = this.particles[i];
      if (!particle.active) continue;
      particle.life -= dt;
      if (particle.life <= 0) {
        particle.active = false;
        this.positions[i * 3 + 1] = -100;
        continue;
      }

      particle.velocity.y -= 12 * dt;
      this.positions[i * 3 + 0] += particle.velocity.x * dt;
      this.positions[i * 3 + 1] += particle.velocity.y * dt;
      this.positions[i * 3 + 2] += particle.velocity.z * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;

    for (const slash of this.slashPool) {
      if (!slash.visible) continue;
      slash.userData.life -= dt;
      if (slash.userData.life <= 0) {
        slash.visible = false;
        slash.material.opacity = 0;
        continue;
      }
      const t = 1 - slash.userData.life / slash.userData.maxLife;
      slash.material.opacity = (1 - t) * 0.78;
      slash.scale.multiplyScalar(1 + dt * 2.4);
      slash.rotation.z += (slash.userData.enemy ? -1 : 1) * dt * 1.5;
    }

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      const falloff = this.shakeTime > 0 ? this.shakePower : 0;
      this.cameraRig.offset.copy(this.baseOffset).add(new THREE.Vector3(
        (Math.random() - 0.5) * falloff,
        (Math.random() - 0.5) * falloff * 0.65,
        (Math.random() - 0.5) * falloff,
      ));
      this.shakePower *= Math.exp(-8 * dt);
    } else {
      this.cameraRig.offset.lerp(this.baseOffset, 1 - Math.exp(-12 * dt));
    }
  }
}
