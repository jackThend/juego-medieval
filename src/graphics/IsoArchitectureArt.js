import * as THREE from "three";
import { ARCH_KIND } from "../world/SanctuaryArchitecture.js";

const cache = new Map();

const P = Object.freeze({
  outline: "#14191d",
  mortar: "#252d30",
  deep: "#303a3c",
  shadow: "#435052",
  stone: "#66736f",
  light: "#89958d",
  highlight: "#adb5aa",
  mossDark: "#31483a",
  moss: "#4e684a",
  mossLight: "#70805a",
  wood: "#554031",
  woodDark: "#352920",
  iron: "#363e43",
  gold: "#a88b4d",
  goldLight: "#d6bd72",
  void: "#0a0d10",
});

function canvasOf(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function r(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pts(ctx, color, list) {
  ctx.fillStyle = color;
  for (const [x, y, w = 1, h = 1] of list) ctx.fillRect(x, y, w, h);
}

function brickFace(ctx, x, y, w, h, variant = 0, darken = false) {
  const base = darken ? P.deep : P.shadow;
  r(ctx, base, x, y, w, h);

  const brickH = 6;
  for (let yy = y + 2, row = 0; yy < y + h - 2; yy += brickH, row += 1) {
    const offset = ((row + variant) & 1) ? 5 : 0;
    r(ctx, P.mortar, x + 1, yy + brickH - 1, w - 2, 1);

    for (let xx = x + 2 - offset; xx < x + w - 2; xx += 10) {
      const seamX = xx + 9;
      if (seamX > x + 1 && seamX < x + w - 1) r(ctx, P.mortar, seamX, yy, 1, brickH - 1);
      const lightX = Math.max(x + 1, xx);
      const lightW = Math.min(6, x + w - 2 - lightX);
      if (lightW > 0) r(ctx, darken ? P.shadow : P.stone, lightX, yy + 1, lightW, 1);
    }
  }
}

function topCap(ctx, flip = false, y = 8, width = 44) {
  const start = Math.floor((64 - width) / 2);
  for (let row = 0; row < 8; row += 1) {
    const inset = flip ? row : 7 - row;
    const x = start + inset;
    const w = width - 7;
    r(ctx, row < 2 ? P.highlight : row < 5 ? P.light : P.stone, x, y + row, w, 1);
  }
  r(ctx, P.outline, start + (flip ? 7 : 0), y + 8, width - 7, 1);
}

function cracks(ctx, variant, ox = 0, oy = 0) {
  const patterns = [
    [[20,31,5,1],[24,32,1,4],[25,35,4,1],[39,45,1,5],[36,49,4,1]],
    [[31,25,1,5],[28,29,4,1],[27,30,1,4],[17,48,6,1],[22,49,1,3]],
    [[43,28,1,5],[40,32,4,1],[39,33,1,3],[25,52,5,1],[24,53,1,3]],
  ];
  pts(ctx, P.mortar, patterns[variant % patterns.length].map(([x,y,w,h])=>[x+ox,y+oy,w,h]));
}

function moss(ctx, variant = 0) {
  const m = variant % 3;
  if (m === 0) pts(ctx, P.mossDark, [[10,43,7,2],[12,45,4,3],[47,28,5,2]]);
  if (m === 1) pts(ctx, P.moss, [[42,47,8,2],[46,45,4,3],[15,22,4,2]]);
  if (m === 2) pts(ctx, P.mossLight, [[18,54,5,1],[20,52,3,3],[48,38,4,2]]);
}

function wall(ctx, { flip = false, variant = 0, broken = false, low = false } = {}) {
  const baseY = low ? 32 : 16;
  const faceH = low ? 28 : 48;

  r(ctx, "rgba(0,0,0,.38)", 8, 61, 48, 4);
  r(ctx, P.outline, 8, baseY - 2, 48, faceH + 4);
  brickFace(ctx, 10, baseY, 44, faceH, variant, flip);

  if (!low) topCap(ctx, flip, 7, 44);
  else {
    for (let row = 0; row < 5; row += 1) {
      const inset = flip ? row : 4 - row;
      r(ctx, row < 2 ? P.light : P.stone, 12 + inset, 27 + row, 36, 1);
    }
  }

  // Pintado direccional: un borde recibe luna, el contrario cae en sombra.
  if (flip) {
    r(ctx, P.deep, 48, baseY + 2, 6, faceH - 4);
    r(ctx, P.highlight, 10, baseY + 1, 2, faceH - 5);
  } else {
    r(ctx, P.highlight, 11, baseY + 1, 2, faceH - 5);
    r(ctx, P.deep, 49, baseY + 2, 5, faceH - 4);
  }

  cracks(ctx, variant);
  moss(ctx, variant);

  if (broken) {
    const side = variant % 2;
    if (side === 0) {
      ctx.clearRect(8, baseY - 4, 12, 18);
      ctx.clearRect(18, baseY - 1, 7, 10);
      pts(ctx, P.outline, [[8,baseY+12,4,2],[12,baseY+9,4,2],[16,baseY+6,4,2]]);
    } else {
      ctx.clearRect(44, baseY - 5, 14, 19);
      ctx.clearRect(39, baseY, 7, 9);
      pts(ctx, P.outline, [[52,baseY+12,4,2],[48,baseY+9,4,2],[44,baseY+6,4,2]]);
    }
  }
}

function corner(ctx, variant = 0) {
  r(ctx, "rgba(0,0,0,.42)", 8, 64, 54, 4);

  // Dos caras con distinto valor. Esto hace que la esquina se lea incluso
  // sin ninguna luz física.
  r(ctx, P.outline, 8, 18, 29, 48);
  brickFace(ctx, 10, 20, 25, 44, variant, false);

  r(ctx, P.outline, 35, 16, 27, 50);
  brickFace(ctx, 37, 18, 23, 46, variant + 1, true);

  for (let row = 0; row < 8; row += 1) {
    r(ctx, row < 2 ? P.highlight : P.light, 10 + row, 10 + row, 27, 1);
    r(ctx, row < 2 ? P.light : P.stone, 37, 17 - row, 17 + row, 1);
  }

  r(ctx, P.deep, 35, 19, 3, 45);
  cracks(ctx, variant, -3, 2);
  moss(ctx, variant);
}

function arch(ctx, variant = 0) {
  r(ctx, "rgba(0,0,0,.42)", 7, 74, 66, 5);

  // Pilares.
  r(ctx, P.outline, 8, 29, 17, 47);
  brickFace(ctx, 10, 31, 13, 43, variant, false);
  r(ctx, P.highlight, 11, 32, 2, 39);

  r(ctx, P.outline, 55, 29, 17, 47);
  brickFace(ctx, 57, 31, 13, 43, variant + 1, true);
  r(ctx, P.deep, 66, 32, 4, 40);

  // Arco escalonado, sin antialias.
  const rows = [
    [20, 15, 40, 5],
    [16, 20, 48, 5],
    [13, 25, 54, 6],
    [11, 31, 58, 5],
  ];
  for (const [x,y,w,h] of rows) {
    r(ctx, P.outline, x, y, w, h);
    r(ctx, P.stone, x + 2, y + 1, w - 4, h - 2);
  }

  // Hueco oscuro.
  r(ctx, P.void, 25, 34, 30, 40);
  r(ctx, "#10161a", 27, 35, 26, 39);

  // Dovelas claras en el lado que recibe luz.
  pts(ctx, P.light, [[18,22,8,3],[26,17,8,3],[35,15,8,3],[44,18,8,3],[53,23,7,3]]);
  cracks(ctx, variant, 4, 8);
  moss(ctx, variant);
}

function pillar(ctx, variant = 0) {
  r(ctx, "rgba(0,0,0,.38)", 6, 60, 30, 4);

  r(ctx, P.outline, 8, 53, 26, 8);
  r(ctx, P.shadow, 10, 54, 22, 5);
  r(ctx, P.light, 11, 54, 8, 2);

  r(ctx, P.outline, 12, 16, 18, 39);
  r(ctx, P.shadow, 14, 18, 14, 35);
  r(ctx, P.stone, 15, 19, 10, 33);
  r(ctx, P.highlight, 16, 20, 3, 29);
  r(ctx, P.deep, 25, 20, 3, 31);

  r(ctx, P.outline, 8, 10, 26, 9);
  r(ctx, P.stone, 10, 12, 22, 5);
  r(ctx, P.light, 11, 12, 9, 2);

  if (variant % 3 === 1) {
    ctx.clearRect(27, 9, 8, 8);
    pts(ctx, P.outline, [[26,16,5,2],[29,14,3,2]]);
  }
  if (variant % 3 === 2) {
    cracks(ctx, variant, -12, 6);
    pts(ctx, P.moss, [[14,44,5,2],[16,46,3,2]]);
  }
}

function stairs(ctx, variant = 0) {
  r(ctx, "rgba(0,0,0,.36)", 7, 47, 58, 4);

  const steps = [
    [10, 36, 54, 9],
    [14, 29, 46, 9],
    [18, 22, 38, 9],
    [22, 15, 30, 9],
  ];
  steps.forEach(([x,y,w,h], index) => {
    r(ctx, P.outline, x - 1, y - 1, w + 2, h + 2);
    r(ctx, index < 2 ? P.shadow : P.stone, x, y, w, h);
    r(ctx, P.light, x + 2, y + 1, w - 4, 2);
    r(ctx, P.deep, x + 1, y + h - 2, w - 2, 2);
  });

  if (variant % 2) pts(ctx, P.moss, [[18,32,5,2],[40,24,4,2],[27,40,6,2]]);
}

function platformEdge(ctx, variant = 0) {
  r(ctx, "rgba(0,0,0,.34)", 6, 35, 53, 4);
  r(ctx, P.outline, 7, 17, 51, 20);
  brickFace(ctx, 9, 19, 47, 16, variant, false);
  for (let row = 0; row < 5; row += 1) {
    r(ctx, row < 2 ? P.light : P.stone, 10 + row, 13 + row, 43 - row, 1);
  }
  r(ctx, P.deep, 49, 20, 7, 14);
  moss(ctx, variant);
}

function door(ctx) {
  r(ctx, "rgba(0,0,0,.42)", 8, 66, 48, 4);
  r(ctx, P.outline, 12, 12, 40, 55);
  brickFace(ctx, 14, 14, 36, 51, 1, true);

  // Marco.
  r(ctx, P.stone, 16, 18, 6, 45);
  r(ctx, P.light, 17, 19, 2, 40);
  r(ctx, P.stone, 44, 18, 6, 45);
  r(ctx, P.deep, 47, 20, 2, 41);
  r(ctx, P.stone, 20, 14, 26, 7);

  // Hoja de madera ennegrecida.
  r(ctx, P.void, 22, 24, 22, 39);
  r(ctx, P.woodDark, 24, 25, 18, 37);
  for (let x = 25; x < 42; x += 5) r(ctx, P.wood, x, 26, 2, 35);
  r(ctx, P.iron, 24, 38, 18, 3);
  r(ctx, P.iron, 31, 25, 3, 37);

  // Símbolo propio del santuario: círculo abierto + línea vertical.
  r(ctx, P.gold, 31, 31, 4, 18);
  r(ctx, P.goldLight, 32, 31, 2, 17);
  pts(ctx, P.gold, [[27,32,4,3],[35,32,4,3],[25,35,3,8],[38,35,3,8],[27,43,4,3],[35,43,4,3]]);
}

function draw(kind, ctx, variant) {
  if (kind === ARCH_KIND.WALL_X) wall(ctx, { flip: false, variant });
  else if (kind === ARCH_KIND.WALL_Z) wall(ctx, { flip: true, variant });
  else if (kind === ARCH_KIND.WALL_BROKEN_X) wall(ctx, { flip: false, variant, broken: true });
  else if (kind === ARCH_KIND.WALL_BROKEN_Z) wall(ctx, { flip: true, variant, broken: true });
  else if (kind === ARCH_KIND.WALL_LOW_X) wall(ctx, { flip: false, variant, low: true });
  else if (kind === ARCH_KIND.WALL_LOW_Z) wall(ctx, { flip: true, variant, low: true });
  else if (kind === ARCH_KIND.CORNER) corner(ctx, variant);
  else if (kind === ARCH_KIND.ARCH_X) arch(ctx, variant);
  else if (kind === ARCH_KIND.PILLAR) pillar(ctx, variant);
  else if (kind === ARCH_KIND.STAIRS) stairs(ctx, variant);
  else if (kind === ARCH_KIND.PLATFORM_EDGE) platformEdge(ctx, variant);
  else if (kind === ARCH_KIND.DOOR) door(ctx);
}

function dimensions(kind) {
  if (kind === ARCH_KIND.ARCH_X) return [80, 80];
  if (kind === ARCH_KIND.STAIRS) return [72, 52];
  if (kind === ARCH_KIND.PLATFORM_EDGE) return [64, 42];
  if (kind === ARCH_KIND.DOOR) return [64, 72];
  if (kind === ARCH_KIND.PILLAR) return [42, 66];
  return [64, 70];
}

export function getArchitectureTexture(kind, variant = 0) {
  const key = kind + ":" + variant;
  if (cache.has(key)) return cache.get(key);

  const [w,h] = dimensions(kind);
  const { canvas, ctx } = canvasOf(w,h);
  draw(kind,ctx,variant);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(key,texture);
  return texture;
}

export function architectureScale(kind) {
  if (kind === ARCH_KIND.ARCH_X) return [3.25, 3.25];
  if (kind === ARCH_KIND.PILLAR) return [0.95, 1.55];
  if (kind === ARCH_KIND.STAIRS) return [2.75, 1.55];
  if (kind === ARCH_KIND.PLATFORM_EDGE) return [1.65, 1.08];
  if (kind === ARCH_KIND.DOOR) return [1.65, 2.35];
  if (kind === ARCH_KIND.WALL_LOW_X || kind === ARCH_KIND.WALL_LOW_Z) return [1.38, 1.20];
  return [1.42, 2.15];
}
