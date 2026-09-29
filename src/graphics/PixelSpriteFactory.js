import * as THREE from "three";

const cache = new Map();

function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function textureFromCanvas(key, w, h, draw) {
  if (cache.has(key)) return cache.get(key);
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.clearRect(0, 0, w, h);
  draw(ctx, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function px(ctx, color, points) {
  ctx.fillStyle = color;
  for (const [x, y, w = 1, h = 1] of points) ctx.fillRect(x, y, w, h);
}

function checker(ctx, c1, c2, x, y, w, h, step = 2) {
  for (let yy = 0; yy < h; yy += step) {
    for (let xx = 0; xx < w; xx += step) {
      rect(ctx, ((xx / step + yy / step) & 1) ? c1 : c2, x + xx, y + yy, step, step);
    }
  }
}

const KNIGHT = {
  outline: "#0b1015",
  darkest: "#18232c",
  metalDark: "#425669",
  metal: "#91a9bc",
  metalLight: "#d9e6ed",
  cloth: "#203d67",
  clothLight: "#3b6792",
  leather: "#59463a",
  gold: "#b89b56",
  goldLight: "#e4cd82",
  eye: "#8ed9ff",
};

function knightBase(ctx, dir, frame, state) {
  const walk = state === "walk" ? (frame & 1 ? 1 : -1) : 0;
  const bob = state === "walk" ? (frame & 1) : 0;
  const attack = state === "attack";
  const hurt = state === "hurt";
  const back = dir === "back";
  const side = dir === "side";

  ctx.save();
  if (hurt) ctx.globalAlpha = 0.86;

  rect(ctx, "rgba(4,7,8,.55)", 13, 54, 25, 4);
  rect(ctx, "rgba(4,7,8,.38)", 10, 55, 31, 2);

  rect(ctx, KNIGHT.outline, 20, 42 + bob, 7, 13);
  rect(ctx, KNIGHT.outline, 29, 42 - bob, 7, 13);
  rect(ctx, KNIGHT.darkest, 21, 43 + bob + walk, 5, 8);
  rect(ctx, KNIGHT.darkest, 30, 43 - bob - walk, 5, 8);
  rect(ctx, KNIGHT.leather, 19, 50 + bob + walk, 8, 5);
  rect(ctx, KNIGHT.leather, 29, 50 - bob - walk, 8, 5);
  px(ctx, "#896c53", [[20,50+bob+walk,5,1],[30,50-bob-walk,5,1]]);

  rect(ctx, KNIGHT.outline, 16, 31 + bob, 24, 15);
  rect(ctx, KNIGHT.cloth, 18, 33 + bob, 20, 12);
  rect(ctx, KNIGHT.clothLight, 25, 33 + bob, 5, 12);
  rect(ctx, KNIGHT.darkest, 18, 43 + bob, 20, 3);
  rect(ctx, KNIGHT.gold, 18, 32 + bob, 20, 2);

  rect(ctx, KNIGHT.outline, 17, 20 + bob, 22, 16);
  rect(ctx, KNIGHT.metalDark, 18, 21 + bob, 20, 14);
  rect(ctx, KNIGHT.metal, 20, 21 + bob, 16, 12);
  rect(ctx, KNIGHT.metalLight, 21, 22 + bob, 6, 3);
  rect(ctx, KNIGHT.gold, 26, 21 + bob, 3, 14);
  px(ctx, KNIGHT.darkest, [[20,31+bob,16,3],[18,25+bob,2,7],[36,25+bob,2,7]]);

  rect(ctx, KNIGHT.outline, 11, 20 + bob, 9, 9);
  rect(ctx, KNIGHT.metalDark, 12, 21 + bob, 8, 7);
  rect(ctx, KNIGHT.metal, 13, 21 + bob, 6, 5);
  rect(ctx, KNIGHT.metalLight, 14, 21 + bob, 3, 2);
  rect(ctx, KNIGHT.outline, 37, 20 + bob, 9, 9);
  rect(ctx, KNIGHT.metalDark, 37, 21 + bob, 8, 7);
  rect(ctx, KNIGHT.metal, 38, 21 + bob, 6, 5);
  rect(ctx, KNIGHT.metalLight, 39, 21 + bob, 3, 2);

  if (back) {
    rect(ctx, KNIGHT.outline, 17, 26 + bob, 22, 20);
    rect(ctx, KNIGHT.cloth, 19, 27 + bob, 18, 18);
    px(ctx, KNIGHT.clothLight, [[20,28+bob,4,12],[24,40+bob,5,3]]);
  }

  const shieldX = side ? 13 : 8;
  rect(ctx, KNIGHT.outline, shieldX, 29 + bob, 11, 18);
  rect(ctx, "#4b392e", shieldX + 1, 30 + bob, 9, 16);
  rect(ctx, KNIGHT.gold, shieldX + 5, 30 + bob, 2, 16);
  rect(ctx, KNIGHT.gold, shieldX + 2, 37 + bob, 7, 2);
  rect(ctx, KNIGHT.metalLight, shieldX + 4, 36 + bob, 4, 4);

  if (attack) {
    rect(ctx, KNIGHT.outline, 39, 24 + bob, 4, 20);
    rect(ctx, KNIGHT.gold, 38, 25 + bob, 6, 3);
    rect(ctx, KNIGHT.metalLight, 42, 12 + bob, 3, 24);
    rect(ctx, KNIGHT.metal, 45, 8 + bob, 2, 20);
    rect(ctx, KNIGHT.outline, 47, 8 + bob, 2, 18);
    px(ctx, KNIGHT.metalLight, [[44,10+bob,2,2],[46,8+bob,1,2]]);
  } else {
    rect(ctx, KNIGHT.outline, 40, 28 + bob, 4, 18);
    rect(ctx, KNIGHT.gold, 38, 29 + bob, 7, 3);
    rect(ctx, KNIGHT.metalLight, 41, 35 + bob, 3, 18);
    rect(ctx, KNIGHT.metal, 44, 38 + bob, 2, 15);
  }

  rect(ctx, KNIGHT.outline, 18, 7 + bob, 21, 15);
  rect(ctx, KNIGHT.metalDark, 20, 8 + bob, 17, 13);
  rect(ctx, KNIGHT.metal, 21, 8 + bob, 15, 10);
  rect(ctx, KNIGHT.metalLight, 22, 9 + bob, 6, 3);
  rect(ctx, KNIGHT.outline, 20, 15 + bob, 17, 5);
  rect(ctx, KNIGHT.gold, 27, 8 + bob, 2, 13);

  if (!back) {
    rect(ctx, "#0a1119", 22, 16 + bob, 13, 3);
    px(ctx, KNIGHT.eye, [[23,17+bob,3,1],[31,17+bob,3,1]]);
  } else {
    rect(ctx, KNIGHT.darkest, 21, 15 + bob, 15, 4);
  }

  rect(ctx, KNIGHT.outline, 27, 2 + bob, 4, 7);
  rect(ctx, KNIGHT.clothLight, 28, 2 + bob, 3, 6);
  rect(ctx, KNIGHT.cloth, 30, 1 + bob, 3, 6);
  px(ctx, KNIGHT.clothLight, [[31,1+bob,2,2],[32,0+bob,2,2]]);

  if (hurt) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(255,90,70,.28)";
    ctx.fillRect(0, 0, 56, 64);
  }
  ctx.restore();
}

function guardianBase(ctx, dir, frame, state) {
  const attack = state === "attack";
  const hurt = state === "hurt";
  const pulse = frame & 1;
  const outline = "#120d12";
  const black = "#1d1a22";
  const stone = "#4f5a58";
  const metal = "#657070";
  const bone = "#b8aa8b";
  const boneHi = "#e0d0a8";
  const cloth = "#59242e";
  const glow = pulse ? "#ffad65" : "#e56c45";
  const glowHi = pulse ? "#ffe0a0" : "#ff9f65";

  ctx.save();
  rect(ctx, "rgba(4,4,6,.62)", 15, 70, 40, 5);
  rect(ctx, "rgba(4,4,6,.38)", 11, 72, 48, 2);

  rect(ctx, outline, 24, 52, 10, 18);
  rect(ctx, outline, 39, 51, 10, 19);
  rect(ctx, black, 25, 53, 8, 16);
  rect(ctx, black, 40, 52, 8, 17);
  rect(ctx, stone, 22, 66, 13, 6);
  rect(ctx, stone, 38, 66, 13, 6);

  rect(ctx, outline, 16, 34, 40, 23);
  rect(ctx, cloth, 19, 41, 34, 15);
  rect(ctx, black, 19, 34, 34, 11);
  rect(ctx, metal, 22, 30, 28, 17);

  rect(ctx, bone, 27, 33, 3, 17);
  rect(ctx, bone, 45, 33, 3, 17);
  rect(ctx, bone, 29, 33, 16, 3);
  rect(ctx, bone, 30, 47, 15, 3);
  rect(ctx, outline, 34, 35, 8, 14);
  rect(ctx, glow, 35, 36, 6, 12);
  rect(ctx, glowHi, 36, 38, 4, 7);

  rect(ctx, outline, 7, 30, 14, 24);
  rect(ctx, stone, 9, 31, 11, 21);
  rect(ctx, metal, 10, 32, 6, 14);
  px(ctx, bone, [[5,51,4,9],[10,52,4,10],[15,51,4,9]]);

  rect(ctx, outline, 53, 28, 9, 28);
  rect(ctx, black, 54, 30, 7, 24);
  if (attack) {
    rect(ctx, outline, 58, 13, 5, 42);
    rect(ctx, metal, 59, 14, 3, 40);
    rect(ctx, outline, 52, 9, 15, 12);
    rect(ctx, glow, 54, 10, 11, 10);
    rect(ctx, glowHi, 57, 11, 5, 7);
    px(ctx, boneHi, [[65,10,4,3],[66,8,3,3],[66,19,4,3]]);
  } else {
    rect(ctx, outline, 58, 37, 5, 29);
    rect(ctx, metal, 59, 38, 3, 27);
    rect(ctx, outline, 53, 58, 15, 11);
    rect(ctx, glow, 55, 59, 11, 9);
    rect(ctx, glowHi, 58, 60, 5, 6);
  }

  rect(ctx, outline, 11, 24, 18, 13);
  rect(ctx, stone, 13, 25, 15, 11);
  rect(ctx, outline, 48, 24, 13, 12);
  rect(ctx, metal, 49, 25, 11, 10);

  rect(ctx, outline, 25, 11, 25, 20);
  rect(ctx, black, 28, 13, 19, 16);
  rect(ctx, metal, 29, 14, 17, 11);
  rect(ctx, outline, 30, 21, 15, 5);
  if (dir !== "back") px(ctx, glowHi, [[31,22,4,2],[40,22,4,2]]);

  px(ctx, bone, [[24,8,5,8],[21,4,5,7],[18,1,4,6],[47,7,5,8],[50,3,4,7]]);
  px(ctx, boneHi, [[22,4,2,4],[49,4,2,4]]);
  rect(ctx, glow, 35, 5, 5, 9);
  rect(ctx, glowHi, 36, 5, 3, 6);

  if (pulse) px(ctx, glow, [[13,20,3,4],[56,17,3,4],[18,12,2,3],[54,7,2,3]]);
  else px(ctx, glow, [[11,22,3,4],[58,19,3,4],[17,10,2,3],[52,6,2,3]]);

  if (hurt) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(255,120,80,.24)";
    ctx.fillRect(0, 0, 72, 80);
  }
  ctx.restore();
}

function drawTree(ctx, variant = 0) {
  const trunk = variant % 2 ? "#3d332b" : "#312a25";
  const trunkHi = "#665142";
  const dark = "#10241a";
  const mid = "#1f4229";
  const light = "#35643d";
  rect(ctx, "rgba(0,0,0,.42)", 20, 86, 26, 4);
  rect(ctx, trunk, 29, 43, 8, 44);
  rect(ctx, trunkHi, 30, 45, 3, 36);
  px(ctx, trunk, [[20,48,13,5],[36,53,13,5],[17,39,15,5],[36,34,14,5]]);
  px(ctx, dark, [[7,28,52,18],[11,18,45,17],[18,8,34,17],[4,38,56,18]]);
  px(ctx, mid, [[14,24,36,11],[18,14,29,10],[10,37,39,10],[24,6,19,9]]);
  px(ctx, light, [[18,25,13,5],[33,18,11,5],[24,11,10,4],[11,39,12,5],[37,34,12,5]]);
}

function drawArch(ctx) {
  const outline = "#15191c", dark = "#3f4c4a", mid = "#697771", light = "#93a097";
  rect(ctx, "rgba(0,0,0,.42)", 8, 77, 55, 5);
  rect(ctx, outline, 9, 19, 54, 60);
  rect(ctx, dark, 12, 21, 48, 56);
  rect(ctx, mid, 15, 23, 42, 52);
  ctx.clearRect(28, 38, 17, 40);
  rect(ctx, light, 16, 24, 8, 3);
  rect(ctx, light, 48, 26, 7, 3);
  px(ctx, dark, [[17,35,6,12],[50,39,7,13],[13,55,8,4],[53,59,6,5]]);
  ctx.clearRect(10, 19, 9, 11);
  ctx.clearRect(53, 19, 10, 8);
  px(ctx, light, [[19,19,7,3],[43,21,8,3]]);
}

function drawPillar(ctx, variant = 0) {
  const outline="#171b1d", dark="#46504e", mid="#6f7a74", hi="#9da79d";
  rect(ctx,"rgba(0,0,0,.4)",8,58,24,4);
  rect(ctx,outline,10,10,20,50);
  rect(ctx,dark,12,12,16,46);
  rect(ctx,mid,14,13,11,44);
  rect(ctx,hi,15,14,4,35);
  rect(ctx,outline,7,8,26,7);
  rect(ctx,dark,9,9,22,5);
  rect(ctx,outline,8,55,24,6);
  rect(ctx,mid,10,55,20,4);
  if (variant%2) {
    ctx.clearRect(24,8,9,8);
    rect(ctx,outline,23,16,6,7);
  }
}

function drawGrave(ctx) {
  const outline="#14191a", dark="#46514c", mid="#69766d", moss="#35583a";
  rect(ctx,"rgba(0,0,0,.4)",4,26,20,3);
  rect(ctx,outline,7,6,15,21);
  rect(ctx,dark,8,7,13,19);
  rect(ctx,mid,10,8,8,15);
  px(ctx,moss,[[9,10,4,2],[15,16,5,2],[10,21,4,2]]);
  rect(ctx,outline,11,10,6,2);
  rect(ctx,outline,13,8,2,7);
}

function drawBrazier(ctx, frame=0) {
  const outline="#160e09", metal="#5b5146", ember=frame?"#ffb25b":"#e87536", hot="#ffe3a0";
  rect(ctx,"rgba(0,0,0,.35)",7,27,18,3);
  rect(ctx,outline,8,17,16,8);
  rect(ctx,metal,10,18,12,6);
  rect(ctx,outline,13,23,6,5);
  rect(ctx,metal,14,23,4,5);
  rect(ctx,ember,12,10,8,8);
  rect(ctx,hot,14,11,4,5);
  px(ctx,ember,frame?[[13,7,3,4],[18,8,3,4]]:[[15,6,3,5],[12,9,3,4]]);
}

function drawShrine(ctx, active=false) {
  const outline="#161817", stone="#4f5d58", mid="#74817a", hi="#a1aca1";
  const gold=active?"#ffe2a1":"#c69e58", glow=active?"#fff1bf":"#e4b46c";
  rect(ctx,"rgba(0,0,0,.45)",8,72,56,5);
  rect(ctx,outline,12,55,48,17);
  rect(ctx,stone,14,56,44,14);
  rect(ctx,outline,19,41,34,18);
  rect(ctx,mid,21,42,30,15);
  rect(ctx,hi,23,43,10,5);
  rect(ctx,outline,27,20,22,24);
  rect(ctx,stone,29,22,18,20);
  rect(ctx,gold,34,27,8,10);
  rect(ctx,glow,36,29,4,6);
  px(ctx,gold,[[24,14,28,3],[21,17,5,5],[50,17,5,5],[24,22,28,3]]);
  if (active) px(ctx,glow,[[27,12,4,3],[45,12,4,3],[18,23,3,4],[55,23,3,4]]);
  for (const [x,y] of [[17,50],[56,48],[12,57],[61,57]]) {
    rect(ctx,"#d9c7a2",x,y,2,8);
    rect(ctx,glow,x,y-2,2,3);
  }
}

function drawCrate(ctx, broken=false) {
  const outline="#17110e", dark="#4a3428", mid="#74533b", hi="#9b7250", iron="#4d5758";
  if (!broken) {
    rect(ctx,"rgba(0,0,0,.4)",4,29,27,3);
    rect(ctx,outline,5,7,26,23);
    rect(ctx,mid,7,9,22,19);
    rect(ctx,dark,7,18,22,4);
    rect(ctx,hi,8,10,20,3);
    rect(ctx,iron,10,7,3,23);
    rect(ctx,iron,24,7,3,23);
    rect(ctx,outline,7,7,4,4);
  } else {
    rect(ctx,"rgba(0,0,0,.36)",3,25,30,4);
    px(ctx,mid,[[5,18,9,5],[14,21,8,4],[23,17,7,5],[9,13,6,4]]);
    px(ctx,iron,[[7,15,3,8],[25,14,3,8]]);
  }
}

function drawUrn(ctx, broken=false) {
  const outline="#141718", dark="#4e5853", mid="#778079", hi="#aab0a6";
  if (!broken) {
    rect(ctx,"rgba(0,0,0,.38)",7,31,18,3);
    rect(ctx,outline,10,7,12,4);
    rect(ctx,mid,12,7,8,4);
    rect(ctx,outline,8,12,16,17);
    rect(ctx,dark,9,13,14,15);
    rect(ctx,mid,11,13,10,14);
    rect(ctx,hi,12,14,4,8);
    rect(ctx,outline,10,28,12,4);
  } else {
    rect(ctx,"rgba(0,0,0,.35)",5,27,22,3);
    px(ctx,mid,[[7,20,6,5],[13,23,7,4],[20,19,5,5],[10,16,4,4]]);
  }
}

function drawGrass(ctx, variant=0) {
  const dark="#173322", mid="#2d5a36", light="#477746";
  px(ctx,dark,[[7,18,2,10],[12,14,2,14],[17,17,2,11],[22,13,2,15],[27,19,2,9]]);
  px(ctx,mid,[[9,16,2,9],[14,11,2,14],[19,14,2,12],[24,10,2,15]]);
  px(ctx,light,variant%2?[[15,11,2,6],[25,10,2,6]]:[[10,16,2,5],[20,14,2,6]]);
}

export function getKnightSpriteTexture(state="idle", direction="front", frame=0) {
  const key="knight:"+state+":"+direction+":"+frame;
  return textureFromCanvas(key,56,64,(ctx)=>knightBase(ctx,direction,frame,state));
}

export function getGuardianSpriteTexture(state="idle", direction="front", frame=0) {
  const key="guardian:"+state+":"+direction+":"+frame;
  return textureFromCanvas(key,72,80,(ctx)=>guardianBase(ctx,direction,frame,state));
}

export function getPropSpriteTexture(kind, variant=0, frame=0) {
  const key="prop:"+kind+":"+variant+":"+frame;
  const w=kind==="shrine"?72:kind==="arch"?72:kind==="tree"?64:36;
  const h=kind==="tree"?96:kind==="arch"?84:kind==="shrine"?80:kind==="pillar"?64:36;
  return textureFromCanvas(key,w,h,(ctx)=>{
    if(kind==="tree") drawTree(ctx,variant);
    else if(kind==="arch") drawArch(ctx,variant);
    else if(kind==="pillar") drawPillar(ctx,variant);
    else if(kind==="grave") drawGrave(ctx);
    else if(kind==="brazier") drawBrazier(ctx,frame);
    else if(kind==="shrine") drawShrine(ctx,Boolean(frame));
    else if(kind==="crate") drawCrate(ctx,Boolean(frame));
    else if(kind==="urn") drawUrn(ctx,Boolean(frame));
    else if(kind==="grass") drawGrass(ctx,variant);
  });
}

export function createGroundPixelTexture(size=256) {
  return textureFromCanvas("ground:"+size,size,size,(ctx,w,h)=>{
    let s=0x51f15e;
    const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};

    rect(ctx,"#24352c",0,0,w,h);
    checker(ctx,"#26382e","#223229",0,0,w,h,4);

    for(let i=0;i<520;i++){
      const x=Math.floor(rnd()*w), y=Math.floor(rnd()*h);
      const colors=["#2d4432","#34503a","#1c3026","#40573d"];
      rect(ctx,colors[Math.floor(rnd()*colors.length)],x,y,1+rnd()*3,1+rnd()*2);
    }

    rect(ctx,"#5e5a4e",105,26,48,190);
    rect(ctx,"#5e5a4e",58,137,145,37);
    for(let y=30;y<214;y+=10){
      for(let x=108;x<151;x+=12){
        const off=((y/10)&1)*5;
        rect(ctx,"#777066",x+off,y,9,6);
        rect(ctx,"#4b4b43",x+off,y+6,9,2);
      }
    }
    for(let y=141;y<171;y+=9){
      for(let x=61;x<201;x+=14){
        rect(ctx,"#777066",x,y,11,6);
        rect(ctx,"#4a4a43",x,y+6,11,2);
      }
    }

    rect(ctx,"#3b4039",87,164,82,48);
    for(let i=0;i<95;i++){
      const x=88+Math.floor(rnd()*79), y=165+Math.floor(rnd()*45);
      rect(ctx,rnd()>.5?"#51574f":"#313a34",x,y,1+rnd()*3,1+rnd()*2);
    }

    for(let i=0;i<650;i++){
      const x=Math.floor(rnd()*w), y=Math.floor(rnd()*h);
      if(x>48&&x<w-48&&y>36&&y<h-36) continue;
      rect(ctx,rnd()>.55?"#182a21":"#1d3025",x,y,2+rnd()*3,1+rnd()*3);
    }
  });
}

export function makeBillboard(texture,width,height,{opacity=1,depthWrite=true,renderOrder=0}={}) {
  const material=new THREE.SpriteMaterial({
    map:texture,
    transparent:true,
    alphaTest:0.08,
    depthWrite,
    depthTest:true,
    opacity,
    fog:true,
    toneMapped:false,
  });
  const sprite=new THREE.Sprite(material);
  sprite.center.set(0.5,0.02);
  sprite.scale.set(width,height,1);
  sprite.renderOrder=renderOrder;
  return sprite;
}

export function makeGroundPlane(texture,size=34) {
  const material=new THREE.MeshBasicMaterial({map:texture,color:0xffffff,toneMapped:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material);
  mesh.rotation.x=-Math.PI/2;
  mesh.position.y=0.002;
  mesh.receiveShadow=false;
  return mesh;
}
