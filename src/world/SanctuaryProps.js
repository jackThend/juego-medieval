export const PROP_KIND = Object.freeze({
  ALTAR: "altar",
  SCRIBE_TABLE: "scribeTable",
  BENCH: "bench",
  GRAVE: "grave",
  GRAVE_BROKEN: "graveBroken",
  BANNER: "banner",
  CANDLES: "candles",
  STATUE_BROKEN: "statueBroken",
  RUBBLE: "rubble",
  FOLIAGE: "foliage",
  ROOTS: "roots",
  BARREL: "barrel",
  SACKS: "sacks",
  CRATE: "crate",
  URN: "urn",
});

export const SANCTUARY_PROPS = [
  // CAPILLA NORTE -----------------------------------------------------------
  { kind: PROP_KIND.ALTAR, col: 9.5, row: 1.65, variant: 0, solid: true, stateful: "shrine", sortOffset: 8, glow: "warmStrong" },
  { kind: PROP_KIND.CANDLES, col: 8.25, row: 2.4, variant: 0, solid: false, glow: "warmSmall" },
  { kind: PROP_KIND.CANDLES, col: 10.75, row: 2.35, variant: 1, solid: false, glow: "warmSmall" },
  { kind: PROP_KIND.SCRIBE_TABLE, col: 12.7, row: 3.4, variant: 0, solid: true, sortOffset: 4, glow: "warmSmall" },
  { kind: PROP_KIND.BANNER, col: 7.1, row: 0.78, variant: 0, solid: false, sortOffset: 14 },
  { kind: PROP_KIND.BANNER, col: 12.0, row: 0.78, variant: 1, solid: false, sortOffset: 14 },
  { kind: PROP_KIND.URN, col: 6.4, row: 3.9, variant: 0, interactive: true },
  { kind: PROP_KIND.RUBBLE, col: 13.5, row: 4.7, variant: 1, solid: false },

  // CLAUSTRO: ala funeraria al oeste.
  { kind: PROP_KIND.GRAVE, col: 4.0, row: 8.0, variant: 0, solid: false },
  { kind: PROP_KIND.GRAVE, col: 4.7, row: 9.2, variant: 1, solid: false },
  { kind: PROP_KIND.GRAVE_BROKEN, col: 3.9, row: 10.6, variant: 2, solid: false },
  { kind: PROP_KIND.GRAVE, col: 4.8, row: 11.7, variant: 2, solid: false },
  { kind: PROP_KIND.STATUE_BROKEN, col: 6.2, row: 10.8, variant: 0, solid: true, sortOffset: 5 },
  { kind: PROP_KIND.CANDLES, col: 5.3, row: 9.8, variant: 2, solid: false, glow: "warmTiny" },

  // CLAUSTRO: lado este usado antiguamente como lugar de descanso.
  { kind: PROP_KIND.BENCH, col: 14.8, row: 8.6, variant: 0, solid: true },
  { kind: PROP_KIND.BENCH, col: 14.2, row: 11.4, variant: 1, solid: true },
  { kind: PROP_KIND.RUBBLE, col: 15.4, row: 10.0, variant: 0, solid: false },
  { kind: PROP_KIND.FOLIAGE, col: 15.7, row: 7.0, variant: 0, solid: false },
  { kind: PROP_KIND.ROOTS, col: 16.0, row: 12.0, variant: 0, solid: false, sortOffset: 2 },

  // Transición al acceso: restos cotidianos.
  { kind: PROP_KIND.BARREL, col: 7.0, row: 15.5, variant: 0, solid: true },
  { kind: PROP_KIND.SACKS, col: 7.6, row: 16.1, variant: 0, solid: false },
  { kind: PROP_KIND.CRATE, col: 12.0, row: 15.8, variant: 1, interactive: true },
  { kind: PROP_KIND.URN, col: 12.7, row: 17.1, variant: 1, interactive: true },
  { kind: PROP_KIND.CRATE, col: 6.8, row: 17.5, variant: 0, interactive: true },

  // Vegetación colocada en puntos estructurales: grietas, bordes y muros.
  { kind: PROP_KIND.FOLIAGE, col: 3.1, row: 6.7, variant: 1, solid: false },
  { kind: PROP_KIND.FOLIAGE, col: 5.0, row: 13.0, variant: 2, solid: false },
  { kind: PROP_KIND.FOLIAGE, col: 13.8, row: 13.0, variant: 0, solid: false },
  { kind: PROP_KIND.ROOTS, col: 5.5, row: 17.8, variant: 1, solid: false },
  { kind: PROP_KIND.FOLIAGE, col: 13.3, row: 18.0, variant: 1, solid: false },
];
