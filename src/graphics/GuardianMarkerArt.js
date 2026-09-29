import * as THREE from "three";

const cache=new Map();

function texture(kind){
  if(cache.has(kind))return cache.get(kind);
  const canvas=document.createElement("canvas");
  canvas.width=40;canvas.height=40;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.imageSmoothingEnabled=false;
  const put=(c,x,y,w=1,h=1)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};

  if(kind==="boss"){
    const dark="rgba(117,38,31,.34)",mid="rgba(211,79,51,.68)",hot="rgba(255,150,91,.92)";
    const ring=[
      [17,3,6,2],[11,5,6,2],[23,5,6,2],[7,9,5,2],[28,9,5,2],
      [5,14,3,5],[32,14,3,5],[5,22,3,5],[32,22,3,5],
      [8,29,5,2],[27,29,5,2],[13,32,5,2],[22,32,5,2],[18,34,4,2],
    ];
    ring.forEach(p=>put(dark,...p));
    [[18,4,4,1],[12,6,5,1],[24,6,5,1],[8,10,4,1],[29,10,4,1],[6,15,1,4],[33,15,1,4],
     [6,23,1,4],[33,23,1,4],[9,29,4,1],[28,29,4,1],[14,32,4,1],[23,32,4,1]].forEach(p=>put(mid,...p));
    put(hot,19,4,2,1);put(hot,6,17,1,2);put(hot,33,17,1,2);
  }else{
    const dark="rgba(122,46,35,.20)",mid="rgba(236,91,55,.48)",hot="rgba(255,172,96,.76)";
    [[18,4,4,2],[10,8,5,2],[25,8,5,2],[6,16,4,2],[30,16,4,2],[9,28,5,2],[26,28,5,2],[17,33,6,2]].forEach(p=>put(dark,...p));
    [[18,5,4,1],[11,9,4,1],[26,9,4,1],[7,17,3,1],[31,17,3,1],[10,28,4,1],[27,28,4,1],[18,33,4,1]].forEach(p=>put(mid,...p));
    put(hot,19,5,2,1);
  }

  const t=new THREE.CanvasTexture(canvas);
  t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;
  cache.set(kind,t);return t;
}

export function createGuardianMarker(kind="boss",size=1.7){
  const material=new THREE.MeshBasicMaterial({
    map:texture(kind),transparent:true,depthWrite:false,depthTest:false,toneMapped:false,
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material);
  mesh.rotation.x=-Math.PI/2;
  mesh.position.y=0.03;
  return mesh;
}
