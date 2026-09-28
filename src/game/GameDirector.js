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
    this.enemyPos = new THREE.Vector3();
    this.shrinePos = world.getShrinePosition(new THREE.Vector3());
    this.enemyWasAlive = true;
    this.mouseCommand = null;
    this.enemyClickRadius = 1.3;
    this.shrineClickRadius = 1.45;
  }

  async start() {
    if (this.state !== "intro") return;
    this.state = "starting";
    try {
      await this.audio.unlock();
    } catch (error) {
      console.warn("Audio procedural no disponible:", error);
    }
    this.input.clearPressed();
    this.state = "playing";
    this.input.enabled = true;
    this.hud.hideStart();
    this.hud.setObjective("Clic o WASD para moverte · Derrota al Guardián Corrupto");
    this.hud.setEnemyHealth(1, true);
  }

  fixedUpdate(dt) {
    this.input.updateGamepad();

    if ((this.state === "dead" || this.state === "won") && this.input.consumePressed("KeyR")) {
      window.location.reload();
      return;
    }

    if (this.state !== "playing") return;

    if (this.input.consumePressed("PointerPrimary")) this._handlePointerPrimary();
    if (this.input.hasMovementInput()) this.mouseCommand = null;
    this._updateMouseCommand();

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
      this.mouseCommand = null;
      this.hud.setObjective("El sello se ha roto. Clic o E para activar el altar");
      this.hud.setEnemyHealth(0, false);
    }

    if (this.enemy.dead && this.input.consumePressed("KeyE")) {
      const distance = this.playerPos.distanceTo(this.shrinePos);
      if (distance <= 2.8) this._completeShrine();
    }
  }

  update() {
    this.hud.setPlayerHealth(this.player.getHealthRatio());
    if (!this.enemy.dead) {
      const visible = this.state !== "intro" && this.state !== "starting";
      this.hud.setEnemyHealth(this.enemy.getHealthRatio(), visible);
    }
    this._updatePromptAndHover();
  }

  _handlePointerPrimary() {
    const hover = this.input.getPointerWorld();
    if (!hover) return;

    this.enemy.getPosition(this.enemyPos);
    const enemyHover = !this.enemy.dead && this.enemyPos.distanceTo(hover) <= this.enemyClickRadius;
    const shrineHover = this.enemy.dead && this.shrinePos.distanceTo(hover) <= this.shrineClickRadius;

    if (enemyHover) {
      this.mouseCommand = { type: "attack" };
      this.input.setMoveTarget(this.enemyPos, 1.35);
      return;
    }

    if (shrineHover) {
      this.mouseCommand = { type: "shrine" };
      this.input.setMoveTarget(this.shrinePos, 2.4);
      return;
    }

    this.mouseCommand = { type: "move" };
    this.input.setMoveTarget(hover, 0.34);
  }

  _updateMouseCommand() {
    this.player.getPosition(this.playerPos);

    if (!this.mouseCommand) return;

    if (this.mouseCommand.type === "attack") {
      if (this.enemy.dead) {
        this.mouseCommand = null;
        return;
      }
      this.enemy.getPosition(this.enemyPos);
      this.input.setMoveTarget(this.enemyPos, 1.35);
      const distance = this.playerPos.distanceTo(this.enemyPos);
      if (distance <= 1.75) {
        this.input.clearMoveTarget();
        this.player.queueAttack();
      }
      return;
    }

    if (this.mouseCommand.type === "shrine") {
      if (!this.enemy.dead) {
        this.mouseCommand = null;
        return;
      }
      this.input.setMoveTarget(this.shrinePos, 2.4);
      const distance = this.playerPos.distanceTo(this.shrinePos);
      if (distance <= 2.8) {
        this.input.clearMoveTarget();
        this._completeShrine();
      }
    }
  }

  _updatePromptAndHover() {
    if (this.state !== "playing") return;

    const hover = this.input.getPointerWorld();
    let prompt = "";

    this.enemy.getPosition(this.enemyPos);
    const enemyHover = Boolean(hover && !this.enemy.dead && this.enemyPos.distanceTo(hover) <= this.enemyClickRadius);
    this.enemy.setHovered?.(enemyHover);

    if (enemyHover) {
      prompt = "CLIC · ATACAR";
    }

    if (this.enemy.dead) {
      const shrineHover = Boolean(hover && this.shrinePos.distanceTo(hover) <= this.shrineClickRadius);
      const distance = this.playerPos.distanceTo(this.shrinePos);
      if (distance <= 2.8) prompt = "E / CLIC · ACTIVAR EL ALTAR";
      else if (shrineHover) prompt = "CLIC · IR AL ALTAR";
    }

    this.hud.showPrompt(prompt);
  }

  _completeShrine() {
    if (this.state !== "playing") return;
    this.state = "won";
    this.mouseCommand = null;
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
