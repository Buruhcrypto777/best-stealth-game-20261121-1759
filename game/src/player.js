// The player: a night-shift infiltrator in a blue cloak.
// Walks with WASD or arrows, sneaks while Shift is held, and tosses
// a coin with a mouse click (or Q) to pull a guard off its route.
// Running is fast and loud; sneaking is slow and hard to spot.

import {
  PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED, RUN_NOISE_INTERVAL,
  RUN_NOISE_RADIUS, COIN_FLY_SECONDS, STARTING_COINS, T_SHADOW,
} from './config.js';
import { tileCenter, tileAt, circleHitsSolid } from './level.js';

export class Player {
  constructor(startTile) {
    const start = tileCenter(startTile.tx, startTile.ty);
    this.x = start.x;
    this.y = start.y;
    this.radius = 12;
    this.sneaking = false;
    this.moving = false;
    this.facing = -Math.PI / 2;
    this.coins = STARTING_COINS;
    this.hasKeycard = false;
    this.lootCollected = 0;
    this.noiseTimer = 0;
    // A coin in flight: { fromX, fromY, toX, toY, t } or null.
    this.tossedCoin = null;
    this.stepTimer = 0;
  }

  // Read the keys, move, and report what happened this frame.
  // Returns { stepped, noiseAt } for footsteps and noise pulses.
  update(dt, grid, input) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    this.sneaking = input.sneak;
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.facing = Math.atan2(dy, dx);
      const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
      const nx = this.x + dx * speed * dt;
      const ny = this.y + dy * speed * dt;
      if (!circleHitsSolid(grid, nx, this.y, this.radius)) this.x = nx;
      if (!circleHitsSolid(grid, this.x, ny, this.radius)) this.y = ny;
    }

    // Footsteps: running feet pulse noise that nearby guards hear.
    let noiseAt = null;
    let stepped = false;
    if (this.moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        stepped = true;
        this.stepTimer = this.sneaking ? 0.55 : 0.34;
      }
      if (!this.sneaking) {
        this.noiseTimer -= dt;
        if (this.noiseTimer <= 0) {
          this.noiseTimer = RUN_NOISE_INTERVAL;
          noiseAt = { x: this.x, y: this.y, radius: RUN_NOISE_RADIUS };
        }
      }
    }

    this.coinLanded = this.updateTossedCoin(dt);
    return { stepped, noiseAt, coinLanded: this.coinLanded };
  }

  // Start a coin arcing toward a point, if any coins are left.
  tossCoin(targetX, targetY) {
    if (this.coins <= 0 || this.tossedCoin) return false;
    this.coins -= 1;
    this.tossedCoin = {
      fromX: this.x,
      fromY: this.y,
      toX: targetX,
      toY: targetY,
      t: 0,
    };
    return true;
  }

  // Advance the coin's arc; returns its landing spot once it lands.
  updateTossedCoin(dt) {
    if (!this.tossedCoin) return null;
    this.tossedCoin.t += dt / COIN_FLY_SECONDS;
    if (this.tossedCoin.t < 1) return null;
    const landed = { x: this.tossedCoin.toX, y: this.tossedCoin.toY };
    this.tossedCoin = null;
    return landed;
  }

  // Where the coin is right now, for drawing its arc.
  tossedCoinPosition() {
    if (!this.tossedCoin) return null;
    const c = this.tossedCoin;
    const t = Math.min(1, c.t);
    const x = c.fromX + (c.toX - c.fromX) * t;
    const y = c.fromY + (c.toY - c.fromY) * t - Math.sin(t * Math.PI) * 34;
    return { x, y };
  }

  // True when the player stands on dark floor.
  inShadow(grid) {
    return tileAt(grid, this.x, this.y) === T_SHADOW;
  }
}
