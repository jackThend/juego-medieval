import * as THREE from "three";

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp8(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function createNoiseTexture({
  size = 64,
  color = [100, 100, 100],
  variation = 24,
  seed = 1,
  speckles = 0.04,
  grid = null,
  repeat = [4, 4],
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: false });
  const image = ctx.createImageData(size, size);
  const random = mulberry32(seed);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const broad = (random() - 0.5) * variation;
      const dot = random() < speckles ? (random() - 0.5) * variation * 2.8 : 0;
      image.data[i + 0] = clamp8(color[0] + broad + dot);
      image.data[i + 1] = clamp8(color[1] + broad + dot);
      image.data[i + 2] = clamp8(color[2] + broad + dot);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  if (grid) {
    ctx.globalAlpha = grid.alpha ?? 0.25;
    ctx.strokeStyle = grid.color ?? "#171915";
    ctx.lineWidth = grid.width ?? 1;
    const step = grid.step ?? 8;
    for (let y = 0; y < size; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + ((y / step) % 2) * 2);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    for (let x = 0; x < size; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 2, size);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function createRuneTexture(size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);

  // Glifo abstracto construido con segmentos; no depende de una imagen ni de una fuente.
  ctx.strokeStyle = "#fff1b0";
  ctx.lineWidth = Math.max(2, size / 18);
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(-18, 18);
  ctx.lineTo(0, -20);
  ctx.lineTo(18, 18);
  ctx.moveTo(-12, 4);
  ctx.lineTo(12, 4);
  ctx.moveTo(0, -20);
  ctx.lineTo(0, 22);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}
