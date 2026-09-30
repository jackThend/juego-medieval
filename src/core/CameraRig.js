import * as THREE from "three";

export class CameraRig {
  constructor({aspect=16/9,viewHeight=8.0}={}){
    this.viewHeight=viewHeight;
    this.camera=new THREE.OrthographicCamera();
    this.target=new THREE.Vector3();
    this.smoothedTarget=new THREE.Vector3();
    this.focus=new THREE.Vector3();

    // 45° yaw + 30° elevation => diamond 2:1 exact for square ground tiles.
    this.offset=new THREE.Vector3(7.5,6.124,7.5);
    this.lookHeight=0.64;
    this.damping=9.0;
    this.pixelWorldSize=0;

    // El nivel avanza de sur a norte. Este pequeño lead coloca al caballero
    // bajo el centro y enseña más escenario hacia el objetivo.
    this.compositionLead=new THREE.Vector3(0,0,-0.72);

    const groundForward=new THREE.Vector2(this.offset.x,this.offset.z).normalize();
    this.groundForward=groundForward;
    this.groundRight=new THREE.Vector2(-groundForward.y,groundForward.x);
    this.resize(aspect);
  }

  resize(aspect){
    const halfH=this.viewHeight*0.5;
    const halfW=halfH*aspect;
    this.camera.left=-halfW;
    this.camera.right=halfW;
    this.camera.top=halfH;
    this.camera.bottom=-halfH;
    this.camera.near=0.1;
    this.camera.far=90;
    this.camera.updateProjectionMatrix();
  }

  setPixelResolution(internalHeight){
    this.pixelWorldSize=this.viewHeight/Math.max(1,internalHeight);
  }

  snapTo(position){
    this.smoothedTarget.copy(position).add(this.compositionLead);
    this.target.copy(this.smoothedTarget);
    this._applyTransform();
  }

  update(position,dt){
    this.target.copy(position).add(this.compositionLead);
    const t=1-Math.exp(-this.damping*dt);
    this.smoothedTarget.lerp(this.target,t);
    this._applyTransform();
  }

  _applyTransform(){
    this.focus.copy(this.smoothedTarget);
    this.focus.y+=this.lookHeight;

    if(this.pixelWorldSize>0){
      const x=this.focus.x;
      const z=this.focus.z;
      const u=x*this.groundRight.x+z*this.groundRight.y;
      const v=x*this.groundForward.x+z*this.groundForward.y;
      const step=this.pixelWorldSize;
      const su=Math.round(u/step)*step;
      const sv=Math.round(v/step)*step;
      this.focus.x=su*this.groundRight.x+sv*this.groundForward.x;
      this.focus.z=su*this.groundRight.y+sv*this.groundForward.y;
    }

    this.camera.position.copy(this.focus).add(this.offset);
    this.camera.lookAt(this.focus);
    this.camera.updateMatrixWorld();
  }
}
