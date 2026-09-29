import * as THREE from "three";

function createSkyDome(){
  const geometry=new THREE.SphereGeometry(44,24,12);
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,
    depthWrite:false,
    fog:false,
    toneMapped:false,
    uniforms:{
      topColor:{value:new THREE.Color(0x162439)},
      horizonColor:{value:new THREE.Color(0x263a33)},
      bottomColor:{value:new THREE.Color(0x0f1815)},
    },
    vertexShader:/* glsl */ \`
      varying vec3 vWorldPosition;
      void main(){
        vec4 worldPosition=modelMatrix*vec4(position,1.0);
        vWorldPosition=worldPosition.xyz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    \`,
    fragmentShader:/* glsl */ \`
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;

      void main(){
        float h=normalize(vWorldPosition).y;
        float lower=clamp((h+0.62)/0.64,0.0,1.0);
        float upper=clamp((h+0.02)/0.74,0.0,1.0);

        // Bandas deliberadas en vez de gradiente fotográfico.
        lower=floor(lower*7.0+0.5)/7.0;
        upper=floor(upper*7.0+0.5)/7.0;

        vec3 color=mix(bottomColor,horizonColor,lower);
        color=mix(color,topColor,upper);
        gl_FragColor=vec4(color,1.0);
      }
    \`,
  });

  const sky=new THREE.Mesh(geometry,material);
  sky.position.y=-8;
  return sky;
}

export function createGameScene(){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x101816);
  scene.fog=null;

  const sky=createSkyDome();
  scene.add(sky);

  // Desde esta fase la presentación no depende de luces físicas de Three.js.
  // Tiles, personajes, props y FX son arte pixelado con iluminación pintada.
  scene.userData.artDirection={
    skyMaterial:sky.material,
  };

  return scene;
}
