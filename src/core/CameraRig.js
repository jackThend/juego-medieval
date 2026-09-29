import * as THREE from "three";

export class CameraRig {
  constructor({ aspect = 16 / 9, viewHeight = 9.4 } = {}) {
    this.viewHeight = viewHeight;
    this.camera = new THREE.OrthographicCamera();
    this.target = new THREE.Vector3();
    this.smoothedTarget = new THREE.Vector3();
    this.focus = new THREE.Vector3();

    // 45° de yaw + 30° de elevación: una celda cuadrada del plano XZ se
    // proyecta como el diamante 2:1 clásico del pixel-art isométrico.
    this.offset = new THREE.Vector3(7.5, 6.124, 7.5);
    this.lookHeight = 0.72;
    this.damping = 9.0;
    this.pixelWorldSize = 0;

    const groundForward = new THREE.Vector2(this.offset.x, this.offset.z).normalize();
    this.groundForward = groundForward;
    this.groundRight = new THREE.Vector2(-groundForward.y, groundForward.x);
    this.resize(aspect);
  }

  resize(aspect) {
    const halfH = this.viewHeight * 0.5;
    const halfW = halfH * aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.near = 0.1;
    this.camera.far = 90;
    this.camera.updateProjectionMatrix();
  }

  setPixelResolution(internalHeight) {
    this.pixelWorldSize = this.viewHeight / Math.max(1, internalHeight);
  }

  snapTo(position) {
    this.smoothedTarget.copy(position);
    this.target.copy(position);
    this._applyTransform();
  }

  update(position, dt) {
    this.target.copy(position);
    const t = 1 - Math.exp(-this.damping * dt);
    this.smoothedTarget.lerp(this.target, t);
    this._applyTransform();
  }

  _applyTransform() {
    this.focus.copy(this.smoothedTarget);
    this.focus.y += this.lookHeight;

    if (this.pixelWorldSize > 0) {
      const x = this.focus.x;
      const z = this.focus.z;
      const u = x * this.groundRight.x + z * this.groundRight.y;
      const v = x * this.groundForward.x + z * this.groundForward.y;

      // Snapping a píxel real del render interno. Evita shimmer al desplazar
      // un tileset con NearestFilter.
      const step = this.pixelWorldSize;
      const su = Math.round(u / step) * step;
      const sv = Math.round(v / step) * step;
      this.focus.x = su * this.groundRight.x + sv * this.groundForward.x;
      this.focus.z = su * this.groundRight.y + sv * this.groundForward.y;
    }

    this.camera.position.copy(this.focus).add(this.offset);
    this.camera.lookAt(this.focus);
    this.camera.updateMatrixWorld();
  }
}
