import * as THREE from "three";
import { createNoiseTexture } from "./ProceduralTextures.js";

export function createMaterialLibrary() {
  const textures = {
    ground: createNoiseTexture({ color: [42, 52, 38], variation: 18, seed: 10, speckles: 0.055, repeat: [10, 10] }),
    path: createNoiseTexture({ color: [78, 74, 62], variation: 16, seed: 22, speckles: 0.045, grid: { step: 8, alpha: 0.11 }, repeat: [7, 7] }),
    stone: createNoiseTexture({ color: [100, 104, 98], variation: 17, seed: 31, speckles: 0.035, repeat: [2, 2] }),
    darkStone: createNoiseTexture({ color: [55, 62, 57], variation: 14, seed: 44, speckles: 0.035, repeat: [2, 2] }),
    wood: createNoiseTexture({ color: [67, 47, 36], variation: 22, seed: 51, speckles: 0.045, repeat: [2, 6] }),
  };

  const materials = {
    ground: new THREE.MeshStandardMaterial({ map: textures.ground, color: 0x58644d, roughness: 0.98, metalness: 0 }),
    path: new THREE.MeshStandardMaterial({ map: textures.path, color: 0x7e7765, roughness: 0.88, metalness: 0.01 }),
    stone: new THREE.MeshStandardMaterial({ map: textures.stone, color: 0xa0a69f, roughness: 0.78, metalness: 0.03, flatShading: true }),
    darkStone: new THREE.MeshStandardMaterial({ map: textures.darkStone, color: 0x626d66, roughness: 0.88, metalness: 0.02, flatShading: true }),
    wetStone: new THREE.MeshStandardMaterial({ map: textures.darkStone, color: 0x718077, roughness: 0.62, metalness: 0.04, flatShading: true }),
    wood: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0x5d4333, roughness: 0.86, metalness: 0, flatShading: true }),
    barkDark: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0x423a32, roughness: 1, metalness: 0, flatShading: true }),
    destructibleWood: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0x6e4f36, roughness: 0.9, metalness: 0, flatShading: true }),
    destructibleWoodDark: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0x3f3028, roughness: 0.95, metalness: 0, flatShading: true }),
    destructibleStone: new THREE.MeshStandardMaterial({ map: textures.stone, color: 0x6e736d, roughness: 0.8, metalness: 0.02, flatShading: true }),
    ironDark: new THREE.MeshStandardMaterial({ color: 0x343c3f, roughness: 0.54, metalness: 0.72, flatShading: true }),
    moss: new THREE.MeshStandardMaterial({ color: 0x47674b, roughness: 1, metalness: 0, flatShading: true }),
    foliageDark: new THREE.MeshStandardMaterial({ color: 0x21392c, roughness: 1, metalness: 0, flatShading: true }),
    foliageMid: new THREE.MeshStandardMaterial({ color: 0x365d3e, roughness: 1, metalness: 0, flatShading: true }),
    armor: new THREE.MeshStandardMaterial({ color: 0xb9c7d0, roughness: 0.38, metalness: 0.84, flatShading: true }),
    armorDark: new THREE.MeshStandardMaterial({ color: 0x4d5960, roughness: 0.48, metalness: 0.78, flatShading: true }),
    heroTrim: new THREE.MeshStandardMaterial({ color: 0xa98a54, roughness: 0.48, metalness: 0.58, flatShading: true }),
    heroCloth: new THREE.MeshStandardMaterial({ color: 0x243c5d, roughness: 0.97, metalness: 0, flatShading: true }),
    heroClothLight: new THREE.MeshStandardMaterial({ color: 0x456886, roughness: 0.94, metalness: 0, flatShading: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x2b4663, roughness: 0.96, metalness: 0, flatShading: true }),
    leather: new THREE.MeshStandardMaterial({ color: 0x594334, roughness: 0.9, metalness: 0, flatShading: true }),
    grass: new THREE.MeshStandardMaterial({ color: 0x506c52, roughness: 1, metalness: 0, flatShading: true }),
    grassDry: new THREE.MeshStandardMaterial({ color: 0x807954, roughness: 1, metalness: 0, flatShading: true }),
    bone: new THREE.MeshStandardMaterial({ color: 0xaaa58f, roughness: 0.82, metalness: 0, flatShading: true }),
    ember: new THREE.MeshStandardMaterial({ color: 0xe39a45, emissive: 0xc95f1e, emissiveIntensity: 2.7, roughness: 0.46 }),
    rune: new THREE.MeshStandardMaterial({ color: 0xcdbb74, emissive: 0xa96d25, emissiveIntensity: 2.35, roughness: 0.55, metalness: 0.05 }),
    black: new THREE.MeshStandardMaterial({ color: 0x090d0c, roughness: 0.92, metalness: 0.08 }),
    enemyArmor: new THREE.MeshStandardMaterial({ color: 0x596467, roughness: 0.56, metalness: 0.74, flatShading: true }),
    enemyArmorDark: new THREE.MeshStandardMaterial({ color: 0x30393a, roughness: 0.64, metalness: 0.68, flatShading: true }),
    enemyStone: new THREE.MeshStandardMaterial({ color: 0x53605a, roughness: 0.9, metalness: 0.08, flatShading: true }),
    enemyBone: new THREE.MeshStandardMaterial({ color: 0xaaa087, roughness: 0.84, metalness: 0, flatShading: true }),
    enemyCloth: new THREE.MeshStandardMaterial({ color: 0x522228, roughness: 0.98, metalness: 0, flatShading: true }),
    enemyGlow: new THREE.MeshStandardMaterial({ color: 0xd46d4d, emissive: 0x9c2f21, emissiveIntensity: 3.5, roughness: 0.34, metalness: 0.1, flatShading: true }),
    enemyGlowHot: new THREE.MeshStandardMaterial({ color: 0xf18d5c, emissive: 0xb93a28, emissiveIntensity: 4.5, roughness: 0.26, metalness: 0.08, flatShading: true }),
    bannerBlue: new THREE.MeshStandardMaterial({ color: 0x314d79, roughness: 0.98, metalness: 0, side: THREE.DoubleSide, flatShading: true }),
    bannerRed: new THREE.MeshStandardMaterial({ color: 0x662b31, roughness: 0.98, metalness: 0, side: THREE.DoubleSide, flatShading: true }),
    wax: new THREE.MeshStandardMaterial({ color: 0xb9ad8b, roughness: 0.95, metalness: 0, flatShading: true }),
    moonGlass: new THREE.MeshStandardMaterial({ color: 0x8fb4cf, emissive: 0x416d8b, emissiveIntensity: 1.85, roughness: 0.3, metalness: 0.1, flatShading: true }),
  };

  return { materials, textures };
}
