import * as THREE from "three";
import { PROP_KIND } from "../world/SanctuaryProps.js";

const textureCache = new Map();
const glowCache = new Map();

const P = Object.freeze({
  outline: "#13181b",
  darkest: "#20272a",
  stoneDark: "#3d4948",
  stone: "#66736d",
  stoneLight: "#9aa59a",
  mossDark: "#294233",
  moss: "#456247",
  mossLight: "#6d805a",
  woodDark: "#352820",
  wood: "#5b4432",
  woodLight: "#866449",
  iron: "#3a4347",
  clothRed: "#702d31",
  clothRedDark: "#401c20",
  clothBlue: "#2d4463",
  gold: "#a88b4e",
  goldLight: "#dcc577",
  parchment: "#c5b68d",
  parchmentShadow: "#8f7c5e",
  wax: "#d9c79d",
  flame: "#f49a45",
  flameHot: "#ffe0a0",
  black: "#080b0d",
});

function makeCanvas(w, h) {
  const canvas=document.createElement("canvas");
  canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.imageSmoothingEnabled=false;
  return {canvas,ctx};
}

function r(ctx,c,x,y,w,h){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function pts(ctx,c,list){ctx.fillStyle=c;for(const [x,y,w=1,h=1] of list)ctx.fillRect(x,y,w,h);}

function shadow(ctx,x,y,w){r(ctx,"rgba(0,0,0,.42)",x,y,w,3);r(ctx,"rgba(0,0,0,.24)",x+3,y+3,Math.max(1,w-6),2);}

function sanctuaryMark(ctx,x,y,scale=1,color=P.gold){
  r(ctx,color,x+5*scale,y,2*scale,11*scale);
  pts(ctx,color,[
    [x+2*scale,y+1*scale,3*scale,2*scale],[x+7*scale,y+1*scale,3*scale,2*scale],
    [x+1*scale,y+3*scale,2*scale,5*scale],[x+9*scale,y+3*scale,2*scale,5*scale],
    [x+2*scale,y+8*scale,3*scale,2*scale],[x+7*scale,y+8*scale,3*scale,2*scale],
  ]);
}

function drawAltar(ctx, active=false){
  shadow(ctx,9,62,46);
  r(ctx,P.outline,10,44,44,19);
  r(ctx,P.stoneDark,12,46,40,15);
  r(ctx,P.stone,14,46,34,11);
  r(ctx,P.stoneLight,15,47,15,3);
  r(ctx,P.outline,17,30,30,17);
  r(ctx,P.stoneDark,19,32,26,13);
  r(ctx,P.stone,21,32,22,10);
  r(ctx,P.stoneLight,22,33,9,3);
  sanctuaryMark(ctx,27,33,1,active?P.goldLight:P.gold);

  // relic bowl
  r(ctx,P.outline,24,22,16,9);
  r(ctx,P.gold,26,24,12,5);
  r(ctx,active?P.flameHot:P.parchment,29,20,6,6);

  // painted aura
  if(active){
    pts(ctx,"rgba(255,224,160,.48)",[[22,17,20,2],[18,20,28,2],[15,24,34,2],[18,28,28,2]]);
    pts(ctx,P.goldLight,[[13,36,3,2],[48,37,3,2],[29,15,6,2]]);
  }
}

function drawScribeTable(ctx,variant=0){
  shadow(ctx,5,43,49);
  r(ctx,P.outline,7,20,45,24);
  r(ctx,P.woodDark,9,22,41,19);
  r(ctx,P.wood,10,22,38,14);
  r(ctx,P.woodLight,11,23,21,3);
  r(ctx,P.outline,10,37,6,8);
  r(ctx,P.outline,43,37,6,8);
  r(ctx,P.wood,11,37,4,7);
  r(ctx,P.wood,44,37,4,7);

  // parchment, book, ink, candle
  r(ctx,P.parchmentShadow,14,25,14,9);
  r(ctx,P.parchment,15,24,13,8);
  pts(ctx,"#75664f",[[17,27,8,1],[17,29,6,1]]);
  r(ctx,P.clothRedDark,31,24,9,8);
  r(ctx,P.clothRed,32,24,8,7);
  r(ctx,P.gold,35,24,1,7);
  r(ctx,P.black,42,27,4,5);
  r(ctx,P.wax,45,22,2,10);
  r(ctx,P.flame,45,19,2,4);
  r(ctx,P.flameHot,45,19,1,2);
  if(variant%2) pts(ctx,P.moss,[[9,34,5,2],[11,36,3,2]]);
}

function drawBench(ctx,variant=0){
  shadow(ctx,5,34,46);
  r(ctx,P.outline,7,18,43,17);
  r(ctx,P.woodDark,9,20,39,12);
  r(ctx,P.wood,10,20,37,7);
  r(ctx,P.woodLight,12,21,19,2);
  r(ctx,P.outline,10,31,5,6);
  r(ctx,P.outline,42,31,5,6);
  r(ctx,P.wood,11,31,3,5);
  r(ctx,P.wood,43,31,3,5);
  if(variant%2){
    ctx.clearRect(35,18,10,8);
    pts(ctx,P.outline,[[34,24,5,2],[38,22,4,2]]);
  }
}

function drawGrave(ctx,broken=false,variant=0){
  shadow(ctx,7,40,28);
  r(ctx,P.outline,10,13,23,28);
  r(ctx,P.stoneDark,12,15,19,24);
  r(ctx,P.stone,14,15,14,21);
  r(ctx,P.stoneLight,15,16,5,4);
  sanctuaryMark(ctx,17,21,1,P.darkest);
  pts(ctx,P.moss,variant%2?[[12,32,7,2],[15,34,4,2]]:[[24,29,5,2],[23,31,4,2]]);
  if(broken){
    ctx.clearRect(25,11,10,12);
    pts(ctx,P.outline,[[24,21,4,2],[27,18,3,2]]);
  }
}

function drawBanner(ctx,variant=0){
  const cloth=variant%2?P.clothBlue:P.clothRed;
  const dark=variant%2?"#1d2e45":P.clothRedDark;
  r(ctx,P.outline,9,7,30,45);
  r(ctx,dark,11,9,26,40);
  r(ctx,cloth,13,10,22,37);
  r(ctx,P.gold,9,5,30,4);
  r(ctx,P.goldLight,12,5,11,2);
  sanctuaryMark(ctx,18,19,1,P.goldLight);
  // torn bottom
  ctx.clearRect(11,44,7,7);
  ctx.clearRect(28,46,9,6);
  pts(ctx,dark,[[18,45,5,4],[23,43,5,7]]);
}

function drawCandles(ctx,variant=0,frame=0){
  shadow(ctx,5,27,31);
  const coords=variant%3===0?[[9,16,9],[18,12,13],[27,18,7]]:variant%3===1?[[10,18,7],[17,14,11],[25,11,14]]:[[8,13,12],[18,18,7],[28,15,10]];
  coords.forEach(([x,y,h],i)=>{
    r(ctx,P.outline,x-1,y-1,4,h+3);
    r(ctx,P.wax,x,y,2,h);
    r(ctx,"#fff0c2",x,y,1,h-2);
    const fy=y-4+(frame&&i===1?-1:0);
    r(ctx,P.flame,x,fy,2,4);
    r(ctx,P.flameHot,x,fy,1,2);
  });
}

function drawStatueBroken(ctx){
  shadow(ctx,7,52,43);
  // pedestal
  r(ctx,P.outline,10,40,37,13);
  r(ctx,P.stoneDark,12,42,33,9);
  r(ctx,P.stone,14,42,25,6);
  r(ctx,P.stoneLight,15,43,9,2);
  // torso fragment
  r(ctx,P.outline,20,18,18,25);
  r(ctx,P.stoneDark,22,20,14,21);
  r(ctx,P.stone,23,20,10,18);
  r(ctx,P.stoneLight,24,21,4,9);
  // missing head / shoulder break
  ctx.clearRect(29,16,12,12);
  pts(ctx,P.outline,[[30,24,6,2],[34,21,4,3]]);
  // fallen head
  r(ctx,P.outline,39,41,10,9);
  r(ctx,P.stone,41,42,7,6);
  pts(ctx,P.moss,[[13,48,8,2],[17,50,4,2],[40,47,5,2]]);
}

function drawRubble(ctx,variant=0){
  shadow(ctx,5,29,39);
  const stones=variant%2?[[8,21,10,7],[17,17,12,10],[29,22,12,7],[14,25,9,6]]:[[7,23,12,6],[18,18,10,10],[28,20,13,9],[20,26,8,5]];
  stones.forEach(([x,y,w,h],i)=>{
    r(ctx,P.outline,x-1,y-1,w+2,h+2);
    r(ctx,i%2?P.stoneDark:P.stone,x,y,w,h);
    r(ctx,P.stoneLight,x+1,y+1,Math.max(2,Math.floor(w*.45)),1);
  });
}

function drawFoliage(ctx,variant=0){
  const dark=P.mossDark,mid=P.moss,light=P.mossLight;
  shadow(ctx,5,37,38);
  const leaves=[[10,26,3,12],[15,18,3,18],[20,24,3,13],[25,15,3,21],[30,22,3,15],[35,19,3,18]];
  pts(ctx,dark,leaves);
  pts(ctx,mid,leaves.map(([x,y,w,h],i)=>[x+1,y+(i%2?1:3),2,Math.max(4,h-5)]));
  pts(ctx,light,variant%2?[[16,19,1,7],[26,16,1,8],[36,21,1,7]]:[[11,27,1,6],[21,25,1,6],[31,23,1,7]]);
}

function drawRoots(ctx,variant=0){
  shadow(ctx,4,34,48);
  r(ctx,P.woodDark,8,28,38,4);
  pts(ctx,P.wood,[
    [10,24,18,4],[24,20,4,9],[28,19,13,4],[38,16,4,8],
    [12,18,4,9],[9,15,3,7],[30,26,14,3]
  ]);
  pts(ctx,P.woodLight,variant%2?[[12,24,10,1],[29,19,8,1],[39,17,2,4]]:[[15,19,2,6],[25,21,2,6],[31,26,8,1]]);
  pts(ctx,P.moss,[[7,29,8,2],[33,28,8,2]]);
}

function drawBarrel(ctx){
  shadow(ctx,7,36,25);
  r(ctx,P.outline,9,10,21,27);
  r(ctx,P.woodDark,11,12,17,23);
  r(ctx,P.wood,12,12,14,22);
  r(ctx,P.woodLight,13,13,5,18);
  r(ctx,P.iron,10,16,19,3);
  r(ctx,P.iron,10,29,19,3);
  r(ctx,P.outline,12,9,15,4);
}

function drawSacks(ctx){
  shadow(ctx,5,31,35);
  const sacks=[[7,18,14,13],[18,14,14,16],[27,20,11,11]];
  sacks.forEach(([x,y,w,h],i)=>{
    r(ctx,P.outline,x-1,y-1,w+2,h+2);
    r(ctx,i===1?"#796b50":"#6b5e46",x,y,w,h);
    r(ctx,"#9a8b68",x+2,y+2,Math.max(2,w-6),2);
    r(ctx,P.woodDark,x+Math.floor(w/2),y-2,2,4);
  });
}

function drawCrate(ctx,broken=false,variant=0){
  shadow(ctx,5,35,36);
  if(broken){
    pts(ctx,P.wood,[[7,25,13,6],[19,29,12,5],[27,22,11,6],[12,19,8,5]]);
    pts(ctx,P.iron,[[10,21,3,10],[30,20,3,9]]);
    return;
  }
  r(ctx,P.outline,7,9,34,27);
  r(ctx,P.woodDark,9,11,30,23);
  r(ctx,P.wood,10,11,28,19);
  r(ctx,P.woodLight,11,12,20,3);
  r(ctx,P.iron,12,9,4,27);
  r(ctx,P.iron,32,9,4,27);
  r(ctx,P.woodDark,9,21,30,4);
  if(variant%2) pts(ctx,P.mossDark,[[9,30,8,2],[12,32,4,2]]);
}

function drawUrn(ctx,broken=false,variant=0){
  shadow(ctx,7,38,25);
  if(broken){
    pts(ctx,P.stone,[[8,28,8,6],[16,31,9,5],[24,26,8,7],[13,23,6,5]]);
    return;
  }
  r(ctx,P.outline,13,7,13,6);
  r(ctx,P.stone,15,8,9,4);
  r(ctx,P.outline,9,13,21,22);
  r(ctx,P.stoneDark,11,15,17,18);
  r(ctx,P.stone,13,15,13,17);
  r(ctx,P.stoneLight,14,16,5,8);
  r(ctx,P.outline,12,33,15,5);
  sanctuaryMark(ctx,14,19,1,variant%2?P.gold:P.darkest);
}

function draw(kind,ctx,variant,state,frame){
  if(kind===PROP_KIND.ALTAR) drawAltar(ctx,state==="active");
  else if(kind===PROP_KIND.SCRIBE_TABLE) drawScribeTable(ctx,variant);
  else if(kind===PROP_KIND.BENCH) drawBench(ctx,variant);
  else if(kind===PROP_KIND.GRAVE) drawGrave(ctx,false,variant);
  else if(kind===PROP_KIND.GRAVE_BROKEN) drawGrave(ctx,true,variant);
  else if(kind===PROP_KIND.BANNER) drawBanner(ctx,variant);
  else if(kind===PROP_KIND.CANDLES) drawCandles(ctx,variant,frame);
  else if(kind===PROP_KIND.STATUE_BROKEN) drawStatueBroken(ctx);
  else if(kind===PROP_KIND.RUBBLE) drawRubble(ctx,variant);
  else if(kind===PROP_KIND.FOLIAGE) drawFoliage(ctx,variant);
  else if(kind===PROP_KIND.ROOTS) drawRoots(ctx,variant);
  else if(kind===PROP_KIND.BARREL) drawBarrel(ctx);
  else if(kind===PROP_KIND.SACKS) drawSacks(ctx);
  else if(kind===PROP_KIND.CRATE) drawCrate(ctx,state==="broken",variant);
  else if(kind===PROP_KIND.URN) drawUrn(ctx,state==="broken",variant);
}

function dimensions(kind){
  if(kind===PROP_KIND.ALTAR) return [64,68,1.6,1.9];
  if(kind===PROP_KIND.SCRIBE_TABLE) return [60,48,1.6,1.3];
  if(kind===PROP_KIND.BANNER) return [48,56,1.0,1.65];
  if(kind===PROP_KIND.STATUE_BROKEN) return [56,56,1.3,1.45];
  if(kind===PROP_KIND.ROOTS) return [54,40,1.45,1.05];
  if(kind===PROP_KIND.BENCH) return [56,40,1.45,1.05];
  if(kind===PROP_KIND.GRAVE||kind===PROP_KIND.GRAVE_BROKEN) return [42,44,0.9,1.15];
  if(kind===PROP_KIND.CANDLES) return [42,38,0.82,0.95];
  if(kind===PROP_KIND.RUBBLE) return [48,38,1.15,0.92];
  if(kind===PROP_KIND.FOLIAGE) return [48,42,1.1,1.15];
  if(kind===PROP_KIND.BARREL) return [40,42,0.82,1.05];
  if(kind===PROP_KIND.SACKS) return [44,38,1.0,0.9];
  if(kind===PROP_KIND.CRATE) return [48,42,1.05,1.0];
  if(kind===PROP_KIND.URN) return [40,42,0.82,1.0];
  return [48,48,1,1];
}

export function getIsoPropTexture(kind,variant=0,state="normal",frame=0){
  const key=kind+":"+variant+":"+state+":"+frame;
  if(textureCache.has(key)) return textureCache.get(key);
  const [w,h]=dimensions(kind);
  const {canvas,ctx}=makeCanvas(w,h);
  draw(kind,ctx,variant,state,frame);
  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  textureCache.set(key,texture);
  return texture;
}

export function isoPropScale(kind){
  const d=dimensions(kind);
  return [d[2],d[3]];
}

export function getLightPoolTexture(size="small"){
  if(glowCache.has(size)) return glowCache.get(size);
  const canvas=document.createElement("canvas");
  canvas.width=32; canvas.height=32;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.imageSmoothingEnabled=false;

  const rings=size==="strong"?[
    [3,7,26,18,"rgba(255,177,85,.055)"],
    [6,9,20,14,"rgba(255,190,100,.09)"],
    [10,12,12,8,"rgba(255,210,130,.14)"],
  ]:[
    [6,10,20,12,"rgba(255,177,85,.045)"],
    [9,12,14,8,"rgba(255,195,105,.08)"],
    [12,14,8,5,"rgba(255,220,145,.13)"],
  ];
  for(const [x,y,w,h,c] of rings) r(ctx,c,x,y,w,h);

  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  glowCache.set(size,texture);
  return texture;
}
