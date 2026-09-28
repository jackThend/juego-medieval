import * as THREE from "three";

const PALETTES = {
  neutral: {
    fog: 0x41483d,
    key: 0xffddb0,
    fillSky: 0xb6c1d0,
    fillGround: 0x7d6648,
    rim: 0xa8d0ff,
    top: 0x4a5575,
    horizon: 0x8a7458,
    bottom: 0x39382a,
  },
  corruption: {
    fog: 0x46383a,
    key: 0xffc7a0,
    fillSky: 0xb6a8bd,
    fillGround: 0x68484b,
    rim: 0xff7054,
    top: 0x4d435d,
    horizon: 0x87554e,
    bottom: 0x392a2d,
  },
  sanctum: {
    fog: 0x38474c,
    key: 0xffe2ad,
    fillSky: 0xb6d1df,
    fillGround: 0x59685f,
    rim: 0x7fc4ff,
    top: 0x3f5879,
    horizon: 0x8b7b62,
    bottom: 0x2f393b,
  },
};

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
    this.skyMaterial = art.skyMaterial;

    this.current = {
      fog: scene.fog.color.clone(),
      key: this.key.color.clone(),
      fillSky: this.fill.color.clone(),
      fillGround: this.fill.groundColor.clone(),
      rim: this.rim.color.clone(),
      top: this.skyMaterial.uniforms.topColor.value.clone(),
      horizon: this.skyMaterial.uniforms.horizonColor.value.clone(),
      bottom: this.skyMaterial.uniforms.bottomColor.value.clone(),
    };

    this.targets = Object.fromEntries(
      Object.entries(PALETTES.neutral).map(([name, hex]) => [name, new THREE.Color(hex)]),
    );
    this.mixA = new THREE.Color();
    this.mixB = new THREE.Color();
  }

  update(dt, playerPosition) {
    this.playerPosition.copy(playerPosition);

    const enemyAlive = !this.enemy?.dead;
    const shrineActive = Boolean(this.world?.shrine?.activated);

    const arenaDistance = Math.abs(this.playerPosition.z + 5.6);
    const corruption = enemyAlive ? 1 - smoothstep(2.0, 7.5, arenaDistance) : 0;

    const shrineApproach = !enemyAlive
      ? smoothstep(-4.5, -9.5, -this.playerPosition.z)
      : 0;
    const sanctum = Math.max(shrineApproach, shrineActive ? 1 : 0);

    for (const key of Object.keys(this.targets)) {
      const neutral = new THREE.Color(PALETTES.neutral[key]);
      const corrupt = new THREE.Color(PALETTES.corruption[key]);
      const holy = new THREE.Color(PALETTES.sanctum[key]);
      this.mixA.copy(neutral).lerp(corrupt, corruption * 0.82);
      this.mixB.copy(this.mixA).lerp(holy, sanctum * (shrineActive ? 1.0 : 0.78));
      this.targets[key].copy(this.mixB);
    }

    const t = expLerpFactor(2.4, dt);
    for (const key of Object.keys(this.current)) this.current[key].lerp(this.targets[key], t);

    this.scene.fog.color.copy(this.current.fog);
    this.key.color.copy(this.current.key);
    this.fill.color.copy(this.current.fillSky);
    this.fill.groundColor.copy(this.current.fillGround);
    this.rim.color.copy(this.current.rim);
    this.skyMaterial.uniforms.topColor.value.copy(this.current.top);
    this.skyMaterial.uniforms.horizonColor.value.copy(this.current.horizon);
    this.skyMaterial.uniforms.bottomColor.value.copy(this.current.bottom);

    this.rim.intensity = THREE.MathUtils.lerp(2.45, enemyAlive ? 3.0 : 2.75, corruption * 0.65 + sanctum * 0.35);
    this.key.intensity = THREE.MathUtils.lerp(2.9, 3.15, sanctum * 0.65);
  }
}
