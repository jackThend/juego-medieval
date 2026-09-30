import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { PixelArtPass } from "../graphics/procedural/PixelArtPass.js";

export class PostProcessing {
  constructor(renderer,scene,camera){
    this.composer=new EffectComposer(renderer);
    this.renderPass=new RenderPass(scene,camera);
    this.composer.addPass(this.renderPass);

    this.pixelPass=new PixelArtPass();
    this.composer.addPass(this.pixelPass);

    this.outputPass=new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  resize(width,height){
    this.composer.setSize(width,height);
    this.pixelPass.setResolution(width,height);
  }

  render(dt){
    this.composer.render(dt);
  }
}
