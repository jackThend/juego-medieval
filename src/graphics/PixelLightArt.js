import * as THREE from "three";

const cache=new Map();

function make(key,w,h,draw){
  if(cache.has(key))return cache.get(key);
  const canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.imageSmoothingEnabled=false;
  draw(ctx);
  const t=new THREE.CanvasTexture(canvas);
  t.magFilter=THREE.NearestFilter;
  t.minFilter=THREE.NearestFilter;
  t.generateMipmaps=false;
  t.colorSpace=THREE.SRGBColorSpace;
  t.needsUpdate=true;
  cache.set(key,t);
  return t;
}

function r(ctx,c,x,y,w,h){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

export function getPixelLightPool(kind="warm",frame=0,active=false){
  const f=frame%4;
  return make("pool:"+kind+":"+f+":"+(active?1:0),48,32,(ctx)=>{
    const warm=kind==="sanctum"&&active;
    const c0=warm?"rgba(255,226,151,.05)":"rgba(255,154,72,.035)";
    const c1=warm?"rgba(255,235,176,.10)":"rgba(255,180,91,.07)";
    const c2=warm?"rgba(255,244,199,.16)":"rgba(255,207,125,.115)";
    const wobble=[0,1,0,-1][f];
    r(ctx,c0,4,10+wobble,40,12);
    r(ctx,c0,8,7+wobble,32,18);
    r(ctx,c1,11,10-wobble,26,13);
    r(ctx,c1,15,8+wobble,18,17);
    r(ctx,c2,19,11,10,10);
  });
}

export function getPixelLightHalo(kind="warm",frame=0,active=false){
  const f=frame%4;
  return make("halo:"+kind+":"+f+":"+(active?1:0),32,48,(ctx)=>{
    const sacred=kind==="sanctum"&&active;
    const c0=sacred?"rgba(255,229,159,.045)":"rgba(255,143,65,.03)";
    const c1=sacred?"rgba(255,239,188,.10)":"rgba(255,180,92,.07)";
    const c2=sacred?"rgba(255,247,214,.18)":"rgba(255,215,142,.13)";
    const shift=[0,1,0,-1][f];
    r(ctx,c0,8,8+shift,16,33);
    r(ctx,c0,5,17+shift,22,18);
    r(ctx,c1,10,13-shift,12,25);
    r(ctx,c1,7,21,18,11);
    r(ctx,c2,13,18+shift,6,14);
  });
}
