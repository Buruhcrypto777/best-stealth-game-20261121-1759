// Staged shots: deterministic scenes for the screenshots.
// ?shot=cover (and the others below) builds one exact scene —
// level, positions, guard states, detection — then freezes the
// game, so the same URL always renders the same picture. Nothing
// here runs during normal play.

import { T_CRATE, COLS } from './config.js';
import { tileCenter } from './level.js';

function placeGuard(game, index, tx, ty, facing, state, detection) {
  const guard = game.guards[index];
  const pos = tileCenter(tx, ty);
  guard.x = pos.x;
  guard.y = pos.y;
  guard.facing = facing;
  guard.state = state;
  guard.detection = detection;
  guard.lastSeen = { x: pos.x, y: pos.y };
  return guard;
}

function placePlayer(game, tx, ty, sneaking) {
  const pos = tileCenter(tx, ty);
  game.player.x = pos.x;
  game.player.y = pos.y;
  game.player.sneaking = sneaking;
  game.player.moving = false;
  game.player.facing = -Math.PI / 2;
}

// The cover: the player crouched behind a crate, a guard's cone
// stopping on that crate, the green exit glowing just past it.
function stageCover(game) {
  game.loadLevel(0);
  game.phase = 'playing';
  // One extra crate between the patrolling guard and the player.
  game.grid[10 * COLS + 24] = T_CRATE;
  game.player.hasKeycard = true;
  placePlayer(game, 25, 10, true);
  game.player.facing = 0;
  placeGuard(game, 1, 22, 10, 0, 'patrol', 0);
  placeGuard(game, 0, 13, 5, Math.PI / 2, 'patrol', 0);
  game.detection = 0;
  game.timeSeconds = 61;
  game.toast = '';
}

// The alarm: a guard mid-chase, a step behind the running player,
// the meter nearly full and the SPOTTED banner up.
function stageAlert(game) {
  game.loadLevel(1);
  game.phase = 'playing';
  placePlayer(game, 21, 10, false);
  game.player.facing = -Math.PI / 2;
  game.player.hasKeycard = true;
  placeGuard(game, 2, 21, 13, -Math.PI / 2, 'chase', 96);
  game.guards[2].lastSeen = { x: game.player.x, y: game.player.y };
  placeGuard(game, 0, 11, 6, Math.PI / 2, 'patrol', 0);
  placeGuard(game, 1, 19, 3, 0, 'patrol', 12);
  game.detection = 96;
  game.alarms = 1;
  game.timeSeconds = 148;
  game.toast = '';
}

// The sneak: the player flat in a dark patch, a coin arcing away
// to pull the guard off, the cone stopping on a crate.
function stageSneak(game) {
  game.loadLevel(0);
  game.phase = 'playing';
  game.grid[10 * COLS + 5] = T_CRATE;
  placePlayer(game, 3, 10, true);
  game.player.facing = 0;
  const coinTarget = tileCenter(8, 10);
  game.player.tossedCoin = {
    fromX: game.player.x,
    fromY: game.player.y,
    toX: coinTarget.x,
    toY: coinTarget.y,
    t: 0.45,
  };
  placeGuard(game, 0, 8, 10, Math.PI, 'suspicious', 22);
  game.guards[0].lastSeen = { x: coinTarget.x, y: coinTarget.y };
  placeGuard(game, 1, 22, 14, -Math.PI / 2, 'patrol', 0);
  game.detection = 22;
  game.timeSeconds = 34;
  game.toast = 'Coin tossed — the guard heard that';
  game.toastAlpha = 1;
}

// The getaway: the victory screen with the run's final numbers.
function stageWin(game) {
  game.loadLevel(2);
  game.phase = 'victory';
  game.victoryStats = {
    timeText: '04:32',
    loot: 7,
    lootTotal: 9,
    alarms: 2,
    rating: 'GHOST',
  };
}

const STAGERS = {
  cover: stageCover,
  alert: stageAlert,
  sneak: stageSneak,
  win: stageWin,
};

// Stage one named scene and freeze the game on it. Returns true
// when the name was known, false for an unknown ?shot= value.
export function stageShot(name, game) {
  const stage = STAGERS[name];
  if (!stage) return false;
  stage(game);
  game.staged = true;
  game.pulse = 1.25;
  return true;
}
