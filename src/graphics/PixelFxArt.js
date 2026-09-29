import * as THREE from "three";

const cache=new Map();

const PALETTES={
  hero:["#6f899a","#c7d7df","#fff0c0"],
  enemy:["#7b2b25","#df5b3e","#ffb06d"],
  corruption:["#6c211f","#cf4934","#ff9c5d","#ffe0a0"],
  steel:["#536b78","#aebfc7","#eef2e9"],
  wood:["#4a3025","#82593d","#b88158"],
  stone:["#45514d","#738078","#a8b0a5"],
  sanctum:["#8b7442","#d4b96d","#fff0b8"],
};

function makeCanvas(w,h){
  const canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.imageSmoothingEnabled=false;
  return {canvas,ctx};
}

function r(ctx,c,x,y,w=1,h=1){
  ctx.fillStyle=c;
  ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}

function pts(ctx,c,list){
  ctx.fillStyle=c;
  for(const [x,y,w=1,h=1] of list)ctx.fillRect(x,y,w,h);
}

function texture(key,w,h,draw){
  if(cache.has(key))return cache.get(key);
  const {canvas,ctx}=makeCanvas(w,h);
  draw(ctx,w,h);
  const t=new THREE.CanvasTexture(canvas);
  t.magFilter=THREE.NearestFilter;
  t.minFilter=THREE.NearestFilter;
  t.generateMipmaps=false;
  t.colorSpace=THREE.SRGBColorSpace;
  t.needsUpdate=true;
  cache.set(key,t);
  return t;
}

export function getSlashFxTexture(enemy=false,frame=0){
  const kind=enemy?"enemy":"hero";
  const safe=Math.max(0,Math.min(4,frame|0));
  return texture("slash:"+kind+":"+safe,64,64,(ctx)=>{
    const p=PALETTES[kind];
    const frames=[
      [[13,39,8,3],[19,32,7,3],[26,26,6,3]],
      [[14,43,7,3],[19,35,8,3],[26,28,8,3],[34,23,7,3]],
      [[18,47,7,3],[22,39,8,3],[28,32,8,3],[36,26,8,3],[44,22,6,3]],
      [[25,48,7,3],[30,41,8,3],[37,34,8,3],[45,28,7,3]],
      [[34,45,7,3],[40,38,8,3],[47,32,7,3]],
    ];
    const cells=frames[safe];
    pts(ctx,p[0],cells.map(([x,y,w,h])=>[x-2,y+2,w+3,h]));
    pts(ctx,p[1],cells);
    pts(ctx,p[2],cells.map(([x,y,w,h])=>[x+2,y,w-3,1]));
    if(enemy&&safe>=1&&safe<=3){
      pts(ctx,"rgba(255,111,73,.55)",cells.map(([x,y])=>[x-4,y+5,3,2]));
    }
  });
}

export function getImpactFxTexture(kind="steel",frame=0){
  const p=PALETTES[kind]??PALETTES.steel;
  const safe=Math.max(0,Math.min(4,frame|0));
  return texture("impact:"+kind+":"+safe,48,48,(ctx)=>{
    const rays=[
      [],
      [[22,7,4,10],[22,31,4,10],[7,22,10,4],[31,22,10,4]],
      [[22,5,4,12],[22,31,4,12],[5,22,12,4],[31,22,12,4],[10,10,6,4],[32,32,6,4],[32,12,6,4],[10,32,6,4]],
      [[22,8,4,8],[22,32,4,8],[8,22,8,4],[32,22,8,4],[11,12,5,3],[32,33,5,3],[33,12,5,3],[11,33,5,3]],
      [[20,13,3,5],[26,30,3,5],[13,25,5,3],[30,18,5,3]],
    ][safe];
    if(safe===0){
      r(ctx,p[2]??p[1],21,21,6,6);
      r(ctx,p[1],19,23,10,2);
      return;
    }
    pts(ctx,p[0],rays.map(([x,y,w,h])=>[x-1,y+1,w+2,h]));
    pts(ctx,p[1],rays);
    pts(ctx,p[2]??p[1],rays.map(([x,y,w,h])=>[x+1,y,Math.max(1,w-2),1]));
    r(ctx,p[p.length-1],22,22,4,4);
  });
}

export function getParticleFxTexture(kind="steel",variant=0,age=0){
  const p=PALETTES[kind]??PALETTES.steel;
  const safeAge=Math.max(0,Math.min(2,age|0));
  return texture("particle:"+kind+":"+variant+":"+safeAge,8,8,(ctx)=>{
    const size=safeAge===0?3:safeAge===1?2:1;
    const x=2+(variant%3),y=2+((variant>>1)%3);
    r(ctx,p[Math.min(p.length-1,safeAge+1)],x,y,size,size);
    if(safeAge===0&&p.length>2)r(ctx,p[p.length-1],x+1,y,1,1);
  });
}

export function getSanctumFxTexture(frame=0){
  const safe=Math.max(0,Math.min(7,frame|0));
  return texture("sanctum:"+safe,80,80,(ctx)=>{
    const p=PALETTES.sanctum;
    const rings=[
      6,10,15,20,25,30,35,39
    ];
    const radius=rings[safe];
    const cx=40,cy=40;
    const cells=[];
    for(let a=0;a<16;a++){
      const angle=(a/16)*Math.PI*2;
      const x=Math.round(cx+Math.cos(angle)*radius);
      const y=Math.round(cy+Math.sin(angle)*radius*0.58);
      cells.push([x-2,y-1,4,3]);
    }
    pts(ctx,p[0],cells.map(([x,y,w,h])=>[x-1,y+1,w+2,h]));
    pts(ctx,p[1],cells);
    if(safe>=2&&safe<=5){
      pts(ctx,p[2],[[39,7,3,10],[39,63,3,10],[7,39,10,3],[63,39,10,3]]);
    }
  });
}
