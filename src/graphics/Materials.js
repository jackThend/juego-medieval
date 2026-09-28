import * as THREE from "three";
import { createNoiseTexture } from "./ProceduralTextures.js";

export function createMaterialLibrary() {
  const textures = {
    ground: createNoiseTexture({ color: [72, 83, 54], variation: 28, seed: 10, speckles: 0.06, repeat: [10, 10] }),
    path: createNoiseTexture({ color: [108, 97, 79], variation: 24, seed: 22, speckles: 0.05, grid: { step: 8, alpha: 0.18 }, repeat: [7, 7] }),
    stone: createNoiseTexture({ color: [134, 128, 112], variation: 22, seed: 31, speckles: 0.04, repeat: [2, 2] }),
    darkStone: createNoiseTexture({ color: [85, 87, 78], variation: 18, seed: 44, speckles: 0.04, repeat: [2, 2] }),
    wood: createNoiseTexture({ color: [93, 61, 40], variation: 27, seed: 51, speckles: 0.04, repeat: [2, 6] }),
  };

  const materials = {
    ground: new THREE.MeshStandardMaterial({ map: textures.ground, color: 0x879362, roughness: 1.0, metalness: 0 }),
    path: new THREE.MeshStandardMaterial({ map: textures.path, color: 0xa69477, roughness: 0.94, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ map: textures.stone, color: 0xcec2a4, roughness: 0.9, metalness: 0.02, flatShading: true }),
    darkStone: new THREE.MeshStandardMaterial({ map: textures.darkStone, color: 0x8f8c80, roughness: 0.94, metalness: 0.01, flatShading: true }),
    wood: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0x8c6547, roughness: 0.9, metalness: 0, flatShading: true }),
    armor: new THREE.MeshStandardMaterial({ color: 0xc9d2d8, roughness: 0.45, metalness: 0.8, flatShading: true }),
    armorDark: new THREE.MeshStandardMaterial({ color: 0x5f676b, roughness: 0.56, metalness: 0.74, flatShading: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x2f4d84, roughness: 0.96, metalness: 0, flatShading: true }),
    leather: new THREE.MeshStandardMaterial({ color: 0x70513a, roughness: 0.9, metalness: 0, flatShading: true }),
    grass: new THREE.MeshStandardMaterial({ color: 0x7e8a54, roughness: 1, metalness: 0, flatShading: true }),
    grassDry: new THREE.MeshStandardMaterial({ color: 0xb3985b, roughness: 1, metalness: 0, flatShading: true }),
    bone: new THREE.MeshStandardMaterial({ color: 0xc8bea3, roughness: 0.82, metalness: 0, flatShading: true }),
    ember: new THREE.MeshStandardMaterial({ color: 0xffb74a, emissive: 0xff7b18, emissiveIntensity: 4.2, roughness: 0.5 }),
    rune: new THREE.MeshStandardMaterial({ color: 0xd9c77d, emissive: 0xc8862e, emissiveIntensity: 2.8, roughness: 0.55, metalness: 0.05 }),
    black: new THREE.MeshStandardMaterial({ color: 0x111310, roughness: 0.9, metalness: 0.1 }),
    enemyArmor: new THREE.MeshStandardMaterial({ color: 0x595f62, roughness: 0.58, metalness: 0.74, flatShading: true }),
    enemyArmorDark: new THREE.MeshStandardMaterial({ color: 0x2b3030, roughness: 0.64, metalness: 0.68, flatShading: true }),
    enemyCloth: new THREE.MeshStandardMaterial({ color: 0x6d2a31, roughness: 0.98, metalness: 0, flatShading: true }),
    enemyGlow: new THREE.MeshStandardMaterial({ color: 0xff9a5d, emissive: 0xff4a1f, emissiveIntensity: 5.8, roughness: 0.34, metalness: 0.1, flatShading: true }),
    bannerBlue: new THREE.MeshStandardMaterial({ color: 0x4668a7, roughness: 0.98, metalness: 0, side: THREE.DoubleSide, flatShading: true }),
    bannerRed: new THREE.MeshStandardMaterial({ color: 0x7c3136, roughness: 0.98, metalness: 0, side: THREE.DoubleSide, flatShading: true }),
    wax: new THREE.MeshStandardMaterial({ color: 0xd8c79e, roughness: 0.95, metalness: 0, flatShading: true }),
    moonGlass: new THREE.MeshStandardMaterial({ color: 0x90b7ff, emissive: 0x385b9b, emissiveIntensity: 2.4, roughness: 0.35, metalness: 0.08, flatShading: true }),
  };

  return { materials, textures };
}
