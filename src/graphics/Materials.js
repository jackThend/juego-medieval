import * as THREE from "three";
import { createNoiseTexture } from "./ProceduralTextures.js";

export function createMaterialLibrary() {
  const textures = {
    ground: createNoiseTexture({ color: [78, 78, 56], variation: 22, seed: 10, speckles: 0.045, repeat: [10, 10] }),
    path: createNoiseTexture({ color: [112, 98, 78], variation: 18, seed: 22, speckles: 0.04, grid: { step: 8, alpha: 0.15 }, repeat: [7, 7] }),
    stone: createNoiseTexture({ color: [132, 124, 108], variation: 18, seed: 31, speckles: 0.03, repeat: [2, 2] }),
    darkStone: createNoiseTexture({ color: [82, 80, 72], variation: 15, seed: 44, speckles: 0.03, repeat: [2, 2] }),
    wood: createNoiseTexture({ color: [93, 61, 40], variation: 27, seed: 51, speckles: 0.04, repeat: [2, 6] }),
  };

  const materials = {
    ground: new THREE.MeshStandardMaterial({ map: textures.ground, color: 0x747554, roughness: 1.0, metalness: 0 }),
    path: new THREE.MeshStandardMaterial({ map: textures.path, color: 0x927d62, roughness: 0.94, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ map: textures.stone, color: 0xbcb096, roughness: 0.9, metalness: 0.02, flatShading: true }),
    darkStone: new THREE.MeshStandardMaterial({ map: textures.darkStone, color: 0x737168, roughness: 0.94, metalness: 0.01, flatShading: true }),
    wood: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0x8c6547, roughness: 0.9, metalness: 0, flatShading: true }),
    armor: new THREE.MeshStandardMaterial({ color: 0xc9d2d8, roughness: 0.45, metalness: 0.8, flatShading: true }),
    armorDark: new THREE.MeshStandardMaterial({ color: 0x5f676b, roughness: 0.56, metalness: 0.74, flatShading: true }),
    heroTrim: new THREE.MeshStandardMaterial({ color: 0xb99a58, roughness: 0.5, metalness: 0.58, flatShading: true }),
    heroCloth: new THREE.MeshStandardMaterial({ color: 0x30496b, roughness: 0.97, metalness: 0, flatShading: true }),
    heroClothLight: new THREE.MeshStandardMaterial({ color: 0x566f8d, roughness: 0.94, metalness: 0, flatShading: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x355276, roughness: 0.96, metalness: 0, flatShading: true }),
    leather: new THREE.MeshStandardMaterial({ color: 0x70513a, roughness: 0.9, metalness: 0, flatShading: true }),
    grass: new THREE.MeshStandardMaterial({ color: 0x687249, roughness: 1, metalness: 0, flatShading: true }),
    grassDry: new THREE.MeshStandardMaterial({ color: 0x9a8355, roughness: 1, metalness: 0, flatShading: true }),
    bone: new THREE.MeshStandardMaterial({ color: 0xc8bea3, roughness: 0.82, metalness: 0, flatShading: true }),
    ember: new THREE.MeshStandardMaterial({ color: 0xe9a64f, emissive: 0xd76e21, emissiveIntensity: 2.9, roughness: 0.5 }),
    rune: new THREE.MeshStandardMaterial({ color: 0xd9c77d, emissive: 0xc8862e, emissiveIntensity: 2.8, roughness: 0.55, metalness: 0.05 }),
    black: new THREE.MeshStandardMaterial({ color: 0x111310, roughness: 0.9, metalness: 0.1 }),
    enemyArmor: new THREE.MeshStandardMaterial({ color: 0x595f62, roughness: 0.58, metalness: 0.74, flatShading: true }),
    enemyArmorDark: new THREE.MeshStandardMaterial({ color: 0x2b3030, roughness: 0.64, metalness: 0.68, flatShading: true }),
    enemyStone: new THREE.MeshStandardMaterial({ color: 0x50504b, roughness: 0.9, metalness: 0.08, flatShading: true }),
    enemyBone: new THREE.MeshStandardMaterial({ color: 0xc1af8e, roughness: 0.84, metalness: 0, flatShading: true }),
    enemyCloth: new THREE.MeshStandardMaterial({ color: 0x64272d, roughness: 0.98, metalness: 0, flatShading: true }),
    enemyGlow: new THREE.MeshStandardMaterial({ color: 0xe77e55, emissive: 0xb93b24, emissiveIntensity: 3.8, roughness: 0.34, metalness: 0.1, flatShading: true }),
    enemyGlowHot: new THREE.MeshStandardMaterial({ color: 0xffa064, emissive: 0xd14b2f, emissiveIntensity: 4.8, roughness: 0.26, metalness: 0.08, flatShading: true }),
    bannerBlue: new THREE.MeshStandardMaterial({ color: 0x4668a7, roughness: 0.98, metalness: 0, side: THREE.DoubleSide, flatShading: true }),
    bannerRed: new THREE.MeshStandardMaterial({ color: 0x7c3136, roughness: 0.98, metalness: 0, side: THREE.DoubleSide, flatShading: true }),
    wax: new THREE.MeshStandardMaterial({ color: 0xd8c79e, roughness: 0.95, metalness: 0, flatShading: true }),
    moonGlass: new THREE.MeshStandardMaterial({ color: 0x8fa9b8, emissive: 0x45626f, emissiveIntensity: 1.55, roughness: 0.35, metalness: 0.08, flatShading: true }),
  };

  return { materials, textures };
}
