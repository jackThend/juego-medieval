import "./style.css";
import * as THREE from "three";
import { createGameScene } from "./core/GameScene.js";
import { CameraRig } from "./core/CameraRig.js";
import { Engine } from "./core/Engine.js";
import { PhysicsWorld } from "./physics/PhysicsWorld.js";
import { createMaterialLibrary } from "./graphics/Materials.js";
import { WorldBuilder } from "./graphics/WorldBuilder.js";
import { Knight } from "./entities/Knight.js";
import { CorruptedGuardian } from "./entities/CorruptedGuardian.js";
import { InputManager } from "./input/InputManager.js";
import { ProceduralAudio } from "./audio/ProceduralAudio.js";
import { CombatSystem } from "./combat/CombatSystem.js";
import { EffectSystem } from "./effects/EffectSystem.js";
import { HUD } from "./ui/HUD.js";
import { GameDirector } from "./game/GameDirector.js";
import { ArtDirectionController } from "./graphics/ArtDirectionController.js";
import { ProceduralKnightBaker } from "./graphics/procedural/ProceduralKnightBaker.js";
import { BakedKnightVisual } from "./graphics/procedural/BakedKnightVisual.js";
import { ProceduralArchitectureBaker } from "./graphics/procedural/ProceduralArchitectureBaker.js";
import { BakedArchitectureLayer } from "./graphics/procedural/BakedArchitectureLayer.js";
import { ProceduralSetDressingBaker } from "./graphics/procedural/ProceduralSetDressingBaker.js";
import { BakedSetDressingLayer } from "./graphics/procedural/BakedSetDressingLayer.js";

const PROCEDURAL_PROOF=true;

async function boot(){
  const mount=document.querySelector("#game-shell");
  const loading=document.querySelector("#loading");

  const scene=createGameScene();
  const cameraRig=new CameraRig({
    aspect:window.innerWidth/window.innerHeight,
    viewHeight:7.4,
  });

  const physics=new PhysicsWorld();
  await physics.init();

  const {materials}=createMaterialLibrary();
  const input=new InputManager();
  input.bindVirtualControls(document);
  const audio=new ProceduralAudio();
  const hud=new HUD();

  const world=new WorldBuilder(scene,physics,materials);
  world.build();

  const knight=new Knight({
    scene,
    physics,
    input,
    camera:cameraRig.camera,
    materials,
    audio,
  });

  const guardian=new CorruptedGuardian({
    scene,
    physics,
    materials,
    audio,
  });

  if(PROCEDURAL_PROOF){
    guardian.root.visible=false;
    guardian.aggroRange=0;
    guardian.attackRange=0;
    guardian.body.setTranslation({x:100,y:0.74,z:100},true);
    guardian.syncFromPhysics();
  }

  const playerPosition=knight.getPosition(new THREE.Vector3());
  cameraRig.snapTo(playerPosition);

  const effects=new EffectSystem(scene,cameraRig);
  const combat=new CombatSystem({
    player:knight,
    enemy:guardian,
    effects,
    destructibles:world.getDestructibles(),
  });

  const director=new GameDirector({
    input,
    hud,
    audio,
    world,
    player:knight,
    enemy:guardian,
    combat,
    effects,
  });

  const engine=new Engine({
    scene,
    cameraRig,
    mount,
    internalHeight:270,
  });

  loading && (loading.textContent="HORNEANDO CABALLERO · 96×128 · 8 DIRECCIONES");
  const liveKnight=knight.proceduralVisual;
  knight.root.remove(liveKnight.group);
  liveKnight.dispose();

  const bakedKnight=new ProceduralKnightBaker(engine.renderer,{width:96,height:128}).bake();
  knight.proceduralVisual=new BakedKnightVisual(bakedKnight);
  knight.root.add(knight.proceduralVisual.group);

  loading && (loading.textContent="HORNEANDO ARQUITECTURA · DETALLE ALTO");
  const bakedArchitecture=new ProceduralArchitectureBaker(engine.renderer).bakeLibrary();
  world.proceduralProof.setArchitectureVisible(false);
  const bakedArchitectureLayer=new BakedArchitectureLayer(scene,bakedArchitecture);
  scene.userData.bakedArchitectureLayer=bakedArchitectureLayer;

  loading && (loading.textContent="HORNEANDO VEGETACIÓN Y ALTAR · PALETA 9F");
  const bakedSetDressing=new ProceduralSetDressingBaker(engine.renderer).bakeLibrary();
  world.proceduralProof.setSetDressingVisible(false);
  const bakedSetDressingLayer=new BakedSetDressingLayer(scene,bakedSetDressing);
  scene.userData.bakedSetDressingLayer=bakedSetDressingLayer;

  const artDirection=new ArtDirectionController(scene,{enemy:PROCEDURAL_PROOF?null:guardian,world});
  input.bindPointerMovement(engine.renderer.domElement,cameraRig.camera,THREE);

  const startGame=async()=>{
    if(director.state!=="intro")return;
    await director.start();
    if(PROCEDURAL_PROOF){
      hud.setObjective("Prueba 9F · Más detalle, piedra neutral y luz ámbar");
      hud.setEnemyHealth(1,false,false);
    }
  };

  hud.onStart(startGame);
  window.addEventListener("keydown",(event)=>{
    if(director.state==="intro"&&(event.code==="Enter"||event.code==="Space")){
      event.preventDefault();
      startGame();
    }
  },{passive:false});

  loading?.classList.add("is-hidden");
  setTimeout(()=>loading?.remove(),450);

  engine.start({
    fixedUpdate:(dt)=>{
      director.fixedUpdate(dt);
      physics.step();
      knight.syncFromPhysics();
      if(!PROCEDURAL_PROOF)guardian.syncFromPhysics();
      input.endFixedStep();
    },
    update:(dt,elapsed)=>{
      knight.updateVisuals(dt,elapsed);
      if(!PROCEDURAL_PROOF)guardian.updateVisuals(dt,elapsed);
      cameraRig.update(knight.getPosition(playerPosition),dt);
      artDirection.update(dt,playerPosition);
      effects.update(dt);
      world.update(elapsed,dt);
      bakedSetDressingLayer.update(elapsed);
      director.update(dt,elapsed);
      if(PROCEDURAL_PROOF)hud.setEnemyHealth(1,false,false);
    },
  });
}

boot().catch((error)=>{
  console.error("No se pudo iniciar Ruinas del Ocaso:",error);
  const loading=document.querySelector("#loading");
  if(loading)loading.textContent="ERROR AL INICIAR · REVISA LA CONSOLA";
});
