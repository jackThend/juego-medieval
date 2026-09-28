# Ruinas del Ocaso

**Ruinas del Ocaso** es una microaventura medieval isométrica 3D con acabado pixel-art, construida con **Three.js + Rapier3D + Vite** bajo una regla estricta de **Zero External Assets**.

No se cargan modelos, imágenes, texturas ni audios externos. El caballero, el Guardián Corrupto, las ruinas, el cementerio, la vegetación, las partículas, las texturas y todos los sonidos se generan íntegramente por código.

## Juego

La experiencia tiene un ciclo completo y corto:

1. Explorar las ruinas.
2. Encontrar y derrotar al **Guardián Corrupto**.
3. Alcanzar el santuario.
4. Activar el altar y despertar las ruinas.

El combate incluye vida, daño, knockback, ventanas de impacto, stagger, rodada con invulnerabilidad, IA de persecución, ataques telegráficos y una segunda fase del Guardián.

## Controles

- `WASD` o flechas: mover.
- `Shift`: correr.
- `Espacio`: rodar / dash.
- `J`: atacar.
- `E`: interactuar con el altar.
- `R`: reiniciar después de victoria o derrota.
- Gamepad y controles táctiles básicos también están contemplados.

## Desarrollo local

```bash
npm install
npm run check
npm run dev
```

Build de producción:

```bash
npm run build
npm run preview
```

## Arquitectura

```text
src/
├─ audio/
│  └─ ProceduralAudio.js
├─ combat/
│  └─ CombatSystem.js
├─ core/
│  ├─ CameraRig.js
│  ├─ Engine.js
│  ├─ GameScene.js
│  ├─ PixelArtPass.js
│  └─ PostProcessing.js
├─ effects/
│  └─ EffectSystem.js
├─ entities/
│  ├─ CorruptedGuardian.js
│  └─ Knight.js
├─ game/
│  └─ GameDirector.js
├─ graphics/
│  ├─ Materials.js
│  ├─ ProceduralTextures.js
│  └─ WorldBuilder.js
├─ input/
│  └─ InputManager.js
├─ physics/
│  └─ PhysicsWorld.js
├─ ui/
│  └─ HUD.js
├─ main.js
└─ style.css
```

## Pipeline visual

- `OrthographicCamera` para composición isométrica.
- Render interno deliberadamente bajo, de aproximadamente 240–360 px de alto, ampliado con nearest-neighbor.
- Pixel snapping de cámara para reducir shimmering subpíxel.
- `ACESFilmicToneMapping`, exposición 1.0 y `SRGBColorSpace`.
- `SSAOPass` para contacto y profundidad.
- `UnrealBloomPass` sutil para fuego, ojos, runas y altar.
- Shader final propio con posterización, dithering Bayer 4×4, refuerzo de bordes y viñeta mínima.
- `FogExp2` y niebla procedural para profundidad atmosférica.
- Iluminación de tres puntos: key, fill y rim.
- Sombras `PCFSoftShadowMap`.

## Física y rendimiento

- Rapier3D con timestep fijo de `1/60 s`.
- `KinematicCharacterController` para jugador y enemigo.
- Protección contra spiral-of-death mediante límite de substeps.
- Muros, escombros, hierba y lápidas usan `THREE.InstancedMesh`.
- Geometrías y materiales se reutilizan y nunca se crean dentro del render loop.
- Los colliders de las ruinas son deliberadamente más simples que su representación visual.
- El Guardián deshabilita su collider al morir para no bloquear el recorrido posterior.

## Audio procedural

Todo el audio se sintetiza en tiempo real con Web Audio API:

- pasos;
- espada;
- dash;
- impactos;
- ataques del Guardián;
- transición de fase;
- derrota;
- activación del santuario;
- viento y drones ambientales.

## Zero External Assets

`npm run check` comprueba que no existan archivos de imagen, modelo o audio convencionales y valida que los imports locales apunten a archivos reales.

## Despliegue

`vite.config.js` usa rutas relativas (`base: "./"`), por lo que el mismo `dist/` funciona tanto en un dominio raíz como dentro de una subcarpeta de GitHub Pages.

El repositorio incluye `.github/workflows/deploy-pages.yml` para compilar y publicar `dist/` automáticamente al hacer push a `main`, una vez habilitado **Settings → Pages → Source: GitHub Actions** en el repositorio.

## Dependencias fijadas

- Three.js `0.186.1`
- `@dimforge/rapier3d-compat` `0.21.0`
- Vite `8.3.1`
