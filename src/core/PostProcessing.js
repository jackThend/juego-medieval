import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { PixelArtPass } from "./PixelArtPass.js";

export class PostProcessing {
  constructor(renderer, scene, camera, width, height) {
    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // AO sólo para peso de contacto. El antiguo radio grande ensuciaba y hundía
    // los medios tonos al mezclarse con sombras reales y cuantización.
    this.ssaoPass = new SSAOPass(scene, camera, width, height);
    this.ssaoPass.kernelRadius = 3;
    this.ssaoPass.minDistance = 0.006;
    this.ssaoPass.maxDistance = 0.065;
    this.composer.addPass(this.ssaoPass);

    // Bloom contenido: conserva antorchas/núcleos sin velar toda la escena.
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.17,
      0.20,
      0.92,
    );
    this.composer.addPass(this.bloomPass);

    // Primero llevamos la imagen HDR/lineal a una imagen display-referred:
    // tone mapping + conversión a sRGB.
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // El pixelado trabaja ahora sobre la imagen final sRGB. Así no destruye
    // información de sombra antes de que el tone mapper pueda comprimirla.
    this.pixelPass = new PixelArtPass(width, height);
    this.composer.addPass(this.pixelPass);
  }

  resize(width, height) {
    this.composer.setSize(width, height);
    this.pixelPass.setSize(width, height);
  }

  render(dt) {
    this.composer.render(dt);
  }
}
