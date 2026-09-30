import * as THREE from "three";

const cache=new Map();

function make(key,w,h,draw,opaque=false){
  if(cache.has(key))return cache.get(key);
  const canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d",{alpha:!opaque});
  ctx.imageSmoothingEnabled=false;
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

function r(ctx,c,x,y,w=1,h=1){
  ctx.fillStyle=c;
  ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
function pts(ctx,c,list){
  ctx.fillStyle=c;
  for(const [x,y,w=1,h=1] of list)ctx.fillRect(x,y,w,h);
}

export function getSanctuaryBackdropTexture(){
  return make("backdrop",128,128,(ctx,w,h)=>{
    r(ctx,"#0b1411",0,0,w,h);
    let s=0x6a09e667;
    const rnd=()=>{
      s=(s*1664525+1013904223)>>>0;
      return s/4294967296;
    };

    for(let i=0;i<420;i++){
      const x=Math.floor(rnd()*w);
      const y=Math.floor(rnd()*h);
      const edge=Math.min(x,y,w-x,h-y);
      const c=edge<18
        ?(rnd()>.5?"#0a120f":"#0d1812")
        :(rnd()>.6?"#122019":"#101b16");
      r(ctx,c,x,y,1+Math.floor(rnd()*4),1+Math.floor(rnd()*3));
    }

    // Restos de losas casi tragados por el bosque.
    for(let i=0;i<34;i++){
      const x=8+Math.floor(rnd()*(w-20));
      const y=8+Math.floor(rnd()*(h-20));
      r(ctx,"#18231f",x,y,4+Math.floor(rnd()*8),2);
      if(i%3===0)r(ctx,"#202a25",x+1,y,2,1);
    }
  },true);
}

export function getFloorCompositionTexture(kind){
  return make("floor:"+kind,96,96,(ctx)=>{
    if(kind==="medallion"){
      const dark="rgba(34,42,39,.72)";
      const mid="rgba(103,100,79,.60)";
      const gold="rgba(154,130,76,.54)";
      const cells=[
        [43,16,10,3],[31,19,12,3],[53,19,12,3],
        [23,25,9,3],[64,25,9,3],
        [18,34,7,5],[71,34,7,5],
        [16,45,6,8],[74,45,6,8],
        [19,58,7,5],[70,58,7,5],
        [25,67,9,3],[62,67,9,3],
        [34,73,12,3],[50,73,12,3],[43,77,10,3],
      ];
      pts(ctx,dark,cells.map(([x,y,w,h])=>[x-2,y+2,w+4,h]));
      pts(ctx,mid,cells);
      r(ctx,gold,46,27,4,38);
      pts(ctx,gold,[[35,31,11,3],[50,31,11,3],[29,35,5,20],[62,35,5,20],[34,57,12,3],[50,57,12,3]]);
    }else if(kind==="arena"){
      const stain="rgba(58,25,24,.43)";
      const ember="rgba(128,45,31,.26)";
      pts(ctx,stain,[
        [30,28,36,5],[23,35,51,5],[18,43,60,7],[21,51,54,8],[28,60,40,6],
      ]);
      pts(ctx,ember,[
        [31,35,7,2],[56,31,5,2],[25,48,8,2],[64,49,6,2],[42,59,9,2],
      ]);
      pts(ctx,"rgba(23,27,27,.78)",[
        [18,43,8,2],[25,41,2,8],[70,46,8,2],[68,47,2,9],
        [39,29,2,8],[37,35,5,2],[51,61,2,9],[49,66,5,2],
      ]);
    }else if(kind==="moon"){
      const c0="rgba(105,139,154,.045)";
      const c1="rgba(139,169,179,.065)";
      const c2="rgba(176,198,197,.075)";
      pts(ctx,c0,[[17,26,57,34],[10,35,72,18],[26,18,43,50]]);
      pts(ctx,c1,[[25,29,45,26],[18,37,60,12],[35,23,28,39]]);
      pts(ctx,c2,[[34,34,30,15],[41,27,17,30]]);
      // Mordiscos duros: evita que parezca un gradiente.
      ctx.clearRect(17,26,9,7);
      ctx.clearRect(68,31,8,9);
      ctx.clearRect(26,53,12,7);
      ctx.clearRect(58,20,9,6);
    }else if(kind==="threshold"){
      const dark="rgba(27,35,33,.72)";
      const mid="rgba(88,92,80,.58)";
      const light="rgba(126,123,98,.38)";
      pts(ctx,dark,[[9,40,78,5],[14,33,68,4],[18,47,60,4]]);
      pts(ctx,mid,[[13,38,19,3],[36,38,22,3],[63,38,18,3]]);
      pts(ctx,light,[[15,37,12,1],[38,37,13,1],[65,37,9,1]]);
    }
  });
}

export function getFrameSpriteTexture(kind,variant=0){
  return make("frame:"+kind+":"+variant,kind==="tree"?80:84,kind==="tree"?120:104,(ctx,w,h)=>{
    if(kind==="tree"){
      const trunk0="#151713",trunk1="#2a2820";
      const leaf0="#08120e",leaf1="#102218",leaf2="#1c3322",leaf3="#2b482e";
      r(ctx,"rgba(0,0,0,.40)",18,h-9,45,5);

      // Trunk with irregular, non-symmetric silhouette.
      r(ctx,trunk0,35,48,12,64);
      r(ctx,trunk1,38,50,5,57);
      pts(ctx,trunk0,[
        [21,58,18,7],[42,64,22,7],[15,46,24,7],[44,39,19,6],
        [25,31,10,24],[52,25,8,20],
      ]);

      const crown=[
        [8,28,62,23],[13,17,54,20],[22,8,40,18],[4,39,65,20],[18,53,50,16],
      ];
      pts(ctx,leaf0,crown);
      pts(ctx,leaf1,[
        [13,29,48,13],[18,19,42,12],[27,10,29,11],[9,42,51,12],[24,54,37,10],
      ]);
      pts(ctx,leaf2,[
        [18,30,16,6],[40,23,17,7],[30,13,15,6],[12,44,18,7],[42,47,16,7],
      ]);
      if(variant%2===0)pts(ctx,leaf3,[[20,31,8,3],[43,24,7,3],[33,14,6,3],[15,45,8,3]]);
      else pts(ctx,leaf3,[[27,22,7,3],[49,33,7,3],[24,50,8,3],[37,12,6,3]]);
    }else{
      const out="#0b1112",deep="#172123",stone="#283437",hi="#3c4847";
      r(ctx,"rgba(0,0,0,.40)",7,h-9,70,5);
      r(ctx,out,8,33,67,65);
      r(ctx,deep,11,36,61,59);
      r(ctx,stone,15,38,24,55);
      r(ctx,hi,17,39,8,45);
      r(ctx,deep,46,51,23,42);

      // Collapsed top silhouette.
      ctx.clearRect(7,25,17,19);
      ctx.clearRect(55,27,25,18);
      ctx.clearRect(29,30,11,12);
      pts(ctx,out,[[20,29,12,6],[31,34,12,6],[44,30,14,6],[54,40,12,6]]);
      pts(ctx,hi,[[18,42,7,2],[17,58,6,2],[48,57,7,2]]);
      pts(ctx,"#1e3929",[[12,78,12,4],[16,82,8,4],[57,69,10,4]]);
    }
  });
}
