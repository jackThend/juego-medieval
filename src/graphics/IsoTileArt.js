import * as THREE from "three";
import { TILE } from "../world/SanctuaryGrid.js";

const cache = new Map();

const PALETTES = {
  [TILE.STONE]: {
    base: "#555c58",
    light: "#727a73",
    dark: "#3c4441",
    seam: "#29302f",
    accent: "#667068",
  },
  [TILE.STONE_DARK]: {
    base: "#414b4d",
    light: "#586466",
    dark: "#2d3639",
    seam: "#20272a",
    accent: "#4d5959",
  },
  [TILE.MOSS]: {
    base: "#3f5144",
    light: "#5c6d55",
    dark: "#2b3b32",
    seam: "#24302b",
    accent: "#6d7651",
  },
  [TILE.PATH]: {
    base: "#69675e",
    light: "#878278",
    dark: "#4e4d48",
    seam: "#363733",
    accent: "#77736a",
  },
  [TILE.SANCTUM]: {
    base: "#625f59",
    light: "#918979",
    dark: "#464640",
    seam: "#32332f",
    accent: "#a58f5c",
  },
};

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function hash(col, row, variant) {
  let n = ((col + 37) * 73856093) ^ ((row + 71) * 19349663) ^ ((variant + 11) * 83492791);
  n = (n ^ (n >>> 13)) >>> 0;
  return n;
}

function makeTileTexture(type, variant = 0, active = false) {
  const key = type + ":" + variant + ":" + (active ? 1 : 0);
  if (cache.has(key)) return cache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const p = PALETTES[type] ?? PALETTES[TILE.STONE];
  rect(ctx, p.base, 0, 0, 32, 32);

  // El shading está pintado: luz arriba-izquierda, sombra abajo-derecha.
  rect(ctx, p.light, 1, 1, 30, 2);
  rect(ctx, p.light, 1, 3, 2, 27);
  rect(ctx, p.dark, 2, 29, 29, 2);
  rect(ctx, p.dark, 29, 2, 2, 29);
  rect(ctx, p.seam, 0, 0, 32, 1);
  rect(ctx, p.seam, 0, 0, 1, 32);

  const seed = hash(variant, type.length, active ? 1 : 0);
  const marks = 4 + (seed % 4);
  for (let i = 0; i < marks; i += 1) {
    const x = 4 + ((seed >>> (i * 3)) % 23);
    const y = 5 + ((seed >>> (i * 2 + 1)) % 21);
    const len = 2 + ((seed >>> (i + 5)) % 5);
    rect(ctx, i % 2 ? p.accent : p.dark, x, y, len, 1);
    if (i % 3 === 0) rect(ctx, p.seam, x + len - 1, y + 1, 1, 2);
  }

  if (type === TILE.MOSS) {
    rect(ctx, "#314d35", 3, 4, 7, 2);
    rect(ctx, "#45603d", 5, 6, 5, 2);
    rect(ctx, "#5f714a", 6, 8, 2, 2);
  }

  if (type === TILE.PATH) {
    rect(ctx, p.seam, 15, 2, 1, 27);
    rect(ctx, p.accent, 16, 3, 1, 25);
  }

  if (type === TILE.SANCTUM) {
    const glow = active ? "#f3d998" : "#ad9259";
    rect(ctx, glow, 8, 8, 16, 2);
    rect(ctx, glow, 8, 22, 16, 2);
    rect(ctx, glow, 8, 10, 2, 12);
    rect(ctx, glow, 22, 10, 2, 12);
    rect(ctx, active ? "#fff0ba" : "#7d6e4d", 14, 14, 4, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

export function createIsoTileMaterial(type, variant = 0, { active = false } = {}) {
  return new THREE.MeshBasicMaterial({
    map: makeTileTexture(type, variant, active),
    color: 0xffffff,
    toneMapped: false,
    transparent: false,
    depthWrite: true,
    depthTest: true,
  });
}

export function updateSanctumMaterial(material, variant = 0, active = false) {
  material.map = makeTileTexture(TILE.SANCTUM, variant, active);
  material.needsUpdate = true;
}
