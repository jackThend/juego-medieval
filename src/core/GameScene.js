import * as THREE from "three";

function createSkyDome() {
  const geometry = new THREE.SphereGeometry(44, 24, 12);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x202833) },
      horizonColor: { value: new THREE.Color(0x4d4d3e) },
      bottomColor: { value: new THREE.Color(0x262a22) },
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

        float grain = (hash(floor(gl_FragCoord.xy / 2.0)) - 0.5) * 0.018;
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
  scene.background = new THREE.Color(0x242820);
  scene.fog = new THREE.FogExp2(0x262b24, 0.036);
  scene.add(createSkyDome());

  const key = new THREE.DirectionalLight(0xffddb0, 3.35);
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

  const fill = new THREE.HemisphereLight(0x8292a9, 0x59472f, 1.55);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x9fc7ff, 2.1);
  rim.position.set(9, 10, -12);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0x354039, 0.14));

  return scene;
}
