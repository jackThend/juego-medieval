import * as THREE from "three";

const PALETTES = {
  neutral: {
    fog: 0x20302b, key: 0xb7d2ea, fillSky: 0x87a6b8, fillGround: 0x3a4d42,
    rim: 0x8bbbe8, spot: 0xc0e1ff, top: 0x162439, horizon: 0x263a33, bottom: 0x0f1815,
    fogDensity: 0.0145, spotIntensity: 1.35,
  },
  corruption: {
    fog: 0x2b2525, key: 0xc4b9c4, fillSky: 0x8f8290, fillGround: 0x493a3b,
    rim: 0xc77b6d, spot: 0xd1c7d6, top: 0x201d2b, horizon: 0x352a2a, bottom: 0x151111,
    fogDensity: 0.016, spotIntensity: 1.18,
  },
  sanctum: {
    fog: 0x1d2f30, key: 0xc8dced, fillSky: 0x91aebb, fillGround: 0x405348,
    rim: 0x9ac8e8, spot: 0xc9e7ff, top: 0x192a3e, horizon: 0x2d443c, bottom: 0x111d19,
    fogDensity: 0.0125, spotIntensity: 1.65,
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
    this.spotOffset = new THREE.Vector3(3.8, 8.5, 3.8);
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
      this.mixA.copy(neutral).lerp(corrupt, corruption * 0.22);
      this.mixB.copy(this.mixA).lerp(holy, sanctum * (shrineActive ? 0.58 : 0.36));
      this.targets[key].copy(this.mixB);
    }

    const fogTarget = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(PALETTES.neutral.fogDensity, PALETTES.corruption.fogDensity, corruption * 0.24),
      PALETTES.sanctum.fogDensity,
      sanctum * (shrineActive ? 0.58 : 0.36),
    );

    const spotTarget = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(PALETTES.neutral.spotIntensity, PALETTES.corruption.spotIntensity, corruption * 0.22),
      PALETTES.sanctum.spotIntensity,
      sanctum * (shrineActive ? 0.58 : 0.36),
    );

    const t = expLerpFactor(2.0, dt);
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

    this.key.intensity = THREE.MathUtils.lerp(2.0, 2.16, sanctum * 0.35);
    this.rim.intensity = THREE.MathUtils.lerp(1.45, enemyAlive ? 1.62 : 1.52, corruption * 0.22 + sanctum * 0.18);
    this.fill.intensity = THREE.MathUtils.lerp(1.55, 1.72, sanctum * 0.35);
    this.ambient.intensity = THREE.MathUtils.lerp(0.42, 0.5, sanctum * 0.4);

    this.heroTarget.position.copy(this.playerPosition);
    this.heroTarget.position.y += 0.8;
    this.heroSpot.position.copy(this.playerPosition).add(this.spotOffset);
  }
}
