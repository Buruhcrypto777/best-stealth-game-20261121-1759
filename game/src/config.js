// Shared tuning constants for NIGHTSHIFT: The Meridian Archive.
// One place holds every number the other modules read, so a balance
// change never means hunting the same value through several files.

export const TILE = 32; // pixels per grid cell
export const COLS = 30; // level width in tiles
export const ROWS = 20; // level height in tiles
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 640

// Tile codes stored in the level grid.
export const T_FLOOR = 0;
export const T_WALL = 1;
export const T_CRATE = 2; // cover: blocks movement and sight
export const T_SHADOW = 3; // dark floor: detection fills half as fast

// Movement speeds, pixels per second.
export const PLAYER_WALK_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 88;
export const GUARD_PATROL_SPEED = 58;
export const GUARD_SUSPICIOUS_SPEED = 88;
export const GUARD_CHASE_SPEED = 168;
export const GUARD_TURN_SPEED = 2.4; // radians per second while scanning

// Vision: how far a guard sees and how wide the cone opens.
export const CONE_RANGE = 215;
export const CONE_HALF_ANGLE = (38 * Math.PI) / 180;
export const CONE_RAYS = 26; // rays cast to clip the drawn cone on walls

// Detection meter 0..100. Cross SUSPICIOUS_AT and a guard comes to
// look; reach FULL_DETECTION and the guard gives chase.
export const SUSPICIOUS_AT = 40;
export const FULL_DETECTION = 100;
export const DETECTION_FILL_RATE = 55; // per second, point blank
export const DETECTION_DECAY_RATE = 26; // per second, out of sight
export const SNEAK_DETECTION_MULT = 0.45; // sneaking is much harder to spot
export const SHADOW_DETECTION_MULT = 0.5; // dark floor hides the player
export const CHASE_LOSE_SIGHT_SECONDS = 3.0;
export const SEARCH_SECONDS = 2.5;
export const CATCH_DISTANCE = 20; // a chasing guard this close catches you

// Noise: running feet and tossed coins pull guards to investigate.
export const RUN_NOISE_RADIUS = 105;
export const RUN_NOISE_INTERVAL = 0.45; // seconds between footstep pulses
export const COIN_NOISE_RADIUS = 250;
export const COIN_FLY_SECONDS = 0.55;
export const STARTING_COINS = 3;

// Palette: a night archive, lit by warm lamps and cold exit signs.
export const COLORS = {
  floorA: '#20242e',
  floorB: '#1c2029',
  shadowFloor: '#12141d',
  shadowHatch: '#0d0f16',
  wall: '#3a4152',
  wallTop: '#565f75',
  wallEdge: '#232833',
  crate: '#6b5433',
  crateEdge: '#4a3a22',
  crateBand: '#8a6f45',
  exitDoor: '#2fd47c',
  exitGlow: '#123626',
  keycard: '#ffd23f',
  loot: '#7ee7ff',
  player: '#e8e4d8',
  playerCloak: '#2f6db3',
  guardBody: '#c94f4f',
  guardTrim: '#7e2f2f',
  conePatrol: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 170, 40, 0.32)',
  coneChase: 'rgba(255, 70, 60, 0.38)',
  coneEdge: 'rgba(255, 220, 110, 0.55)',
  hudBar: '#10131a',
  hudText: '#e8e4d8',
  hudDim: '#9aa3b2',
  danger: '#ff5148',
  warn: '#ffb02e',
  ok: '#2fd47c',
};
