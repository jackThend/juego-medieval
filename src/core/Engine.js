import * as THREE from "three";
import { PostProcessing } from "./PostProcessing.js";

export class Engine {
  constructor({ scene, cameraRig, mount, internalHeight = 360 }) {
    this.scene = scene;
    this.cameraRig = cameraRig;
    this.mount = mount;
    this.internalHeight = internalHeight;
    this.fixedDt = 1 / 60;
    this.maxSubSteps = 6;
    this.accumulator = 0;
    this.elapsed = 0;
    this.running = false;
    this.lastTime = performance.now();

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(1);
    this.renderer.domElement.setAttribute("aria-label", "Ruinas del Ocaso, juego 3D isométrico pixel art");
    this.mount.prepend(this.renderer.domElement);

    this.post = new PostProcessing(
      this.renderer,
      this.scene,
      this.cameraRig.camera,
      640,
      this.internalHeight,
    );

    this._onResize = () => this.resize();
    this._onVisibilityChange = () => {
      if (!document.hidden) {
        this.lastTime = performance.now();
        this.accumulator = 0;
      }
    };
    window.addEventListener("resize", this._onResize);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    this.resize();
  }

  resize() {
    const displayW = Math.max(1, window.innerWidth);
    const displayH = Math.max(1, window.innerHeight);
    const aspect = displayW / displayH;

    const integerScale = Math.max(2, Math.min(4, Math.floor(displayH / 320)));
    const h = Math.min(this.internalHeight, Math.max(320, Math.floor(displayH / integerScale)));
    const w = Math.max(320, Math.floor(displayW / integerScale));

    this.renderer.setSize(w, h, false);
    this.post.resize(w, h);
    this.cameraRig.resize(aspect);
    this.cameraRig.setPixelResolution(h);
  }

  start({ fixedUpdate, update, afterFrame } = {}) {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();

    const frame = (now) => {
      if (!this.running) return;

      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.accumulator += dt;
      this.elapsed += dt;

      let subSteps = 0;
      while (this.accumulator >= this.fixedDt && subSteps < this.maxSubSteps) {
        fixedUpdate?.(this.fixedDt, this.elapsed);
        this.accumulator -= this.fixedDt;
        subSteps += 1;
      }

      if (subSteps === this.maxSubSteps && this.accumulator >= this.fixedDt) {
        this.accumulator %= this.fixedDt;
      }

      const alpha = this.accumulator / this.fixedDt;
      update?.(dt, this.elapsed, alpha);
      this.post.render(dt);
      afterFrame?.();

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
  }

  dispose() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    this.renderer.dispose();
  }
}
