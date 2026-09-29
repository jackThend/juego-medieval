import * as THREE from "three";

function createSkyDome() {
  const geometry = new THREE.SphereGeometry(44, 24, 12);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x0d1622) },
      horizonColor: { value: new THREE.Color(0x182720) },
      bottomColor: { value: new THREE.Color(0x080d0c) },
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

        float grain = (hash(floor(gl_FragCoord.xy / 3.0)) - 0.5) * 0.009;
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
  scene.background = new THREE.Color(0x090e0d);
  scene.fog = new THREE.FogExp2(0x111a17, 0.027);
  const sky = createSkyDome();
  scene.add(sky);

  const key = new THREE.DirectionalLight(0x9fc6ee, 1.55);
  key.position.set(-8, 13, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -17;
  key.shadow.camera.right = 17;
  key.shadow.camera.top = 17;
  key.shadow.camera.bottom = -17;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 46;
  key.shadow.bias = -0.00055;
  key.shadow.normalBias = 0.035;
  scene.add(key);

  const fill = new THREE.HemisphereLight(0x55738a, 0x121812, 0.62);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x7eaee1, 1.65);
  rim.position.set(9, 10, -12);
  scene.add(rim);

  const ambient = new THREE.AmbientLight(0x1d2a24, 0.12);\n  scene.add(ambient);

  const heroTarget = new THREE.Object3D();
  scene.add(heroTarget);

  const heroSpot = new THREE.SpotLight(0xa9d5ff, 3.5, 13, Math.PI * 0.22, 0.78, 1.7);
  heroSpot.position.set(4.5, 9.5, 4.5);
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
