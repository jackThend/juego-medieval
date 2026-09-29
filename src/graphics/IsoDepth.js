export const ISO_RENDER_BASE = 10000;

export function isoRenderOrder(x, z, y = 0, layer = 0) {
  // La cámara está en +X/+Z. Cuanto mayor x+z, más cerca del observador.
  // El factor grande deja espacio para capas locales sin romper el orden global.
  return ISO_RENDER_BASE + Math.round((x + z) * 96 + y * 18) + layer;
}
