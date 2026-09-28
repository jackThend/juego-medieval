import * as THREE from "three";
import { createNoiseTexture } from "./ProceduralTextures.js";

export function createMaterialLibrary() {
  const textures = {
    ground: createNoiseTexture({ color: [56, 66, 42], variation: 34, seed: 10, speckles: 0.09, repeat: [10, 10] }),
    path: createNoiseTexture({ color: [77, 72, 60], variation: 32, seed: 22, speckles: 0.08, grid: { step: 8, alpha: 0.22 }, repeat: [7, 7] }),
    stone: createNoiseTexture({ color: [108, 104, 91], variation: 27, seed: 31, speckles: 0.06, repeat: [2, 2] }),
    darkStone: createNoiseTexture({ color: [65, 67, 61], variation: 22, seed: 44, speckles: 0.05, repeat: [2, 2] }),
    wood: createNoiseTexture({ color: [93, 61, 40], variation: 27, seed: 51, speckles: 0.04, repeat: [2, 6] }),
  };

  const materials = {
    ground: new THREE.MeshStandardMaterial({ map: textures.ground, color: 0x748055, roughness: 1.0, metalness: 0 }),
    path: new THREE.MeshStandardMaterial({ map: textures.path, color: 0x827966, roughness: 0.94, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ map: textures.stone, color: 0xb6ad95, roughness: 0.92, metalness: 0.02, flatShading: true }),
    darkStone: new THREE.MeshStandardMaterial({ map: textures.darkStone, color: 0x77766c, roughness: 0.96, metalness: 0.01, flatShading: true }),
    wood: new THREE.MeshStandardMaterial({ map: textures.wood, color: 0x8c6547, roughness: 0.9, metalness: 0, flatShading: true }),
    armor: new THREE.MeshStandardMaterial({ color: 0x9fa8a3, roughness: 0.5, metalness: 0.78, flatShading: true }),
    armorDark: new THREE.MeshStandardMaterial({ color: 0x414844, roughness: 0.56, metalness: 0.74, flatShading: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x773f32, roughness: 0.96, metalness: 0, flatShading: true }),
    leather: new THREE.MeshStandardMaterial({ color: 0x4a3025, roughness: 0.92, metalness: 0, flatShading: true }),
    grass: new THREE.MeshStandardMaterial({ color: 0x6e7848, roughness: 1, metalness: 0, flatShading: true }),
    grassDry: new THREE.MeshStandardMaterial({ color: 0x9a8851, roughness: 1, metalness: 0, flatShading: true }),
    bone: new THREE.MeshStandardMaterial({ color: 0xc8bea3, roughness: 0.82, metalness: 0, flatShading: true }),
    ember: new THREE.MeshStandardMaterial({ color: 0xffb74a, emissive: 0xff7b18, emissiveIntensity: 4.2, roughness: 0.5 }),
    rune: new THREE.MeshStandardMaterial({ color: 0xd9c77d, emissive: 0xc8862e, emissiveIntensity: 2.8, roughness: 0.55, metalness: 0.05 }),
    black: new THREE.MeshStandardMaterial({ color: 0x111310, roughness: 0.9, metalness: 0.1 }),
    enemyArmor: new THREE.MeshStandardMaterial({ color: 0x4a4f4f, roughness: 0.58, metalness: 0.74, flatShading: true }),
    enemyArmorDark: new THREE.MeshStandardMaterial({ color: 0x1e2322, roughness: 0.64, metalness: 0.68, flatShading: true }),
    enemyCloth: new THREE.MeshStandardMaterial({ color: 0x44252b, roughness: 0.98, metalness: 0, flatShading: true }),
    enemyGlow: new THREE.MeshStandardMaterial({ color: 0xff7954, emissive: 0xff321c, emissiveIntensity: 5.0, roughness: 0.38, metalness: 0.12, flatShading: true }),
  };

  return { materials, textures };
}
