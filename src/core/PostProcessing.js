import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export class PostProcessing {
  constructor(renderer, scene, camera, width, height) {
    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Con sprites pixel-art reales ya no necesitamos SSAO ni cuantización de
    // imagen. Sólo un bloom muy leve para fuego, runas y partículas.
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.10,
      0.16,
      0.95,
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  resize(width, height) {
    this.composer.setSize(width, height);
  }

  render(dt) {
    this.composer.render(dt);
  }
}
