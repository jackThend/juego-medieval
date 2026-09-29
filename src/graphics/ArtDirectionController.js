import * as THREE from "three";

const PALETTES = {
  neutral: {
    fog: 0x111a17, key: 0x9fc6ee, fillSky: 0x55738a, fillGround: 0x121812,
    rim: 0x7eaee1, spot: 0xa9d5ff, top: 0x0d1622, horizon: 0x182720, bottom: 0x080d0c,
    fogDensity: 0.027, spotIntensity: 3.5,
  },
  corruption: {
    fog: 0x1c1717, key: 0xb7a6b5, fillSky: 0x68566d, fillGround: 0x1b1113,
    rim: 0xb96c62, spot: 0xb7b9d3, top: 0x161422, horizon: 0x2a1c21, bottom: 0x0c090a,
    fogDensity: 0.03, spotIntensity: 2.9,
  },
  sanctum: {
    fog: 0x121b1c, key: 0xb8cce0, fillSky: 0x5f7b88, fillGround: 0x151a16,
    rim: 0x8ebbdc, spot: 0xb9ddff, top: 0x101b28, horizon: 0x1d2c28, bottom: 0x0a0f0e,
    fogDensity: 0.024, spotIntensity: 3.9,
  },
};

const COLOR_KEYS = ["fog", "key", "fillSky", "fillGround", "rim", "spot", "top", "horizon", "bottom"];

function smoothstep(edge0, edge1, value) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function expLerpFactor(speed, dt) {
  return 1 - Math.exp(-speed * dt);
}

export class ArtDirectionController {
  constructor(scene, { enemy, world } = {}) {
    this.scene = scene;
    this.enemy = enemy;
    this.world = world;
    this.playerPosition = new THREE.Vector3();

    const art = scene.userData.artDirection;
    if (!art) throw new Error("GameScene no expone scene.userData.artDirection");

    this.key = art.key;
    this.fill = art.fill;
    this.rim = art.rim;
    this.ambient = art.ambient;
    this.heroSpot = art.heroSpot;
    this.heroTarget = art.heroTarget;
    this.skyMaterial = art.skyMaterial;

    this.current = {
      fog: scene.fog.color.clone(),
      key: this.key.color.clone(),
      fillSky: this.fill.color.clone(),
      fillGround: this.fill.groundColor.clone(),
      rim: this.rim.color.clone(),
      spot: this.heroSpot.color.clone(),
      top: this.skyMaterial.uniforms.topColor.value.clone(),
      horizon: this.skyMaterial.uniforms.horizonColor.value.clone(),
      bottom: this.skyMaterial.uniforms.bottomColor.value.clone(),
    };

    this.targets = Object.fromEntries(COLOR_KEYS.map((key) => [key, new THREE.Color(PALETTES.neutral[key])]));
    this.mixA = new THREE.Color();
    this.mixB = new THREE.Color();
    this.fogDensity = scene.fog.density;
    this.spotIntensity = this.heroSpot.intensity;
    this.spotOffset = new THREE.Vector3(4.2, 9.2, 4.2);
  }

  update(dt, playerPosition) {
    this.playerPosition.copy(playerPosition);

    const enemyAlive = !this.enemy?.dead;
    const shrineActive = Boolean(this.world?.shrine?.activated);
    const arenaDistance = Math.abs(this.playerPosition.z + 5.6);
    const corruption = enemyAlive ? 1 - smoothstep(2.0, 7.5, arenaDistance) : 0;
    const shrineApproach = !enemyAlive ? smoothstep(-4.5, -9.5, -this.playerPosition.z) : 0;
    const sanctum = Math.max(shrineApproach, shrineActive ? 1 : 0);

    for (const key of COLOR_KEYS) {
      const neutral = new THREE.Color(PALETTES.neutral[key]);
      const corrupt = new THREE.Color(PALETTES.corruption[key]);
      const holy = new THREE.Color(PALETTES.sanctum[key]);
      this.mixA.copy(neutral).lerp(corrupt, corruption * 0.52);
      this.mixB.copy(this.mixA).lerp(holy, sanctum * (shrineActive ? 0.72 : 0.5));
      this.targets[key].copy(this.mixB);
    }

    const fogTarget = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(PALETTES.neutral.fogDensity, PALETTES.corruption.fogDensity, corruption * 0.52),
      PALETTES.sanctum.fogDensity,
      sanctum * (shrineActive ? 0.72 : 0.5),
    );
    const spotTarget = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(PALETTES.neutral.spotIntensity, PALETTES.corruption.spotIntensity, corruption * 0.52),
      PALETTES.sanctum.spotIntensity,
      sanctum * (shrineActive ? 0.72 : 0.5),
    );

    const t = expLerpFactor(2.1, dt);
    for (const key of COLOR_KEYS) this.current[key].lerp(this.targets[key], t);
    this.fogDensity = THREE.MathUtils.lerp(this.fogDensity, fogTarget, t);
    this.spotIntensity = THREE.MathUtils.lerp(this.spotIntensity, spotTarget, t);

    this.scene.fog.color.copy(this.current.fog);
    this.scene.fog.density = this.fogDensity;
    this.key.color.copy(this.current.key);
    this.fill.color.copy(this.current.fillSky);
    this.fill.groundColor.copy(this.current.fillGround);
    this.rim.color.copy(this.current.rim);
    this.heroSpot.color.copy(this.current.spot);
    this.heroSpot.intensity = this.spotIntensity;
    this.skyMaterial.uniforms.topColor.value.copy(this.current.top);
    this.skyMaterial.uniforms.horizonColor.value.copy(this.current.horizon);
    this.skyMaterial.uniforms.bottomColor.value.copy(this.current.bottom);

    this.key.intensity = THREE.MathUtils.lerp(1.5, 1.72, sanctum * 0.4);
    this.rim.intensity = THREE.MathUtils.lerp(1.55, enemyAlive ? 1.82 : 1.7, corruption * 0.45 + sanctum * 0.2);
    this.fill.intensity = THREE.MathUtils.lerp(0.58, 0.68, sanctum * 0.4);
    this.ambient.intensity = THREE.MathUtils.lerp(0.1, 0.14, sanctum * 0.45);

    this.heroTarget.position.copy(this.playerPosition);
    this.heroTarget.position.y += 0.7;
    this.heroSpot.position.copy(this.playerPosition).add(this.spotOffset);
  }
}
