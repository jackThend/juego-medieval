import * as THREE from "three";

export class CombatSystem {
  constructor({ player, enemy, effects }) {
    this.player = player;
    this.enemy = enemy;
    this.effects = effects;
    this.playerPos = new THREE.Vector3();
    this.enemyPos = new THREE.Vector3();
    this.dir = new THREE.Vector3();
    this.facing = new THREE.Vector3();
  }

  fixedUpdate() {
    this.player.getPosition(this.playerPos);
    this.enemy.getPosition(this.enemyPos);

    if (this.player.consumeAttackStrike() && !this.enemy.dead) {
      this.dir.copy(this.enemyPos).sub(this.playerPos);
      const distance = this.dir.length();
      if (distance > 0.001) this.dir.multiplyScalar(1 / distance);
      this.player.getFacing(this.facing);
      const alignment = this.facing.dot(this.dir);
      if (distance <= 1.85 && alignment >= 0.15) {
        if (this.enemy.takeDamage(34, this.dir)) {
          const impact = this.enemyPos.clone().add(new THREE.Vector3(0, 1.1, 0));
          this.effects.burst(impact, this.dir, 13, 5.6);
          this.effects.shake(0.12, 0.09);
        }
      }
    }

    if (this.enemy.consumeAttackStrike() && !this.player.dead) {
      this.dir.copy(this.playerPos).sub(this.enemyPos);
      const distance = this.dir.length();
      if (distance > 0.001) this.dir.multiplyScalar(1 / distance);
      this.enemy.getFacing(this.facing);
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
