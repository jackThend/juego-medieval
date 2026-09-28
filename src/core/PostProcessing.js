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

    // SSAO: da peso a los contactos sin necesidad de hornear mapas externos.
    this.ssaoPass = new SSAOPass(scene, camera, width, height);
    this.ssaoPass.kernelRadius = 5;
    this.ssaoPass.minDistance = 0.004;
    this.ssaoPass.maxDistance = 0.11;
    this.composer.addPass(this.ssaoPass);

    // Bloom discreto: sólo las superficies realmente emisivas deben respirar luz.
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.30,
      0.28,
      0.86,
    );
    this.composer.addPass(this.bloomPass);

    // Convierte la iluminación continua en bandas de color con dithering Bayer.
    // Al operar sobre la imagen completa, cuantiza también sombras, AO y niebla.
    this.pixelPass = new PixelArtPass(width, height);
    this.composer.addPass(this.pixelPass);

    // El OutputPass conserva el tone mapping y la conversión al espacio de salida.
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  resize(width, height) {
    this.composer.setSize(width, height);
    this.pixelPass.setSize(width, height);
  }

  render(dt) {
    this.composer.render(dt);
  }
}
