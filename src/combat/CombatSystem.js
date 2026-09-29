import * as THREE from "three";

export class CombatSystem {
  constructor({ player, enemy, effects, destructibles = [] }) {
    this.player = player;
    this.enemy = enemy;
    this.effects = effects;
    this.destructibles = destructibles;
    this.playerPos = new THREE.Vector3();
    this.enemyPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
    this.dir = new THREE.Vector3();
    this.facing = new THREE.Vector3();
  }

  fixedUpdate() {
    this.player.getPosition(this.playerPos);
    this.enemy.getPosition(this.enemyPos);

    if (this.player.consumeAttackStrike()) {
      this.player.getFacing(this.facing);
      this.effects.slash(this.playerPos, this.facing, false);

      let landed = false;

      if (!this.enemy.dead) {
        this.dir.copy(this.enemyPos).sub(this.playerPos);
        const distance = this.dir.length();
        if (distance > 0.001) this.dir.multiplyScalar(1 / distance);
        const alignment = this.facing.dot(this.dir);

        if (distance <= 1.88 && alignment >= 0.12 && this.enemy.takeDamage(34, this.dir)) {
          landed = true;
          const impact = this.enemyPos.clone().add(new THREE.Vector3(0, 1.1, 0));
          this.effects.burst(impact, this.dir, 13, 5.6);
          this.effects.shake(0.12, 0.09);
        }
      }

      if (!landed) {
        let best = null;
        let bestDistance = Infinity;

        for (const prop of this.destructibles) {
          if (prop.dead) continue;

          prop.getPosition(this.targetPos);
          this.dir.copy(this.targetPos).sub(this.playerPos);
          const distance = Math.hypot(this.dir.x, this.dir.z);
          if (distance <= 0.001 || distance > 1.72) continue;

          this.dir.set(this.dir.x / distance, 0, this.dir.z / distance);
          const alignment = this.facing.dot(this.dir);

          if (alignment >= 0.08 && distance < bestDistance) {
            best = prop;
            bestDistance = distance;
          }
        }

        if (best) {
          best.getPosition(this.targetPos);
          this.dir.copy(this.targetPos).sub(this.playerPos);
          this.dir.y = 0;
          if (this.dir.lengthSq() > 0.001) this.dir.normalize();

          if (best.takeDamage(34, this.dir)) {
            best.getAimPoint(this.targetPos);
            this.effects.burst(this.targetPos, this.dir, 9, 4.6);
            this.effects.shake(best.dead ? 0.13 : 0.07, best.dead ? 0.11 : 0.055);
          }
        }
      }
    }

    if (this.enemy.consumeAttackStrike() && !this.player.dead) {
      this.enemy.getFacing(this.facing);
      this.effects.slash(this.enemyPos, this.facing, true);
      this.dir.copy(this.playerPos).sub(this.enemyPos);
      const distance = this.dir.length();
      if (distance > 0.001) this.dir.multiplyScalar(1 / distance);
      const alignment = this.facing.dot(this.dir);

      if (distance <= 1.75 && alignment >= -0.05) {
        if (this.player.receiveDamage(this.enemy.phaseTwo ? 28 : 23, this.dir)) {
          const impact = this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0));
          this.effects.burst(impact, this.dir, 10, 4.6);
          this.effects.shake(0.16, 0.13);
        }
      }
    }
  }
}
