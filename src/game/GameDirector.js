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
    this.destructibles = world.getDestructibles?.() ?? [];
    this.state = "intro";
    this.playerPos = new THREE.Vector3();
    this.enemyPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
    this.aimPoint = new THREE.Vector3();
    this.shrinePos = world.getShrinePosition(new THREE.Vector3());
    this.enemyWasAlive = true;
    this.mouseCommand = null;
    this.enemyClickRadius = 1.08;
    this.shrineClickRadius = 1.45;
  }

  async start() {
    if (this.state !== "intro") return;
    this.state = "starting";
    try { await this.audio.unlock(); } catch (error) { console.warn("Audio procedural no disponible:", error); }
    this.input.clearPressed();
    this.state = "playing";
    this.input.enabled = true;
    this.hud.hideStart();
    this.hud.setObjective("Clic para moverte o atacar · Destruye objetos · Vence al Guardián");
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

  _isPointerOverEnemy() {
    if (this.enemy.dead) return false;
    this.enemy.getPosition(this.enemyPos);
    this.aimPoint.copy(this.enemyPos);
    this.aimPoint.y += 1.15;
    return this.input.isPointerOverSphere(this.aimPoint, this.enemyClickRadius);
  }

  _findPointerDestructible() {
    let best = null;
    let bestDistance = Infinity;

    for (const prop of this.destructibles) {
      if (prop.dead) continue;
      prop.getAimPoint(this.aimPoint);
      const rayDistance = this.input.getPointerRayDistanceTo(this.aimPoint);
      if (rayDistance <= prop.getClickRadius() && rayDistance < bestDistance) {
        best = prop;
        bestDistance = rayDistance;
      }
    }

    return best;
  }

  _handlePointerPrimary() {
    const hover = this.input.getPointerWorld();
    if (!hover) return;

    if (this._isPointerOverEnemy()) {
      this.mouseCommand = { type: "attack", target: this.enemy, stopRadius: 1.28, range: 1.78 };
      this.enemy.getPosition(this.targetPos);
      this.input.setMoveTarget(this.targetPos, 1.28);
      return;
    }

    const destructible = this._findPointerDestructible();
    if (destructible) {
      this.mouseCommand = { type: "attack", target: destructible, stopRadius: 0.92, range: 1.62 };
      destructible.getPosition(this.targetPos);
      this.input.setMoveTarget(this.targetPos, 0.92);
      return;
    }

    const shrineHover = this.enemy.dead && this.shrinePos.distanceTo(hover) <= this.shrineClickRadius;
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
      const target = this.mouseCommand.target;
      if (!target || target.dead) {
        this.mouseCommand = null;
        this.input.clearMoveTarget();
        return;
      }

      target.getPosition(this.targetPos);
      this.input.setMoveTarget(this.targetPos, this.mouseCommand.stopRadius);

      const distance = Math.hypot(
        this.targetPos.x - this.playerPos.x,
        this.targetPos.z - this.playerPos.z,
      );

      if (distance <= this.mouseCommand.range) {
        this.input.clearMoveTarget();
        this.player.faceToward(this.targetPos);
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

    const enemyHover = this._isPointerOverEnemy();
    this.enemy.setHovered?.(enemyHover);

    const propHover = enemyHover ? null : this._findPointerDestructible();
    for (const prop of this.destructibles) prop.setHovered(prop === propHover);

    if (enemyHover) prompt = "CLIC · ATACAR";
    else if (propHover) prompt = "CLIC · DESTRUIR";

    if (!prompt && this.enemy.dead) {
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
    this.effects.burst(
      this.shrinePos.clone().add(new THREE.Vector3(0, 1.8, 0)),
      new THREE.Vector3(0, 1, 0),
      28,
      3.8,
    );
    this.effects.shake(0.7, 0.12);
    this.hud.showMessage("EL OCASO CEDE", "Has despertado el altar · Pulsa R para volver a jugar");
  }
}
