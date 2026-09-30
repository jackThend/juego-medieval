import * as THREE from "three";
import { TILE } from "../world/SanctuaryGrid.js";

const cache=new Map();

const PALETTES={
  [TILE.STONE]:{
    base:"#465356",light:"#647174",dark:"#303b3e",seam:"#222a2e",accent:"#566562",
  },
  [TILE.STONE_DARK]:{
    base:"#334247",light:"#4b5a5e",dark:"#242f33",seam:"#1a2327",accent:"#405055",
  },
  [TILE.MOSS]:{
    base:"#35493d",light:"#536551",dark:"#25362d",seam:"#1e2c27",accent:"#68704d",
  },
  [TILE.PATH]:{
    base:"#555b57",light:"#737a70",dark:"#3d4541",seam:"#2a312f",accent:"#666b61",
  },
  [TILE.SANCTUM]:{
    base:"#5a5952",light:"#807b6d",dark:"#403f3b",seam:"#2d302d",accent:"#9a824d",
  },
};

function rect(ctx,color,x,y,w,h){
  ctx.fillStyle=color;
  ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}

function hash(seed){
  let n=seed>>>0;
  n^=n<<13;n^=n>>>17;n^=n<<5;
  return n>>>0;
}

function makeTileTexture(type,variant=0,active=false){
  const key=type+":"+variant+":"+(active?1:0);
  if(cache.has(key))return cache.get(key);

  const canvas=document.createElement("canvas");
  canvas.width=32;
  canvas.height=32;
  const ctx=canvas.getContext("2d",{alpha:false});
  ctx.imageSmoothingEnabled=false;

  const p=PALETTES[type]??PALETTES[TILE.STONE];
  rect(ctx,p.base,0,0,32,32);

  // El piso ahora es una superficie continua. No existe un marco/bisel por
  // tile: las juntas son internas, irregulares y se pierden en los bordes.
  let seed=hash((variant+1)*92821+type.length*1777+(active?91:0));

  for(let i=0;i<12;i++){
    seed=hash(seed+i*31);
    const x=2+(seed%27);
    const y=2+((seed>>>5)%27);
    const w=1+((seed>>>10)%4);
    const color=i%3===0?p.light:i%3===1?p.dark:p.accent;
    rect(ctx,color,x,y,w,1);
    if(i%4===0)rect(ctx,p.seam,x,y+1,1,2);
  }

  // Lajas interiores: nunca recorren el tile completo, por lo que la trama no
  // se convierte en una cuadrícula de tablero.
  const seamPatterns=[
    [[5,10,13,1],[18,10,1,7],[12,23,14,1]],
    [[4,16,11,1],[15,9,1,8],[20,24,8,1]],
    [[7,7,17,1],[11,8,1,9],[5,22,12,1]],
    [[18,5,1,11],[7,16,12,1],[14,25,13,1]],
    [[5,12,9,1],[14,12,1,8],[19,21,9,1]],
    [[9,6,14,1],[7,18,11,1],[22,18,1,8]],
  ];
  const seams=seamPatterns[variant%seamPatterns.length];
  for(const [x,y,w,h] of seams)rect(ctx,p.seam,x,y,w,h);

  if(type===TILE.STONE||type===TILE.STONE_DARK){
    const crack=variant%3;
    if(crack===0){
      rect(ctx,p.dark,24,5,1,5);rect(ctx,p.dark,22,9,3,1);rect(ctx,p.seam,21,10,1,3);
    }else if(crack===1){
      rect(ctx,p.dark,7,24,5,1);rect(ctx,p.seam,11,22,1,3);rect(ctx,p.seam,12,21,3,1);
    }else{
      rect(ctx,p.dark,25,17,4,1);rect(ctx,p.seam,24,18,1,4);
    }
  }

  if(type===TILE.MOSS){
    const moss=variant%3;
    const patches=moss===0
      ?[[2,3,10,3],[5,6,6,2],[24,22,6,5]]
      :moss===1
        ?[[20,2,9,4],[23,6,5,3],[3,23,8,5]]
        :[[3,16,7,4],[6,20,5,3],[23,7,7,4]];
    for(const [x,y,w,h] of patches){
      rect(ctx,"#294334",x,y,w,h);
      rect(ctx,"#476044",x+1,y+1,Math.max(2,w-3),1);
    }
  }

  if(type===TILE.PATH){
    // El camino se reconoce por valor y por desgaste longitudinal, no por una
    // raya central artificial.
    rect(ctx,p.light,5,5,13,2);
    rect(ctx,p.accent,19,18,9,2);
    rect(ctx,p.dark,3,27,11,1);
    if(variant%2===0)rect(ctx,p.seam,24,7,1,8);
  }

  if(type===TILE.SANCTUM){
    const gold=active?"#eed895":"#9c824e";
    const hot=active?"#fff0bb":"#6f6247";
    rect(ctx,gold,6,7,20,2);
    rect(ctx,gold,6,23,20,2);
    rect(ctx,gold,6,9,2,14);
    rect(ctx,gold,24,9,2,14);
    rect(ctx,hot,14,13,4,7);
    rect(ctx,gold,11,13,3,2);
    rect(ctx,gold,18,13,3,2);
    rect(ctx,gold,10,15,2,4);
    rect(ctx,gold,20,15,2,4);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  cache.set(key,texture);
  return texture;
}

export function createIsoTileMaterial(type,variant=0,{active=false}={}){
  return new THREE.MeshBasicMaterial({
    map:makeTileTexture(type,variant,active),
    color:0xffffff,
    toneMapped:false,
    transparent:false,
    depthWrite:true,
    depthTest:true,
  });
}

export function updateSanctumMaterial(material,variant=0,active=false){
  material.map=makeTileTexture(TILE.SANCTUM,variant,active);
  material.needsUpdate=true;
}
