export class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    this.enabled = false;
    this.virtualDirections = new Set();
    this.virtualRun = false;
    this.gamepadAxes = { x: 0, y: 0 };
    this.gamepadRun = false;
    this.previousGamepadButtons = new Map();
    this._virtualCleanup = [];

    this._onKeyDown = (event) => {
      if (!this.enabled && !["Enter", "Space"].includes(event.code)) return;
      if (!this.keys.has(event.code)) this.justPressed.add(event.code);
      this.keys.add(event.code);

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    };

    this._onKeyUp = (event) => {
      this.keys.delete(event.code);
    };

    // Evita teclas "pegadas" si el jugador cambia de pestaña mientras mantiene una dirección.
    this._onBlur = () => this.resetHeldInputs();

    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("blur", this._onBlur);
  }

  isDown(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  consumePressed(code) {
    if (!this.justPressed.has(code)) return false;
    this.justPressed.delete(code);
    return true;
  }

  updateGamepad() {
    if (!this.enabled || !navigator.getGamepads) {
      this.gamepadAxes.x = 0;
      this.gamepadAxes.y = 0;
      this.gamepadRun = false;
      return;
    }

    const pad = [...navigator.getGamepads()].find(Boolean);
    if (!pad) {
      this.gamepadAxes.x = 0;
      this.gamepadAxes.y = 0;
      this.gamepadRun = false;
      return;
    }

    const deadzone = (value, threshold = 0.18) => {
      const a = Math.abs(value);
      if (a <= threshold) return 0;
      return Math.sign(value) * ((a - threshold) / (1 - threshold));
    };

    this.gamepadAxes.x = deadzone(pad.axes[0] ?? 0);
    this.gamepadAxes.y = -deadzone(pad.axes[1] ?? 0);
    this.gamepadRun = Boolean(pad.buttons[4]?.pressed) || Math.hypot(this.gamepadAxes.x, this.gamepadAxes.y) > 0.82;

    const mappings = [
      [0, "KeyJ"],
      [1, "Space"],
      [2, "KeyE"],
      [3, "KeyR"],
    ];

    mappings.forEach(([index, code]) => {
      const down = Boolean(pad.buttons[index]?.pressed);
      const before = this.previousGamepadButtons.get(index) ?? false;
      if (down && !before) this.justPressed.add(code);
      this.previousGamepadButtons.set(index, down);
    });
  }

  bindVirtualControls(root = document) {
    root.querySelectorAll("[data-control]").forEach((element) => {
      const control = element.dataset.control;
      const press = (event) => {
        event.preventDefault();
        if (!this.enabled) return;
        element.setPointerCapture?.(event.pointerId);

        if (["up", "down", "left", "right"].includes(control)) {
          this.virtualDirections.add(control);
        } else if (control === "run") {
          this.virtualRun = true;
        } else {
          const code = { attack: "KeyJ", dash: "Space", interact: "KeyE" }[control];
          if (code) this.justPressed.add(code);
        }
      };
      const release = (event) => {
        event.preventDefault();
        this.virtualDirections.delete(control);
        if (control === "run") this.virtualRun = false;
      };

      element.addEventListener("pointerdown", press, { passive: false });
      element.addEventListener("pointerup", release, { passive: false });
      element.addEventListener("pointercancel", release, { passive: false });
      this._virtualCleanup.push(() => {
        element.removeEventListener("pointerdown", press);
        element.removeEventListener("pointerup", release);
        element.removeEventListener("pointercancel", release);
      });
    });
  }

  getMovementAxes() {
    const keyboardX = (this.isDown("KeyD", "ArrowRight") ? 1 : 0) - (this.isDown("KeyA", "ArrowLeft") ? 1 : 0);
    const keyboardY = (this.isDown("KeyW", "ArrowUp") ? 1 : 0) - (this.isDown("KeyS", "ArrowDown") ? 1 : 0);
    const virtualX = (this.virtualDirections.has("right") ? 1 : 0) - (this.virtualDirections.has("left") ? 1 : 0);
    const virtualY = (this.virtualDirections.has("up") ? 1 : 0) - (this.virtualDirections.has("down") ? 1 : 0);

    const x = Math.max(-1, Math.min(1, keyboardX + virtualX + this.gamepadAxes.x));
    const y = Math.max(-1, Math.min(1, keyboardY + virtualY + this.gamepadAxes.y));
    return { x, y };
  }

  isRunning() {
    return this.isDown("ShiftLeft", "ShiftRight") || this.virtualRun || this.gamepadRun;
  }

  clearPressed() {
    this.justPressed.clear();
  }

  resetHeldInputs() {
    this.keys.clear();
    this.virtualDirections.clear();
    this.virtualRun = false;
    this.gamepadAxes.x = 0;
    this.gamepadAxes.y = 0;
    this.gamepadRun = false;
    this.justPressed.clear();
  }

  endFixedStep() {
    // Las pulsaciones discretas viven hasta el siguiente paso de simulación.
    // Así no se pierden si ocurren entre dos requestAnimationFrame.
    this.justPressed.clear();
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("blur", this._onBlur);
    this._virtualCleanup.forEach((fn) => fn());
  }
}
