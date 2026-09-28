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

async function boot() {
  const mount = document.querySelector("#game-shell");
  const loading = document.querySelector("#loading");

  const scene = createGameScene();
  const cameraRig = new CameraRig({ aspect: window.innerWidth / window.innerHeight, viewHeight: 7.0 });
  const physics = new PhysicsWorld();
  await physics.init();

  const { materials } = createMaterialLibrary();
  const input = new InputManager();
  input.bindVirtualControls(document);
  const audio = new ProceduralAudio();
  const hud = new HUD();

  const world = new WorldBuilder(scene, physics, materials);
  world.build();

  const knight = new Knight({
    scene,
    physics,
    input,
    camera: cameraRig.camera,
    materials,
    audio,
  });

  const guardian = new CorruptedGuardian({
    scene,
    physics,
    materials,
    audio,
  });

  const playerPosition = knight.getPosition(new THREE.Vector3());
  cameraRig.snapTo(playerPosition);

  const effects = new EffectSystem(scene, cameraRig);
  const combat = new CombatSystem({ player: knight, enemy: guardian, effects });
  const director = new GameDirector({
    input,
    hud,
    audio,
    world,
    player: knight,
    enemy: guardian,
    combat,
    effects,
  });

  const engine = new Engine({
    scene,
    cameraRig,
    mount,
    internalHeight: 420,
  });

  const artDirection = new ArtDirectionController(scene, { enemy: guardian, world });

  const startGame = async () => {
    if (director.state !== "intro") return;
    await director.start();
  };

  hud.onStart(startGame);
  window.addEventListener("keydown", (event) => {
    if (director.state === "intro" && (event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      startGame();
    }
  }, { passive: false });

  loading?.classList.add("is-hidden");
  setTimeout(() => loading?.remove(), 450);

  engine.start({
    fixedUpdate: (dt) => {
      director.fixedUpdate(dt);
      physics.step();
      knight.syncFromPhysics();
      guardian.syncFromPhysics();
      input.endFixedStep();
    },
    update: (dt, elapsed) => {
      knight.updateVisuals(dt, elapsed);
      guardian.updateVisuals(dt, elapsed);
      cameraRig.update(knight.getPosition(playerPosition), dt);
      artDirection.update(dt, playerPosition);
      effects.update(dt);
      world.update(elapsed, dt);
      director.update(dt, elapsed);
    },
  });
}

boot().catch((error) => {
  console.error("No se pudo iniciar Ruinas del Ocaso:", error);
  const loading = document.querySelector("#loading");
  if (loading) loading.textContent = "ERROR AL INICIAR · REVISA LA CONSOLA";
});
