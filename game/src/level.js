// Level definitions for NIGHTSHIFT: The Meridian Archive.
// Each level is data, not a picture: wall rectangles, crate tiles,
// shadow patches, the keycard, the exit door, loot shards and the
// guards with their patrol waypoints. buildLevel turns that data
// into a tile grid the movement, vision and render code all share.
// Waypoints are chosen on clear straight lines so a patrol never
// has to path around a wall.

import {
  COLS, ROWS, T_FLOOR, T_WALL, T_CRATE, T_SHADOW,
} from './config.js';

// A level's raw data, in tile coordinates.
const LEVEL_DEFS = [
  {
    name: 'LEVEL 1 — THE LOBBY',
    subtitle: 'Two guards. Learn their patrols, then slip past.',
    playerStart: { tx: 2, ty: 17 },
    exit: { tx: 28, ty: 10 },
    keycard: { tx: 27, ty: 2 },
    loot: [
      { tx: 6, ty: 2 },
      { tx: 15, ty: 16 },
      { tx: 25, ty: 12 },
    ],
    walls: [
      { x: 10, y: 2, w: 1, h: 6 },
      { x: 20, y: 3, w: 1, h: 6 },
      { x: 13, y: 11, w: 7, h: 1 },
      { x: 22, y: 5, w: 5, h: 1 },
      { x: 24, y: 13, w: 1, h: 5 },
    ],
    crates: [
      { x: 4, y: 5 }, { x: 5, y: 5 },
      { x: 14, y: 4 },
      { x: 16, y: 15 },
      { x: 7, y: 14 },
      { x: 23, y: 14 },
      { x: 26, y: 3 },
      { x: 12, y: 16 },
      { x: 18, y: 7 },
    ],
    shadows: [
      { x: 2, y: 9, w: 4, h: 3 },
      { x: 17, y: 14, w: 5, h: 3 },
      { x: 10, y: 3, w: 3, h: 2 },
    ],
    guards: [
      {
        kind: 'patrol', speed: 58,
        waypoints: [{ tx: 13, ty: 3 }, { tx: 13, ty: 9 }],
      },
      {
        kind: 'patrol', speed: 58,
        waypoints: [{ tx: 22, ty: 17 }, { tx: 22, ty: 9 }],
      },
    ],
  },
  {
    name: 'LEVEL 2 — THE GALLERY',
    subtitle: 'Three guards and a sentry who never stops scanning.',
    playerStart: { tx: 2, ty: 2 },
    exit: { tx: 28, ty: 2 },
    keycard: { tx: 27, ty: 17 },
    loot: [
      { tx: 5, ty: 17 },
      { tx: 14, ty: 12 },
      { tx: 26, ty: 5 },
    ],
    walls: [
      { x: 8, y: 2, w: 1, h: 8 },
      { x: 16, y: 10, w: 1, h: 8 },
      { x: 18, y: 6, w: 9, h: 1 },
      { x: 3, y: 14, w: 7, h: 1 },
      { x: 24, y: 8, w: 1, h: 5 },
    ],
    crates: [
      { x: 4, y: 12 },
      { x: 12, y: 3 }, { x: 13, y: 3 },
      { x: 20, y: 16 },
      { x: 26, y: 16 },
      { x: 10, y: 16 },
      { x: 18, y: 2 },
      { x: 5, y: 7 },
    ],
    shadows: [
      { x: 2, y: 15, w: 5, h: 3 },
      { x: 20, y: 10, w: 4, h: 2 },
      { x: 11, y: 8, w: 3, h: 3 },
    ],
    guards: [
      {
        kind: 'patrol', speed: 62,
        waypoints: [{ tx: 11, ty: 4 }, { tx: 11, ty: 16 }],
      },
      {
        kind: 'patrol', speed: 62,
        waypoints: [{ tx: 19, ty: 3 }, { tx: 26, ty: 3 }],
      },
      {
        kind: 'patrol', speed: 62,
        waypoints: [{ tx: 21, ty: 12 }, { tx: 21, ty: 17 }],
      },
      {
        kind: 'sentry', speed: 0,
        waypoints: [{ tx: 14, ty: 8 }],
        sweepFrom: -Math.PI / 2 - 1.1,
        sweepTo: -Math.PI / 2 + 1.1,
      },
    ],
  },
  {
    name: 'LEVEL 3 — THE VAULT',
    subtitle: 'Four fast guards. The core is deep inside. Stay dark.',
    playerStart: { tx: 2, ty: 2 },
    exit: { tx: 28, ty: 10 },
    keycard: { tx: 27, ty: 17 },
    loot: [
      { tx: 6, ty: 17 },
      { tx: 19, ty: 10 },
      { tx: 25, ty: 6 },
    ],
    walls: [
      { x: 7, y: 2, w: 1, h: 7 },
      { x: 13, y: 11, w: 1, h: 7 },
      { x: 21, y: 2, w: 1, h: 8 },
      { x: 8, y: 9, w: 5, h: 1 },
      { x: 15, y: 15, w: 6, h: 1 },
      { x: 26, y: 11, w: 1, h: 6 },
    ],
    crates: [
      { x: 5, y: 10 },
      { x: 10, y: 3 },
      { x: 17, y: 6 },
      { x: 18, y: 12 },
      { x: 23, y: 14 },
      { x: 9, y: 17 },
      { x: 27, y: 4 },
      { x: 12, y: 8 },
    ],
    shadows: [
      { x: 2, y: 12, w: 4, h: 3 },
      { x: 15, y: 3, w: 4, h: 2 },
      { x: 22, y: 17, w: 5, h: 2 },
    ],
    guards: [
      {
        kind: 'patrol', speed: 70,
        waypoints: [{ tx: 4, ty: 4 }, { tx: 4, ty: 16 }],
      },
      {
        kind: 'patrol', speed: 70,
        waypoints: [{ tx: 16, ty: 3 }, { tx: 16, ty: 9 }],
      },
      {
        kind: 'patrol', speed: 70,
        waypoints: [{ tx: 19, ty: 12 }, { tx: 25, ty: 12 }],
      },
      {
        kind: 'patrol', speed: 70,
        waypoints: [{ tx: 24, ty: 16 }, { tx: 24, ty: 10 }],
      },
      {
        kind: 'sentry', speed: 0,
        waypoints: [{ tx: 18, ty: 16 }],
        sweepFrom: Math.PI / 2 - 1.2,
        sweepTo: Math.PI / 2 + 1.2,
      },
    ],
  },
];

// Turn one level definition into the grid and entity list the game uses.
export function buildLevel(index) {
  const def = LEVEL_DEFS[index];
  const grid = new Uint8Array(COLS * ROWS).fill(T_FLOOR);
  const set = (tx, ty, tile) => {
    if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) grid[ty * COLS + tx] = tile;
  };
  // Border walls first, then interior walls, crates and shadow floor.
  for (let x = 0; x < COLS; x += 1) { set(x, 0, T_WALL); set(x, ROWS - 1, T_WALL); }
  for (let y = 0; y < ROWS; y += 1) { set(0, y, T_WALL); set(COLS - 1, y, T_WALL); }
  for (const w of def.walls) {
    for (let y = w.y; y < w.y + w.h; y += 1) {
      for (let x = w.x; x < w.x + w.w; x += 1) set(x, y, T_WALL);
    }
  }
  for (const c of def.crates) set(c.x, c.y, T_CRATE);
  for (const s of def.shadows) {
    for (let y = s.y; y < s.y + s.h; y += 1) {
      for (let x = s.x; x < s.x + s.w; x += 1) {
        if (grid[y * COLS + x] === T_FLOOR) set(x, y, T_SHADOW);
      }
    }
  }
  return {
    index,
    name: def.name,
    subtitle: def.subtitle,
    grid,
    playerStart: def.playerStart,
    exit: def.exit,
    keycard: def.keycard,
    loot: def.loot.map((p) => ({ ...p, taken: false })),
    guards: def.guards,
  };
}

export const LEVEL_COUNT = LEVEL_DEFS.length;

// Pixel centre of a tile.
export function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * 32, y: (ty + 0.5) * 32 };
}

// Tile at a pixel position, or T_WALL outside the map.
export function tileAt(grid, px, py) {
  const tx = Math.floor(px / 32);
  const ty = Math.floor(py / 32);
  if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return T_WALL;
  return grid[ty * COLS + tx];
}

// True when a circle of the given radius at (px, py) overlaps a solid tile.
export function circleHitsSolid(grid, px, py, radius) {
  const minTx = Math.floor((px - radius) / 32);
  const maxTx = Math.floor((px + radius) / 32);
  const minTy = Math.floor((py - radius) / 32);
  const maxTy = Math.floor((py + radius) / 32);
  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      const tile = tileAt(grid, tx * 32 + 16, ty * 32 + 16);
      if (tile === T_WALL || tile === T_CRATE) {
        const nearestX = Math.max(tx * 32, Math.min(px, tx * 32 + 32));
        const nearestY = Math.max(ty * 32, Math.min(py, ty * 32 + 32));
        const dx = px - nearestX;
        const dy = py - nearestY;
        if (dx * dx + dy * dy < radius * radius) return true;
      }
    }
  }
  return false;
}
