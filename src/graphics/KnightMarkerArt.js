import * as THREE from "three";

const cache = new Map();

function makeTexture(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;

  const put = (c,x,y,w=1,h=1)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};

  if (kind === "selection") {
    const dark = "rgba(106,142,165,.28)";
    const light = "rgba(177,215,235,.72)";
    const hot = "rgba(224,241,246,.9)";
    const ring = [
      [14,3,4,2],[9,5,5,2],[18,5,5,2],[6,8,4,2],[22,8,4,2],
      [4,12,3,5],[25,12,3,5],[6,18,4,2],[22,18,4,2],
      [9,21,5,2],[18,21,5,2],[14,23,4,2],
    ];
    for (const p of ring) put(dark,...p);
    for (const p of [[14,4,4,1],[9,6,4,1],[19,6,4,1],[6,9,3,1],[23,9,3,1],[5,13,1,4],[26,13,1,4],[10,21,3,1],[19,21,3,1],[14,23,4,1]]) put(light,...p);
    put(hot,15,4,2,1); put(hot,5,14,1,2); put(hot,26,14,1,2);
  } else {
    const gold = "rgba(216,196,139,.70)";
    const hot = "rgba(244,226,176,.95)";
    const dark = "rgba(102,87,55,.35)";
    for (const p of [[14,5,4,2],[9,7,5,2],[18,7,5,2],[6,10,4,2],[22,10,4,2],[8,20,5,2],[19,20,5,2],[13,22,6,2]]) put(dark,...p);
    for (const p of [[14,6,4,1],[10,8,4,1],[19,8,4,1],[7,11,3,1],[23,11,3,1],[9,20,4,1],[20,20,4,1],[14,22,4,1]]) put(gold,...p);
    put(hot,15,6,2,1); put(hot,7,11,1,1); put(hot,24,11,1,1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(kind, texture);
  return texture;
}

export function createKnightGroundMarker(kind = "selection", size = 1.25) {
  const material = new THREE.MeshBasicMaterial({
    map: makeTexture(kind),
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = kind === "selection" ? 0.025 : 0.035;
  return mesh;
}
