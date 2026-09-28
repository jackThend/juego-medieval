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
    this.pointer = {
      active: false,
      down: false,
      follow: false,
      movedWhileDown: false,
      target: { x: 0, y: 0, z: 0, stopRadius: 0.34 },
      hoverActive: false,
      hover: { x: 0, y: 0, z: 0 },
      screen: { x: 0, y: 0 },
    };
    this.raycaster = null;
    this.pointerPlane = null;
    this.pointerElement = null;
    this.pointerCamera = null;
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

  bindPointerMovement(element, camera, THREERef) {
    this.pointerElement = element;
    this.pointerCamera = camera;
    this.raycaster = new THREERef.Raycaster();
    this.pointerPlane = new THREERef.Plane(new THREERef.Vector3(0, 1, 0), 0);
    this.pointerHit = new THREERef.Vector3();

    const updatePointerFromEvent = (event, setCommand = false) => {
      if (!this.pointerElement || !this.pointerCamera) return false;
      const rect = this.pointerElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointer.screen.x = x;
      this.pointer.screen.y = y;
      this.raycaster.setFromCamera({ x, y }, this.pointerCamera);
      if (!this.raycaster.ray.intersectPlane(this.pointerPlane, this.pointerHit)) return false;
      this.pointer.hover.x = this.pointerHit.x;
      this.pointer.hover.y = 0;
      this.pointer.hover.z = this.pointerHit.z;
      this.pointer.hoverActive = true;
      if (setCommand) this.setMoveTarget(this.pointerHit, 0.34);
      return true;
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      if (!this.enabled) return;
      event.preventDefault();
      this.pointer.down = true;
      this.pointer.follow = true;
      this.pointer.movedWhileDown = false;
      updatePointerFromEvent(event, true);
      this.justPressed.add("PointerPrimary");
      element.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!this.enabled) return;
      updatePointerFromEvent(event, this.pointer.down && this.pointer.follow);
      if (this.pointer.down) this.pointer.movedWhileDown = true;
    };

    const onPointerUp = (event) => {
      if (event.button !== 0) return;
      if (!this.enabled) return;
      event.preventDefault();
      if (!this.pointer.movedWhileDown) updatePointerFromEvent(event, true);
      this.pointer.down = false;
      this.pointer.follow = false;
    };

    const onPointerCancel = () => {
      this.pointer.down = false;
      this.pointer.follow = false;
    };

    const onPointerLeave = () => {
      this.pointer.hoverActive = false;
    };

    const onContextMenu = (event) => event.preventDefault();

    element.addEventListener("pointerdown", onPointerDown, { passive: false });
    element.addEventListener("pointermove", onPointerMove, { passive: false });
    element.addEventListener("pointerup", onPointerUp, { passive: false });
    element.addEventListener("pointercancel", onPointerCancel, { passive: false });
    element.addEventListener("pointerleave", onPointerLeave);
    element.addEventListener("contextmenu", onContextMenu);

    this._virtualCleanup.push(() => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("pointerleave", onPointerLeave);
      element.removeEventListener("contextmenu", onContextMenu);
    });
  }

  hasMovementInput() {
    const axes = this.getMovementAxes();
    return Math.abs(axes.x) > 0.001 || Math.abs(axes.y) > 0.001;
  }

  getMoveTarget() {
    return this.pointer.active ? this.pointer.target : null;
  }

  getPointerWorld() {
    return this.pointer.hoverActive ? this.pointer.hover : null;
  }

  setMoveTarget(position, stopRadius = 0.34) {
    this.pointer.target.x = position.x;
    this.pointer.target.y = position.y ?? 0;
    this.pointer.target.z = position.z;
    this.pointer.target.stopRadius = stopRadius;
    this.pointer.active = true;
  }

  clearMoveTarget() {
    this.pointer.active = false;
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
    this.pointer.active = false;
    this.pointer.down = false;
    this.pointer.follow = false;
    this.pointer.hoverActive = false;
    this.gamepadAxes.x = 0;
    this.gamepadAxes.y = 0;
    this.gamepadRun = false;
    this.justPressed.clear();
  }

  endFixedStep() {
    this.justPressed.clear();
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("blur", this._onBlur);
    this._virtualCleanup.forEach((fn) => fn());
  }
}
