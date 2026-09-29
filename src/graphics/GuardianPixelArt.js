import * as THREE from "three";

const cache = new Map();

export const GUARDIAN_ANIMATION = Object.freeze({
  idle: { frames: 4, fps: 2.2 },
  walk: { frames: 6, fps: 6.8 },
  attack: { frames: 10, fps: 14.0 },
  hurt: { frames: 3, fps: 12.0 },
  phase: { frames: 8, fps: 10.0 },
  death: { frames: 8, fps: 6.5 },
});

const P = Object.freeze({
  outline: "#100d12",
  void: "#08070a",
  armor0: "#20282a",
  armor1: "#3e494a",
  armor2: "#64706e",
  armor3: "#8b9590",
  stone0: "#303a38",
  stone1: "#4d5955",
  stone2: "#68736c",
  bone0: "#6f6858",
  bone1: "#a79b7d",
  bone2: "#d5c7a2",
  cloth0: "#35171d",
  cloth1: "#5a232d",
  cloth2: "#7b3036",
  ember0: "#641d1c",
  ember1: "#b33b2a",
  ember2: "#e86b42",
  ember3: "#ffab67",
  ember4: "#ffe0a0",
  corruption: "#d35234",
  black: "#070709",
});

function makeCanvas() {
  const canvas=document.createElement("canvas");
  canvas.width=88;
  canvas.height=104;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.imageSmoothingEnabled=false;
  return {canvas,ctx};
}

function r(ctx,c,x,y,w,h){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function pts(ctx,c,list){ctx.fillStyle=c;for(const [x,y,w=1,h=1] of list)ctx.fillRect(x,y,w,h);}

function linePixels(ctx,color,x0,y0,x1,y1,thickness=1){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0), sx=x0<x1?1:-1;
  const dy=-Math.abs(y1-y0), sy=y0<y1?1:-1;
  let err=dx+dy;
  for(;;){
    r(ctx,color,x0-Math.floor(thickness/2),y0-Math.floor(thickness/2),thickness,thickness);
    if(x0===x1&&y0===y1)break;
    const e2=2*err;
    if(e2>=dy){err+=dy;x0+=sx;}
    if(e2<=dx){err+=dx;y0+=sy;}
  }
}

function mirror(ctx,flag){
  if(!flag)return;
  ctx.translate(88,0);
  ctx.scale(-1,1);
}

function phasePalette(phaseTwo){
  return phaseTwo ? {
    core0:P.ember1,core1:P.ember3,core2:P.ember4,
    cloth:P.cloth2,
  } : {
    core0:P.ember0,core1:P.ember2,core2:P.ember3,
    cloth:P.cloth1,
  };
}

function shadow(ctx,state,frame){
  const wide=state==="attack"?6:state==="death"?8:0;
  r(ctx,"rgba(2,2,4,.56)",17-wide,92,52+wide*2,4);
  r(ctx,"rgba(2,2,4,.27)",22-wide,96,42+wide*2,2);
  if(state==="walk") r(ctx,"rgba(2,2,4,.14)",24+(frame%2?2:-2),90,38,2);
}

function legs(ctx,bob,frame,state,phaseTwo){
  const walk=[[-2,2],[-1,1],[1,-1],[2,-2],[1,-1],[-1,1]][frame%6]??[0,0];
  const moving=state==="walk";
  const speed=phaseTwo?1.35:1;
  const a=moving?Math.round(walk[0]*speed):0;
  const b=moving?Math.round(walk[1]*speed):0;

  r(ctx,P.outline,28+b,67+bob,12,24);
  r(ctx,P.armor0,30+b,69+bob,9,18);
  r(ctx,P.armor1,31+b,69+bob,4,12);
  r(ctx,P.outline,25+b,85+bob,17,8);
  r(ctx,P.stone0,27+b,86+bob,14,6);

  r(ctx,P.outline,48+a,66+bob,12,25);
  r(ctx,P.armor0,50+a,68+bob,9,19);
  r(ctx,P.armor2,51+a,68+bob,4,12);
  r(ctx,P.outline,46+a,85+bob,18,8);
  r(ctx,P.stone1,48+a,86+bob,15,6);

  pts(ctx,P.armor3,[[51+a,69+bob,2,4],[31+b,70+bob,2,3]]);
}

function skirt(ctx,bob,phaseTwo){
  const pal=phasePalette(phaseTwo);
  r(ctx,P.outline,24,57+bob,41,17);
  r(ctx,P.cloth0,27,59+bob,35,13);
  r(ctx,pal.cloth,30,59+bob,28,11);
  pts(ctx,P.cloth0,[[27,69+bob,9,5],[39,71+bob,9,4],[52,68+bob,10,5]]);
}

function torso(ctx,back,bob,phaseTwo,state){
  const pal=phasePalette(phaseTwo);
  const lean=state==="attack"?1:0;
  r(ctx,P.outline,22-lean,34+bob,44,27);
  r(ctx,P.armor0,25-lean,37+bob,38,22);
  r(ctx,P.armor1,27-lean,37+bob,34,20);
  r(ctx,P.armor2,29-lean,38+bob,24,16);

  if(!back){
    // rib cage framing the core
    r(ctx,P.bone0,31,39+bob,4,18);
    r(ctx,P.bone1,32,39+bob,3,16);
    r(ctx,P.bone0,54,39+bob,4,18);
    r(ctx,P.bone1,54,39+bob,3,16);
    r(ctx,P.bone1,34,39+bob,20,3);
    r(ctx,P.bone0,34,54+bob,20,3);

    const coreW=phaseTwo?11:9;
    const coreH=phaseTwo?17:14;
    r(ctx,P.outline,44-Math.floor(coreW/2),41+bob,coreW+2,coreH+2);
    r(ctx,pal.core0,45-Math.floor(coreW/2),42+bob,coreW,coreH);
    r(ctx,pal.core1,47-Math.floor(coreW/2),43+bob,Math.max(4,coreW-4),coreH-3);
    r(ctx,pal.core2,49-Math.floor(coreW/2),45+bob,Math.max(2,coreW-8),coreH-7);
  } else {
    r(ctx,P.stone0,29,39+bob,29,17);
    r(ctx,P.armor2,31,39+bob,10,12);
    r(ctx,P.ember0,43,39+bob,5,17);
    if(phaseTwo) r(ctx,P.ember2,44,40+bob,3,15);
  }

  // asymmetrical shoulders
  r(ctx,P.outline,13,34+bob,18,14);
  r(ctx,P.stone0,16,36+bob,14,10);
  r(ctx,P.stone2,17,36+bob,8,6);
  pts(ctx,P.bone0,[[11,33+bob,5,8],[8,29+bob,5,8]]);

  r(ctx,P.outline,60,35+bob,14,12);
  r(ctx,P.armor0,62,37+bob,11,8);
  r(ctx,P.armor2,63,37+bob,6,5);
  pts(ctx,P.bone0,[[72,34+bob,4,7]]);
}

function head(ctx,back,bob,frame,phaseTwo,state){
  const pal=phasePalette(phaseTwo);
  const jitter=state==="hurt"?(frame===1?1:-1):0;

  r(ctx,P.outline,31+jitter,13+bob,29,24);
  r(ctx,P.armor0,34+jitter,16+bob,24,19);
  r(ctx,P.armor1,35+jitter,16+bob,20,15);
  r(ctx,P.armor2,37+jitter,17+bob,14,10);

  if(!back){
    r(ctx,P.void,35+jitter,27+bob,21,5);
    r(ctx,P.black,36+jitter,28+bob,19,3);
    r(ctx,pal.core1,38+jitter,29+bob,5,2);
    r(ctx,pal.core1,49+jitter,29+bob,5,2);
    if(phaseTwo){
      r(ctx,pal.core2,39+jitter,29+bob,2,2);
      r(ctx,pal.core2,50+jitter,29+bob,2,2);
    }
  }else{
    r(ctx,P.armor0,36+jitter,27+bob,19,6);
  }

  // broken crown / horns
  pts(ctx,P.bone0,[
    [28+jitter,12+bob,6,8],[24+jitter,7+bob,6,8],[21+jitter,3+bob,5,7],
    [57+jitter,11+bob,6,8],[61+jitter,6+bob,5,8],
  ]);
  pts(ctx,P.bone2,[
    [25+jitter,8+bob,2,5],[22+jitter,4+bob,2,4],[61+jitter,7+bob,2,5],
  ]);

  // vertical corruption crown
  const crownH=phaseTwo?12:8;
  r(ctx,P.outline,43+jitter,5+bob,8,crownH+3);
  r(ctx,pal.core0,45+jitter,6+bob,5,crownH);
  r(ctx,pal.core1,46+jitter,6+bob,3,crownH-2);
  if(phaseTwo)r(ctx,pal.core2,47+jitter,7+bob,1,crownH-4);
}

function claw(ctx,bob,frame,state){
  const attack=state==="attack";
  const reach=attack&&frame>=4&&frame<=7?3:0;
  r(ctx,P.outline,9-reach,44+bob,14,25);
  r(ctx,P.stone0,11-reach,46+bob,11,21);
  r(ctx,P.stone1,12-reach,46+bob,6,15);
  r(ctx,P.outline,8-reach,64+bob,16,10);
  r(ctx,P.stone0,10-reach,65+bob,12,8);
  pts(ctx,P.bone1,[
    [6-reach,71+bob,4,10],[12-reach,73+bob,4,11],[18-reach,72+bob,4,10],
  ]);
  pts(ctx,P.bone2,[
    [7-reach,72+bob,2,5],[13-reach,74+bob,2,5],[19-reach,73+bob,2,5],
  ]);
}

function weapon(ctx,bob,frame,state,phaseTwo){
  const pal=phasePalette(phaseTwo);
  const attack=state==="attack";
  const poses=[
    [70,44,73,82],
    [70,42,73,75],
    [68,40,64,17],
    [66,39,56,12],
    [67,42,78,23],
    [69,45,84,39],
    [70,48,83,58],
    [70,49,79,73],
    [70,47,76,81],
    [70,45,74,84],
  ];
  let [hx,hy,tx,ty]=attack?poses[frame%10]:[70,45,75,85];
  hy+=bob;ty+=bob;

  // arm
  r(ctx,P.outline,hx-7,hy-8,11,22);
  r(ctx,P.armor0,hx-5,hy-6,8,18);
  r(ctx,P.armor2,hx-4,hy-5,3,9);

  // haft
  linePixels(ctx,P.outline,hx,hy,tx,ty,5);
  linePixels(ctx,P.armor2,hx,hy,tx,ty,3);

  // hammer/axe head
  const dx=Math.sign(tx-hx)||1, dy=Math.sign(ty-hy)||1;
  const headX=tx-7*dx, headY=ty-5*dy;
  r(ctx,P.outline,headX-6,headY-6,18,16);
  r(ctx,pal.core0,headX-4,headY-4,14,12);
  r(ctx,pal.core1,headX-2,headY-3,9,9);
  r(ctx,pal.core2,headX,headY-2,4,6);
  pts(ctx,P.bone1,[[headX+9,headY-3,6,4],[headX+11,headY-5,4,3]]);
}

function cape(ctx,back,bob,frame,phaseTwo,state){
  const wave=[0,1,2,1,0,-1][frame%6]??0;
  const width=phaseTwo?29:25;
  if(back){
    r(ctx,P.outline,29,38+bob,width,28);
    r(ctx,P.cloth0,31,40+bob,width-4,24);
    r(ctx,phaseTwo?P.cloth2:P.cloth1,33,41+bob,9,20);
    pts(ctx,P.cloth0,[[31,61+bob+wave,8,5],[42,63+bob-wave,8,4],[51,60+bob+wave,6,5]]);
  }else{
    r(ctx,P.outline,27,43+bob,7,22);
    r(ctx,P.cloth0,29,45+bob,5,18);
  }
}

function shards(ctx,frame,phaseTwo,state){
  const pal=phasePalette(phaseTwo);
  const extra=phaseTwo?2:0;
  const offset=(frame%4)-1;
  const items=[
    [18-offset,22,4,6],[67+offset,20,4,6],[14,38+offset,3,5],[72,34-offset,3,5],
    [24,8+offset,3,4],[63,8-offset,3,4],
  ];
  for(let i=0;i<4+extra;i++){
    const [x,y,w,h]=items[i];
    r(ctx,i%2?P.bone1:pal.core1,x,y,w,h);
    if(phaseTwo&&i%2===0)r(ctx,pal.core2,x+1,y+1,Math.max(1,w-2),Math.max(1,h-2));
  }

  if(state==="phase"){
    const spread=Math.min(9,frame*2);
    pts(ctx,pal.core1,[
      [8-spread,28,4,4],[76+spread,27,4,4],[17-spread,12,3,3],[68+spread,10,3,3],
    ]);
  }
}

function phaseBurst(ctx,frame){
  const radii=[
    [[39,48,10,4]],
    [[33,44,22,4],[36,38,16,3]],
    [[25,40,38,4],[30,32,28,3],[34,26,20,3]],
    [[18,36,52,4],[23,28,42,3],[29,20,30,3]],
    [[12,32,64,4],[19,24,50,3],[26,16,36,3]],
    [[18,36,52,4],[23,28,42,3],[29,20,30,3]],
    [[25,40,38,4],[30,32,28,3]],
    [[33,44,22,4]],
  ];
  pts(ctx,"rgba(255,121,73,.24)",radii[frame%8]??[]);
  if(frame>=3&&frame<=5) pts(ctx,P.ember3,[[7,49,4,3],[77,47,4,3],[15,22,3,3],[70,19,3,3]]);
}

function deathPose(ctx,direction,frame,phaseTwo){
  const mirrored=direction==="west";
  ctx.save();
  mirror(ctx,mirrored);
  shadow(ctx,"death",frame);

  if(frame<=2){
    const bob=frame;
    cape(ctx,direction==="north",bob,frame,phaseTwo,"hurt");
    legs(ctx,bob,0,"hurt",phaseTwo);
    skirt(ctx,bob,phaseTwo);
    torso(ctx,direction==="north",bob,phaseTwo,"hurt");
    claw(ctx,bob,frame,"hurt");
    weapon(ctx,bob,0,"hurt",phaseTwo);
    head(ctx,direction==="north",bob,frame,phaseTwo,"hurt");
  }else{
    const p=frame-3;
    const y=62+p*4;
    r(ctx,P.outline,12,y,60,18);
    r(ctx,P.armor0,16,y+2,35,13);
    r(ctx,P.stone1,18,y+2,14,7);
    r(ctx,P.cloth0,43,y+8,25,7);
    r(ctx,P.bone1,53,y-5,13,10);
    r(ctx,P.armor1,55,y-3,9,7);
    linePixels(ctx,P.outline,27,y+6,5,y+15,5);
    linePixels(ctx,P.stone1,27,y+6,5,y+15,3);
    linePixels(ctx,P.outline,47,y+5,82,y+13,5);
    linePixels(ctx,P.armor2,47,y+5,82,y+13,3);

    // core collapses into embers
    const coreX=38+p*2;
    r(ctx,P.ember1,coreX,y+5,8,5);
    r(ctx,P.ember3,coreX+2,y+5,4,3);
    if(frame>=5){
      pts(ctx,P.ember2,[[34,y-4,3,3],[46,y-7,3,3],[52,y-2,2,2],[29,y-1,2,2]]);
    }
  }

  ctx.restore();
}

function renderGuardian(ctx,state,direction,frame,phaseTwo){
  if(state==="death"){
    deathPose(ctx,direction,frame,phaseTwo);
    return;
  }

  const mirrored=direction==="west";
  const back=direction==="north";

  ctx.save();
  mirror(ctx,mirrored);

  let bob=0;
  if(state==="idle") bob=[0,0,1,0][frame%4]??0;
  else if(state==="walk") bob=[0,1,1,0,1,0][frame%6]??0;
  else if(state==="attack") bob=[0,0,-1,-1,0,1,1,0,0,0][frame%10]??0;
  else if(state==="hurt") bob=[0,1,0][frame%3]??0;
  else if(state==="phase") bob=[0,-1,-2,-2,-1,0,1,0][frame%8]??0;

  shadow(ctx,state,frame);
  cape(ctx,back,bob,frame,phaseTwo,state);
  legs(ctx,bob,frame,state,phaseTwo);
  skirt(ctx,bob,phaseTwo);
  torso(ctx,back,bob,phaseTwo,state);
  claw(ctx,bob,frame,state);
  weapon(ctx,bob,frame,state,phaseTwo);
  head(ctx,back,bob,frame,phaseTwo,state);
  shards(ctx,frame,phaseTwo,state);

  if(state==="phase")phaseBurst(ctx,frame);

  if(state==="attack"&&frame>=4&&frame<=6){
    const arc=frame===4?[[72,19,4,3],[77,23,4,3],[81,28,4,3]]:
      frame===5?[[78,25,4,3],[82,31,4,3],[83,38,3,4]]:
      [[82,38,3,4],[80,44,4,3],[76,49,4,3]];
    pts(ctx,"rgba(255,129,76,.48)",arc);
  }

  if(state==="hurt"){
    ctx.globalCompositeOperation="source-atop";
    ctx.fillStyle=frame===1?"rgba(255,120,80,.28)":"rgba(255,120,80,.14)";
    ctx.fillRect(0,0,88,104);
  }

  ctx.restore();
}

export function getGuardianPixelTexture(state="idle",direction="south",frame=0,phaseTwo=false){
  const def=GUARDIAN_ANIMATION[state]??GUARDIAN_ANIMATION.idle;
  const safe=Math.max(0,Math.min(def.frames-1,frame|0));
  const key=state+":"+direction+":"+safe+":"+(phaseTwo?1:0);
  if(cache.has(key))return cache.get(key);

  const {canvas,ctx}=makeCanvas();
  renderGuardian(ctx,state,direction,safe,phaseTwo);

  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  cache.set(key,texture);
  return texture;
}

export function guardianDirectionFromFacing(facing){
  if(Math.abs(facing.x)>Math.abs(facing.z))return facing.x>=0?"east":"west";
  return facing.z>=0?"south":"north";
}

export function getGuardianAnimationFrame(state,time,{
  attackProgress=0,
  hurtProgress=0,
  phaseProgress=0,
  deathProgress=0,
}={}){
  const def=GUARDIAN_ANIMATION[state]??GUARDIAN_ANIMATION.idle;
  if(state==="attack")return Math.min(def.frames-1,Math.floor(attackProgress*def.frames));
  if(state==="hurt")return Math.min(def.frames-1,Math.floor(hurtProgress*def.frames));
  if(state==="phase")return Math.min(def.frames-1,Math.floor(phaseProgress*def.frames));
  if(state==="death")return Math.min(def.frames-1,Math.floor(deathProgress*def.frames));
  return Math.floor(time*def.fps)%def.frames;
}
