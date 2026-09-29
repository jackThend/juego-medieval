import * as THREE from "three";

function createSkyDome() {
  const geometry = new THREE.SphereGeometry(44, 24, 12);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x162439) },
      horizonColor: { value: new THREE.Color(0x263a33) },
      bottomColor: { value: new THREE.Color(0x0f1815) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        float h = normalize(vWorldPosition).y;
        float upper = smoothstep(-0.05, 0.72, h);
        float lower = smoothstep(-0.65, 0.02, h);
        vec3 color = mix(bottomColor, horizonColor, lower);
        color = mix(color, topColor, upper);
        float grain = (hash(floor(gl_FragCoord.xy / 3.0)) - 0.5) * 0.006;
        gl_FragColor = vec4(color + grain, 1.0);
      }
    `,
  });

  const sky = new THREE.Mesh(geometry, material);
  sky.position.y = -8;
  return sky;
}

export function createGameScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101816);
  scene.fog = new THREE.FogExp2(0x20302b, 0.0145);

  const sky = createSkyDome();
  scene.add(sky);

  const key = new THREE.DirectionalLight(0xb7d2ea, 2.05);
  key.position.set(-8, 13, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -17;
  key.shadow.camera.right = 17;
  key.shadow.camera.top = 17;
  key.shadow.camera.bottom = -17;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 46;
  key.shadow.bias = -0.00045;
  key.shadow.normalBias = 0.045;
  scene.add(key);

  // Esta luz es la base visual de la noche. Debe mantener color y detalle
  // incluso dentro de las sombras de la luz direccional.
  const fill = new THREE.HemisphereLight(0x87a6b8, 0x3a4d42, 1.62);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x8bbbe8, 1.48);
  rim.position.set(9, 10, -12);
  scene.add(rim);

  const ambient = new THREE.AmbientLight(0x52665a, 0.44);
  scene.add(ambient);

  const heroTarget = new THREE.Object3D();
  scene.add(heroTarget);

  // Acento sutil para separar armadura y silueta. Ya no ilumina el mapa como
  // un cono de linterna.
  const heroSpot = new THREE.SpotLight(0xc0e1ff, 1.35, 11, Math.PI * 0.30, 0.9, 1.35);
  heroSpot.position.set(3.8, 8.5, 3.8);
  heroSpot.target = heroTarget;
  heroSpot.castShadow = false;
  scene.add(heroSpot);

  scene.userData.artDirection = {
    key,
    fill,
    rim,
    ambient,
    heroSpot,
    heroTarget,
    skyMaterial: sky.material,
  };

  return scene;
}
