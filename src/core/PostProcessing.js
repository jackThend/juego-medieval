import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export class PostProcessing {
  constructor(renderer,scene,camera){
    this.composer=new EffectComposer(renderer);
    this.renderPass=new RenderPass(scene,camera);
    this.composer.addPass(this.renderPass);

    // No bloom ni filtros suaves: la luz y los FX ya vienen dibujados como
    // clusters de píxeles dentro de sprites/overlays.
    this.outputPass=new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  resize(width,height){
    this.composer.setSize(width,height);
  }

  render(dt){
    this.composer.render(dt);
  }
}
