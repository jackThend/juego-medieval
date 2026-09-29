export const ISO_MAP_WIDTH = 20;
export const ISO_MAP_HEIGHT = 20;
export const ISO_TILE_SIZE = 1;

export const TILE = Object.freeze({
  VOID: "void",
  STONE: "stone",
  STONE_DARK: "stoneDark",
  MOSS: "moss",
  PATH: "path",
  SANCTUM: "sanctum",
});

export const PLAYER_START = Object.freeze({ x: 0, z: 8.5 });
export const GUARDIAN_START = Object.freeze({ x: 0, z: -5.6 });
export const SHRINE_POSITION = Object.freeze({ x: 0, z: -8.5 });

function createGrid() {
  const grid = Array.from(
    { length: ISO_MAP_HEIGHT },
    () => Array(ISO_MAP_WIDTH).fill(TILE.VOID),
  );

  const paintRect = (c0, r0, c1, r1, type) => {
    for (let row = r0; row <= r1; row += 1) {
      for (let col = c0; col <= c1; col += 1) grid[row][col] = type;
    }
  };

  // Cámara superior: capilla. Centro: claustro. Abajo: acceso.
  paintRect(5, 1, 14, 5, TILE.STONE_DARK);
  paintRect(3, 6, 16, 13, TILE.STONE);
  paintRect(6, 14, 13, 18, TILE.STONE_DARK);

  // Nave central continua. Mantiene una lectura arquitectónica desde el
  // acceso hasta el santuario.
  paintRect(8, 1, 11, 18, TILE.PATH);

  // Cruce del claustro.
  paintRect(4, 9, 15, 11, TILE.PATH);

  // Variación controlada, nunca dispersión procedural arbitraria.
  const mossCells = [
    [4,6],[5,6],[14,6],[15,6],
    [3,7],[16,7],[3,12],[16,12],
    [5,13],[14,13],[6,16],[13,16],
    [6,17],[13,17],
  ];
  for (const [col,row] of mossCells) {
    if (grid[row]?.[col] && grid[row][col] !== TILE.VOID) grid[row][col] = TILE.MOSS;
  }

  // Plataforma ritual al norte.
  for (const row of [1,2]) {
    for (const col of [8,9,10,11]) grid[row][col] = TILE.SANCTUM;
  }

  return grid;
}

export const SANCTUARY_GRID = createGrid();

export function tileToWorld(col, row, target = { x: 0, z: 0 }) {
  target.x = (col - (ISO_MAP_WIDTH - 1) * 0.5) * ISO_TILE_SIZE;
  target.z = (row - (ISO_MAP_HEIGHT - 1) * 0.5) * ISO_TILE_SIZE;
  return target;
}

export function worldToTile(x, z, target = { col: 0, row: 0 }) {
  target.col = Math.round(x / ISO_TILE_SIZE + (ISO_MAP_WIDTH - 1) * 0.5);
  target.row = Math.round(z / ISO_TILE_SIZE + (ISO_MAP_HEIGHT - 1) * 0.5);
  return target;
}

export function isWalkableTile(type) {
  return type !== TILE.VOID;
}
