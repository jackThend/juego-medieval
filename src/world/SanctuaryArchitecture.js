export const ARCH_KIND = Object.freeze({
  WALL_X: "wallX",
  WALL_Z: "wallZ",
  WALL_BROKEN_X: "wallBrokenX",
  WALL_BROKEN_Z: "wallBrokenZ",
  WALL_LOW_X: "wallLowX",
  WALL_LOW_Z: "wallLowZ",
  CORNER: "corner",
  ARCH_X: "archX",
  PILLAR: "pillar",
  STAIRS: "stairs",
  PLATFORM_EDGE: "platformEdge",
  DOOR: "door",
});

function wallLine(kind, start, end, fixed, axis, options = {}) {
  const out = [];
  const step = start <= end ? 1 : -1;
  let index = 0;
  for (let value = start; value !== end + step; value += step) {
    out.push({
      kind,
      col: axis === "x" ? value : fixed,
      row: axis === "x" ? fixed : value,
      variant: (options.variantOffset ?? 0) + (index % 3),
      solid: options.solid ?? true,
      sortOffset: options.sortOffset ?? 0,
    });
    index += 1;
  }
  return out;
}

export const SANCTUARY_ARCHITECTURE = [
  // CAPILLA NORTE -----------------------------------------------------------
  // Muro posterior pesado. El hueco central se reserva para la puerta ritual.
  ...wallLine(ARCH_KIND.WALL_X, 5, 8, 0.55, "x", { variantOffset: 0 }),
  ...wallLine(ARCH_KIND.WALL_X, 11, 14, 0.55, "x", { variantOffset: 1 }),
  { kind: ARCH_KIND.DOOR, col: 9.5, row: 0.52, variant: 0, solid: true, sortOffset: 6 },

  // Muro izquierdo/far-side: continuo para dar sensación de recinto.
  ...wallLine(ARCH_KIND.WALL_Z, 1.5, 5.5, 4.55, "z", { variantOffset: 0 }),

  // Muro derecho/near-side deliberadamente roto: deja ver el interior.
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 14.45, row: 1.5, variant: 0, solid: true },
  { kind: ARCH_KIND.WALL_LOW_Z, col: 14.45, row: 2.5, variant: 1, solid: true },
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 14.45, row: 4.5, variant: 2, solid: true },

  // Frente de la capilla: abre una puerta ceremonial de tres tiles.
  { kind: ARCH_KIND.WALL_X, col: 5.5, row: 5.55, variant: 0, solid: true },
  { kind: ARCH_KIND.WALL_X, col: 6.5, row: 5.55, variant: 1, solid: true },
  { kind: ARCH_KIND.ARCH_X, col: 9.5, row: 5.58, variant: 0, solid: "arch", sortOffset: 8 },
  { kind: ARCH_KIND.WALL_X, col: 12.5, row: 5.55, variant: 1, solid: true },
  { kind: ARCH_KIND.WALL_X, col: 13.5, row: 5.55, variant: 2, solid: true },

  { kind: ARCH_KIND.CORNER, col: 4.55, row: 0.55, variant: 0, solid: true, sortOffset: 4 },
  { kind: ARCH_KIND.CORNER, col: 14.45, row: 0.55, variant: 1, solid: true, sortOffset: 4 },

  // Plataforma del santuario. Es un volumen pintado, no geometría 3D visible.
  { kind: ARCH_KIND.PLATFORM_EDGE, col: 8.25, row: 2.85, variant: 0, solid: false },
  { kind: ARCH_KIND.PLATFORM_EDGE, col: 10.75, row: 2.85, variant: 1, solid: false },
  { kind: ARCH_KIND.STAIRS, col: 9.5, row: 3.3, variant: 0, solid: false, sortOffset: 2 },

  // CLAUSTRO CENTRAL --------------------------------------------------------
  // Muros exteriores rotos: suficientes para definir el lugar sin tapar juego.
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 2.55, row: 6.5, variant: 0, solid: true },
  { kind: ARCH_KIND.WALL_LOW_Z, col: 2.55, row: 7.5, variant: 1, solid: true },
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 2.55, row: 11.5, variant: 2, solid: true },
  { kind: ARCH_KIND.WALL_LOW_Z, col: 2.55, row: 12.5, variant: 0, solid: true },

  { kind: ARCH_KIND.WALL_LOW_Z, col: 16.45, row: 7.5, variant: 2, solid: true },
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 16.45, row: 8.5, variant: 1, solid: true },
  { kind: ARCH_KIND.WALL_LOW_Z, col: 16.45, row: 12.5, variant: 0, solid: true },

  // Columnas del claustro: cuatro puntos estructurales muy claros.
  { kind: ARCH_KIND.PILLAR, col: 5.6, row: 7.4, variant: 0, solid: true, sortOffset: 5 },
  { kind: ARCH_KIND.PILLAR, col: 13.4, row: 7.4, variant: 1, solid: true, sortOffset: 5 },
  { kind: ARCH_KIND.PILLAR, col: 5.6, row: 12.6, variant: 2, solid: true, sortOffset: 5 },
  { kind: ARCH_KIND.PILLAR, col: 13.4, row: 12.6, variant: 0, solid: true, sortOffset: 5 },

  // Pequeños fragmentos de pared para que el patio parezca derruido, no vacío.
  { kind: ARCH_KIND.WALL_LOW_X, col: 4.2, row: 13.55, variant: 1, solid: true },
  { kind: ARCH_KIND.WALL_BROKEN_X, col: 5.2, row: 13.55, variant: 2, solid: true },
  { kind: ARCH_KIND.WALL_LOW_X, col: 13.8, row: 13.55, variant: 0, solid: true },
  { kind: ARCH_KIND.WALL_BROKEN_X, col: 14.8, row: 13.55, variant: 1, solid: true },

  // Transición de claustro a acceso.
  { kind: ARCH_KIND.STAIRS, col: 9.5, row: 13.75, variant: 1, solid: false, sortOffset: 2 },

  // ACCESO SUR --------------------------------------------------------------
  // El corredor inferior queda enmarcado por restos de muro, no encerrado.
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 5.55, row: 15.0, variant: 0, solid: true },
  { kind: ARCH_KIND.WALL_LOW_Z, col: 5.55, row: 16.0, variant: 1, solid: true },
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 5.55, row: 18.0, variant: 2, solid: true },

  { kind: ARCH_KIND.WALL_LOW_Z, col: 13.45, row: 15.0, variant: 2, solid: true },
  { kind: ARCH_KIND.WALL_BROKEN_Z, col: 13.45, row: 17.0, variant: 1, solid: true },
  { kind: ARCH_KIND.WALL_LOW_Z, col: 13.45, row: 18.0, variant: 0, solid: true },

  { kind: ARCH_KIND.PILLAR, col: 6.6, row: 14.8, variant: 1, solid: true, sortOffset: 5 },
  { kind: ARCH_KIND.PILLAR, col: 12.4, row: 14.8, variant: 2, solid: true, sortOffset: 5 },
];
