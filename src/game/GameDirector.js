import * as THREE from "three";

export class GameDirector {
  constructor({ input, hud, audio, world, player, enemy, combat, effects }) {
    this.input = input;
    this.hud = hud;
    this.audio = audio;
    this.world = world;
    this.player = player;
    this.enemy = enemy;
    this.combat = combat;
    this.effects = effects;
    this.state = "intro";
    this.playerPos = new THREE.Vector3();
    this.shrinePos = world.getShrinePosition(new THREE.Vector3());
    this.enemyWasAlive = true;
  }

  async start() {
    if (this.state !== "intro") return;
    // El estado cambia antes del await para impedir dos arranques simultáneos por clic + teclado.
    this.state = "starting";
    try {
      await this.audio.unlock();
    } catch (error) {
      // El juego sigue siendo perfectamente jugable si Web Audio no está disponible.
      console.warn("Audio procedural no disponible:", error);
    }
    this.input.clearPressed();
    this.state = "playing";
    this.input.enabled = true;
    this.hud.hideStart();
    this.hud.setObjective("Derrota al Guardián Corrupto");
    this.hud.setEnemyHealth(1, true);
  }

  fixedUpdate(dt) {
    this.input.updateGamepad();

    // Las acciones discretas se consumen siempre en el fixed timestep.
    // Si se hiciera en update(), un substep podría limpiarlas antes de que la UI las leyera.
    if ((this.state === "dead" || this.state === "won") && this.input.consumePressed("KeyR")) {
      window.location.reload();
      return;
    }

    if (this.state !== "playing") return;
    this.player.fixedUpdate(dt);
    this.enemy.fixedUpdate(dt, this.player.getPosition(this.playerPos));
    this.combat.fixedUpdate(dt);

    if (this.player.dead) {
      this.state = "dead";
      this.input.enabled = true;
      this.hud.showPrompt("");
      this.hud.showMessage("HAS CAÍDO", "Pulsa R para regresar a las ruinas");
      return;
    }

    if (this.enemyWasAlive && this.enemy.dead) {
      this.enemyWasAlive = false;
      this.hud.setObjective("El sello se ha roto. Acércate al altar");
      this.hud.setEnemyHealth(0, false);
    }

    if (this.enemy.dead) {
      const distance = this.playerPos.distanceTo(this.shrinePos);
      if (distance <= 2.8) {
        this.hud.showPrompt("E · ACTIVAR EL ALTAR");
        if (this.input.consumePressed("KeyE")) this._completeShrine();
      } else {
        this.hud.showPrompt("");
      }
    }
  }

  update() {
    this.hud.setPlayerHealth(this.player.getHealthRatio());
    if (!this.enemy.dead) {
      const visible = this.state !== "intro" && this.state !== "starting";
      this.hud.setEnemyHealth(this.enemy.getHealthRatio(), visible);
    }
  }

  _completeShrine() {
    if (this.state !== "playing") return;
    this.state = "won";
    this.input.enabled = true;
    this.hud.showPrompt("");
    this.hud.setObjective("El santuario vuelve a respirar");
    this.world.activateShrine();
    this.audio.playShrine();
    this.effects.burst(this.shrinePos.clone().add(new THREE.Vector3(0, 1.8, 0)), new THREE.Vector3(0, 1, 0), 28, 3.8);
    this.effects.shake(0.7, 0.12);
    this.hud.showMessage("EL OCASO CEDE", "Has despertado el altar · Pulsa R para volver a jugar");
  }
}
