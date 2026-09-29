import * as THREE from "three";

const textureCache = new Map();

export const KNIGHT_ANIMATION = Object.freeze({
  idle: { frames: 4, fps: 2.4 },
  walk: { frames: 6, fps: 9.0 },
  run: { frames: 6, fps: 12.0 },
  attack: { frames: 8, fps: 18.0 },
  hurt: { frames: 3, fps: 13.0 },
  dash: { frames: 6, fps: 20.0 },
  death: { frames: 6, fps: 7.0 },
});

const P = Object.freeze({
  outline: "#0a0f14",
  void: "#070b0f",
  shadow: "#14202b",
  steel0: "#273746",
  steel1: "#4b6375",
  steel2: "#8299a8",
  steel3: "#bdccd3",
  steel4: "#eef2ec",
  blue0: "#142942",
  blue1: "#214568",
  blue2: "#397099",
  blue3: "#5b91b4",
  leather0: "#332820",
  leather1: "#594536",
  leather2: "#856b50",
  gold0: "#5c4b2c",
  gold1: "#a18448",
  gold2: "#dbc170",
  eye: "#9fe4ff",
  eyeHot: "#d7f4ff",
  blood: "#7b2d31",
});

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 80;
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

function linePixels(ctx, color, x0, y0, x1, y1, thickness = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    r(ctx, color, x0 - Math.floor(thickness / 2), y0 - Math.floor(thickness / 2), thickness, thickness);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function mirrorContext(ctx, mirrored) {
  if (!mirrored) return;
  ctx.translate(64, 0);
  ctx.scale(-1, 1);
}

function shadow(ctx, frame, state) {
  const compress = state === "dash" ? 5 : state === "death" ? 2 : 0;
  const x = 19 - compress;
  const w = 27 + compress * 2;
  r(ctx, "rgba(2,5,7,.48)", x, 69, w, 3);
  r(ctx, "rgba(2,5,7,.26)", x + 4, 72, w - 8, 2);
  if (state === "walk" || state === "run") {
    const shift = frame % 2 ? 1 : -1;
    r(ctx, "rgba(2,5,7,.16)", x + 5 + shift, 68, w - 10, 2);
  }
}

function cape(ctx, back, bob, frame, state) {
  const wave = [0, 1, 2, 1, 0, -1][frame % 6] ?? 0;
  const dash = state === "dash" ? 7 : 0;

  if (back) {
    r(ctx, P.outline, 18 - dash, 29 + bob, 28 + dash, 31);
    r(ctx, P.blue0, 20 - dash, 31 + bob, 24 + dash, 27);
    r(ctx, P.blue1, 22 - dash, 32 + bob, 9 + dash, 24);
    r(ctx, P.blue2, 23 - dash, 33 + bob, 4 + dash, 17);
    pts(ctx, P.blue0, [
      [20 - dash, 56 + bob + wave, 7, 5],
      [29, 58 + bob - wave, 7, 4],
      [38, 55 + bob + wave, 6 + dash, 5],
    ]);
  } else {
    r(ctx, P.outline, 18 - dash, 31 + bob, 6 + dash, 25);
    r(ctx, P.blue0, 20 - dash, 33 + bob, 4 + dash, 21);
    r(ctx, P.blue1, 20 - dash, 35 + bob, 2 + dash, 14);
  }
}

function legs(ctx, back, bob, frame, state) {
  const walkCycle = [
    [-2, 2], [-1, 1], [1, -1], [2, -2], [1, -1], [-1, 1],
  ][frame % 6] ?? [0, 0];

  const moving = state === "walk" || state === "run";
  const dash = state === "dash";
  const leftShift = moving ? walkCycle[0] : dash ? -2 : 0;
  const rightShift = moving ? walkCycle[1] : dash ? 2 : 0;

  // rear leg
  r(ctx, P.outline, 25 + rightShift, 51 + bob, 8, 17);
  r(ctx, P.steel0, 27 + rightShift, 52 + bob, 5, 11);
  r(ctx, P.steel1, 27 + rightShift, 53 + bob, 2, 7);
  r(ctx, P.outline, 25 + rightShift, 63 + bob, 9, 6);
  r(ctx, P.leather0, 27 + rightShift, 64 + bob, 7, 4);
  r(ctx, P.leather1, 28 + rightShift, 64 + bob, 4, 2);

  // front leg
  r(ctx, P.outline, 34 + leftShift, 50 + bob, 8, 18);
  r(ctx, P.steel0, 35 + leftShift, 51 + bob, 6, 12);
  r(ctx, P.steel2, 36 + leftShift, 52 + bob, 3, 5);
  r(ctx, P.outline, 34 + leftShift, 63 + bob, 10, 6);
  r(ctx, P.leather0, 35 + leftShift, 64 + bob, 8, 4);
  r(ctx, P.leather2, 36 + leftShift, 64 + bob, 4, 2);

  if (!back) {
    pts(ctx, P.steel3, [[36+leftShift,52+bob,2,2],[27+rightShift,53+bob,1,3]]);
  }
}

function tabard(ctx, back, bob, frame, state) {
  const sway = state === "walk" || state === "run" ? [0,1,1,0,-1,-1][frame%6] : 0;
  r(ctx, P.outline, 21 + sway, 40 + bob, 24, 17);
  r(ctx, P.blue0, 23 + sway, 42 + bob, 20, 13);
  r(ctx, back ? P.blue1 : P.blue2, 31 + sway, 42 + bob, 4, 13);
  r(ctx, P.gold0, 22 + sway, 40 + bob, 22, 3);
  r(ctx, P.gold1, 24 + sway, 40 + bob, 9, 2);
  if (!back) {
    r(ctx, P.gold2, 32 + sway, 43 + bob, 2, 10);
    r(ctx, P.blue3, 24 + sway, 43 + bob, 4, 8);
  }
}

function torso(ctx, back, bob, state) {
  const lean = state === "dash" ? 2 : state === "hurt" ? 1 : 0;
  r(ctx, P.outline, 20 - lean, 27 + bob, 27, 19);
  r(ctx, P.steel0, 22 - lean, 29 + bob, 23, 15);
  r(ctx, P.steel1, 23 - lean, 29 + bob, 19, 13);

  if (back) {
    r(ctx, P.steel2, 24 - lean, 30 + bob, 8, 10);
    r(ctx, P.shadow, 39 - lean, 30 + bob, 4, 12);
    r(ctx, P.gold0, 31 - lean, 29 + bob, 3, 14);
  } else {
    r(ctx, P.steel2, 24 - lean, 30 + bob, 14, 11);
    r(ctx, P.steel3, 25 - lean, 30 + bob, 7, 4);
    r(ctx, P.steel4, 26 - lean, 30 + bob, 3, 2);
    r(ctx, P.gold0, 33 - lean, 29 + bob, 3, 14);
    r(ctx, P.gold2, 34 - lean, 30 + bob, 1, 11);
    pts(ctx, P.shadow, [[23-lean,41+bob,19,3],[42-lean,33+bob,3,9]]);
  }
}

function shoulder(ctx, x, y, bright = false) {
  r(ctx, P.outline, x - 2, y, 11, 9);
  r(ctx, P.steel0, x, y + 1, 8, 7);
  r(ctx, bright ? P.steel3 : P.steel2, x + 1, y + 1, 5, 4);
  if (bright) r(ctx, P.steel4, x + 2, y + 1, 2, 2);
}

function shield(ctx, back, bob, frame, state) {
  const dash = state === "dash" ? -2 : 0;
  const attack = state === "attack" ? Math.min(frame, 4) : 0;
  const x = back ? 14 + dash : 13 + dash - Math.floor(attack * 0.35);
  const y = 36 + bob + (state === "walk" ? (frame & 1) : 0);

  const rows = [
    [x + 5, y, 9],
    [x + 2, y + 2, 15],
    [x, y + 5, 19],
    [x, y + 8, 19],
    [x + 1, y + 11, 17],
    [x + 3, y + 14, 13],
    [x + 6, y + 17, 7],
  ];
  rows.forEach(([rx, ry, rw]) => r(ctx, P.outline, rx, ry, rw, 3));

  const inner = [
    [x + 6, y + 2, 7],
    [x + 3, y + 4, 13],
    [x + 2, y + 7, 15],
    [x + 3, y + 10, 13],
    [x + 5, y + 13, 9],
    [x + 7, y + 16, 5],
  ];
  inner.forEach(([rx, ry, rw], i) => r(ctx, i < 2 ? P.leather2 : P.leather1, rx, ry, rw, 3));
  r(ctx, P.gold0, x + 9, y + 3, 3, 14);
  r(ctx, P.gold1, x + 4, y + 8, 13, 3);
  r(ctx, P.steel3, x + 8, y + 8, 5, 5);
  r(ctx, P.steel4, x + 9, y + 9, 2, 2);
}

function sword(ctx, bob, frame, state) {
  let handX = 45, handY = 39 + bob;
  let tipX = 53, tipY = 61 + bob;

  if (state === "idle" || state === "walk" || state === "run") {
    const sway = state === "idle" ? [0,1,0,-1][frame%4] : [0,1,2,1,0,-1][frame%6];
    handX += sway;
    tipX += sway;
  } else if (state === "dash") {
    handX = 46; handY = 39 + bob;
    tipX = 30; tipY = 51 + bob;
  } else if (state === "hurt") {
    handX = 45; handY = 40 + bob;
    tipX = 54; tipY = 64 + bob;
  } else if (state === "attack") {
    const poses = [
      [45,40,52,62],
      [45,38,52,25],
      [44,36,46,14],
      [46,36,58,20],
      [47,39,62,31],
      [46,42,61,45],
      [45,43,58,56],
      [45,41,54,62],
    ];
    [handX, handY, tipX, tipY] = poses[frame % poses.length];
    handY += bob; tipY += bob;
  }

  // grip + pommel
  linePixels(ctx, P.leather0, handX, handY, handX + 2, handY + 5, 3);
  r(ctx, P.gold1, handX - 3, handY - 1, 8, 3);

  // blade outline then bright core
  linePixels(ctx, P.outline, handX + 1, handY - 1, tipX, tipY, 5);
  linePixels(ctx, P.steel2, handX + 1, handY - 1, tipX, tipY, 3);
  linePixels(ctx, P.steel4, handX + 1, handY - 1, tipX, tipY, 1);

  r(ctx, P.gold2, handX, handY, 2, 2);
}

function arms(ctx, back, bob, frame, state) {
  const attack = state === "attack";
  const dash = state === "dash";

  shoulder(ctx, 17 + (dash ? -2 : 0), 27 + bob, !back);
  shoulder(ctx, 43 + (dash ? -1 : 0), 27 + bob, !back);

  // shield arm
  r(ctx, P.outline, 17 + (dash ? -2 : 0), 33 + bob, 8, 15);
  r(ctx, P.steel0, 19 + (dash ? -2 : 0), 34 + bob, 5, 12);
  r(ctx, P.steel2, 19 + (dash ? -2 : 0), 35 + bob, 2, 5);

  // sword arm, moved during attack
  const armDx = attack ? Math.min(frame, 4) : dash ? 2 : 0;
  const armDy = attack && frame < 4 ? -Math.min(frame, 3) * 2 : 0;
  r(ctx, P.outline, 43 + armDx, 33 + bob + armDy, 8, 15);
  r(ctx, P.steel0, 44 + armDx, 34 + bob + armDy, 6, 12);
  r(ctx, P.steel2, 45 + armDx, 35 + bob + armDy, 3, 5);
}

function helmet(ctx, back, bob, frame, state) {
  const hurtShift = state === "hurt" ? 1 : 0;

  // neck
  r(ctx, P.gold0, 28 - hurtShift, 25 + bob, 11, 4);

  // helmet silhouette
  r(ctx, P.outline, 23 - hurtShift, 10 + bob, 23, 18);
  r(ctx, P.steel0, 25 - hurtShift, 12 + bob, 19, 14);
  r(ctx, P.steel1, 26 - hurtShift, 11 + bob, 16, 12);
  r(ctx, P.steel3, 27 - hurtShift, 12 + bob, 7, 5);
  r(ctx, P.steel4, 28 - hurtShift, 12 + bob, 3, 2);
  r(ctx, P.gold0, 34 - hurtShift, 10 + bob, 3, 16);
  r(ctx, P.gold2, 35 - hurtShift, 11 + bob, 1, 12);

  if (back) {
    r(ctx, P.shadow, 27 - hurtShift, 20 + bob, 15, 5);
    r(ctx, P.steel0, 25 - hurtShift, 22 + bob, 19, 4);
  } else {
    // visor
    r(ctx, P.void, 26 - hurtShift, 19 + bob, 16, 5);
    r(ctx, P.shadow, 27 - hurtShift, 20 + bob, 14, 3);
    r(ctx, P.eye, 28 - hurtShift, 21 + bob, 4, 1);
    r(ctx, P.eye, 36 - hurtShift, 21 + bob, 4, 1);
    if ((frame + (state === "idle" ? 0 : 1)) % 4 === 0) {
      r(ctx, P.eyeHot, 29 - hurtShift, 21 + bob, 2, 1);
      r(ctx, P.eyeHot, 37 - hurtShift, 21 + bob, 2, 1);
    }
  }

  // plume
  const plumeWave = state === "dash" ? -5 : [0,1,2,1,0,-1][frame%6] ?? 0;
  r(ctx, P.outline, 33 - hurtShift, 4 + bob, 5, 8);
  r(ctx, P.blue1, 34 - hurtShift, 3 + bob, 4, 8);
  r(ctx, P.blue2, 36 - hurtShift + plumeWave, 2 + bob, 7, 5);
  r(ctx, P.blue3, 38 - hurtShift + plumeWave, 2 + bob, 4, 2);
}

function attackArc(ctx, frame) {
  if (frame < 2 || frame > 5) return;
  const arcs = {
    2: [[49,17,3,3],[52,20,3,3],[55,23,3,3]],
    3: [[53,19,3,3],[57,22,3,3],[60,26,3,3],[61,30,2,3]],
    4: [[57,25,3,3],[60,29,3,3],[60,34,3,3],[58,39,3,3]],
    5: [[59,34,3,3],[57,39,3,3],[54,43,3,3]],
  };
  pts(ctx, "rgba(255,232,174,.55)", arcs[frame] ?? []);
  pts(ctx, "rgba(188,218,235,.35)", (arcs[frame] ?? []).map(([x,y,w,h])=>[x-2,y+1,2,2]));
}

function deathPose(ctx, direction, frame) {
  const mirrored = direction === "west";
  ctx.save();
  mirrorContext(ctx, mirrored);
  shadow(ctx, frame, "death");

  if (frame <= 1) {
    const bob = frame;
    cape(ctx, direction === "north", bob, frame, "hurt");
    legs(ctx, direction === "north", bob, 0, "hurt");
    tabard(ctx, direction === "north", bob, frame, "hurt");
    torso(ctx, direction === "north", bob, "hurt");
    arms(ctx, direction === "north", bob, frame, "hurt");
    shield(ctx, direction === "north", bob, frame, "hurt");
    sword(ctx, bob, 0, "hurt");
    helmet(ctx, direction === "north", bob, frame, "hurt");
  } else {
    // Collapse designed as discrete pixel poses rather than rotating a finished
    // sprite; this keeps every frame crisp and authored.
    const p = frame - 2;
    const y = 45 + p * 4;
    const x = 10 + p * 3;
    r(ctx, P.outline, x, y, 40, 13);
    r(ctx, P.steel0, x + 3, y + 2, 22, 9);
    r(ctx, P.steel2, x + 4, y + 2, 9, 4);
    r(ctx, P.blue0, x + 18, y + 5, 20, 7);
    r(ctx, P.blue2, x + 20, y + 5, 8, 3);
    r(ctx, P.outline, x + 29, y - 4, 15, 12);
    r(ctx, P.steel1, x + 31, y - 2, 11, 8);
    r(ctx, P.gold0, x + 35, y - 3, 2, 9);
    linePixels(ctx, P.outline, x + 6, y + 3, x - 5, y + 9, 4);
    linePixels(ctx, P.steel3, x + 6, y + 3, x - 5, y + 9, 2);
    if (frame >= 4) {
      r(ctx, P.blood, x + 24, y + 11, 9 + p * 3, 2);
      r(ctx, "#4e2024", x + 27, y + 13, 6 + p * 2, 1);
    }
  }

  ctx.restore();
}

function renderKnight(ctx, state, direction, frame) {
  const mirrored = direction === "west";
  const back = direction === "north";
  const side = direction === "east" || direction === "west";

  if (state === "death") {
    deathPose(ctx, direction, frame);
    return;
  }

  ctx.save();
  mirrorContext(ctx, mirrored);

  const idleBob = [0,0,1,0][frame%4] ?? 0;
  const walkBob = [0,1,0,1,0,1][frame%6] ?? 0;
  const attackBob = [0,0,-1,-1,0,1,0,0][frame%8] ?? 0;
  const dashBob = [1,0,-1,-1,0,1][frame%6] ?? 0;
  const hurtBob = [0,1,0][frame%3] ?? 0;

  let bob = idleBob;
  if (state === "walk" || state === "run") bob = walkBob;
  else if (state === "attack") bob = attackBob;
  else if (state === "dash") bob = dashBob;
  else if (state === "hurt") bob = hurtBob;

  shadow(ctx, frame, state);

  // Cape is placed behind the body on front/side views, and becomes a large
  // readable mass on the back view.
  cape(ctx, back, bob, frame, state);
  legs(ctx, back, bob, frame, state);
  tabard(ctx, back, bob, frame, state);
  torso(ctx, back, bob, state);
  arms(ctx, back, bob, frame, state);
  shield(ctx, back, bob, frame, state);
  sword(ctx, bob, frame, state);
  helmet(ctx, back, bob, frame, state);

  if (side && !back) {
    // Side-facing read: one shoulder/visor edge gets slightly darker so east/
    // west do not look like a front sprite simply mirrored.
    r(ctx, P.shadow, 40, 29 + bob, 4, 12);
    r(ctx, P.steel0, 41, 13 + bob, 3, 10);
  }

  if (state === "attack") attackArc(ctx, frame);

  if (state === "hurt") {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = frame === 1 ? "rgba(255,105,90,.30)" : "rgba(255,105,90,.16)";
    ctx.fillRect(0, 0, 64, 80);
  }

  if (state === "dash") {
    pts(ctx, "rgba(142,194,226,.30)", [
      [8,36,8,2],[4,42,12,2],[10,48,8,2],
      [16,54,6,2],
    ]);
  }

  ctx.restore();
}

export function getKnightPixelTexture(state = "idle", direction = "south", frame = 0) {
  const def = KNIGHT_ANIMATION[state] ?? KNIGHT_ANIMATION.idle;
  const safeFrame = Math.max(0, Math.min(def.frames - 1, frame | 0));
  const key = state + ":" + direction + ":" + safeFrame;
  if (textureCache.has(key)) return textureCache.get(key);

  const { canvas, ctx } = makeCanvas();
  renderKnight(ctx, state, direction, safeFrame);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function knightDirectionFromFacing(facing) {
  if (Math.abs(facing.x) > Math.abs(facing.z)) {
    return facing.x >= 0 ? "east" : "west";
  }
  return facing.z >= 0 ? "south" : "north";
}

export function getKnightAnimationFrame(state, time, {
  attackProgress = 0,
  hurtProgress = 0,
  dashProgress = 0,
  deathProgress = 0,
} = {}) {
  const def = KNIGHT_ANIMATION[state] ?? KNIGHT_ANIMATION.idle;

  if (state === "attack") return Math.min(def.frames - 1, Math.floor(attackProgress * def.frames));
  if (state === "hurt") return Math.min(def.frames - 1, Math.floor(hurtProgress * def.frames));
  if (state === "dash") return Math.min(def.frames - 1, Math.floor(dashProgress * def.frames));
  if (state === "death") return Math.min(def.frames - 1, Math.floor(deathProgress * def.frames));

  return Math.floor(time * def.fps) % def.frames;
}
