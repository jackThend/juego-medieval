import * as THREE from "three";

const cache=new Map();

function makeTexture(kind){
  if(cache.has(kind))return cache.get(kind);

  const canvas=document.createElement("canvas");
  canvas.width=40;
  canvas.height=40;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.imageSmoothingEnabled=false;

  const put=(c,x,y,w=1,h=1)=>{
    ctx.fillStyle=c;
    ctx.fillRect(x,y,w,h);
  };

  const palette=kind==="shrine"
    ? ["rgba(114,94,49,.30)","rgba(207,174,91,.70)","rgba(255,230,152,.95)"]
    : ["rgba(78,92,83,.28)","rgba(174,193,150,.68)","rgba(232,231,180,.92)"];

  const cells=[
    [17,4,6,2],[11,6,6,2],[23,6,6,2],
    [7,10,5,2],[28,10,5,2],
    [5,15,3,5],[32,15,3,5],
    [5,22,3,5],[32,22,3,5],
    [8,29,5,2],[27,29,5,2],
    [13,32,5,2],[22,32,5,2],
    [18,34,4,2],
  ];

  cells.forEach(([x,y,w,h])=>put(palette[0],x,y,w,h));

  const bright=[
    [18,5,4,1],[12,7,5,1],[24,7,5,1],
    [8,11,4,1],[29,11,4,1],
    [6,16,1,4],[33,16,1,4],
    [6,23,1,4],[33,23,1,4],
    [9,29,4,1],[28,29,4,1],
    [14,32,4,1],[23,32,4,1],
  ];
  bright.forEach(([x,y,w,h])=>put(palette[1],x,y,w,h));

  put(palette[2],19,5,2,1);
  put(palette[2],6,18,1,2);
  put(palette[2],33,18,1,2);

  if(kind==="shrine"){
    // open circle + vertical line, same sanctuary symbol used elsewhere.
    put(palette[1],19,14,2,13);
    put(palette[1],15,15,4,2);
    put(palette[1],21,15,4,2);
    put(palette[1],13,17,2,7);
    put(palette[1],25,17,2,7);
    put(palette[1],15,24,4,2);
    put(palette[1],21,24,4,2);
    put(palette[2],19,16,2,9);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  cache.set(kind,texture);
  return texture;
}

export function createInteractionMarker(kind="object",size=1){
  const material=new THREE.MeshBasicMaterial({
    map:makeTexture(kind),
    transparent:true,
    depthWrite:false,
    depthTest:false,
    toneMapped:false,
  });
  const marker=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material);
  marker.rotation.x=-Math.PI/2;
  marker.position.y=0.032;
  marker.visible=false;
  return marker;
}
