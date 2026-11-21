// Guard AI: patrol, suspicious, chase and search.
// A guard walks its waypoints, turns toward anything it half-sees,
// gives chase when its detection meter fills, and searches the last
// place it saw you before giving up and going back to patrol. A
// sentry never walks: it sweeps its cone back and forth in place.

import {
  GUARD_PATROL_SPEED, GUARD_SUSPICIOUS_SPEED, GUARD_CHASE_SPEED,
  GUARD_TURN_SPEED, SUSPICIOUS_AT, FULL_DETECTION, DETECTION_FILL_RATE,
  DETECTION_DECAY_RATE, SNEAK_DETECTION_MULT, SHADOW_DETECTION_MULT,
  CHASE_LOSE_SIGHT_SECONDS, SEARCH_SECONDS, CATCH_DISTANCE, CONE_RANGE,
  T_SHADOW,
} from './config.js';
import { tileCenter, tileAt, circleHitsSolid } from './level.js';
import { guardSeesPlayer, angleDifference } from './vision.js';

let guardIdCounter = 0;

export class Guard {
  constructor(def) {
    this.id = guardIdCounter += 1;
    this.kind = def.kind;
    this.patrolSpeed = def.speed;
    const start = tileCenter(def.waypoints[0].tx, def.waypoints[0].ty);
    this.x = start.x;
    this.y = start.y;
    this.waypoints = def.waypoints.map((w) => tileCenter(w.tx, w.ty));
    this.waypointIndex = 1 % this.waypoints.length;
    this.facing = def.kind === 'sentry' ? (def.sweepFrom + def.sweepTo) / 2 : 0;
    this.sweepFrom = def.sweepFrom ?? 0;
    this.sweepTo = def.sweepTo ?? 0;
    this.sweepDirection = 1;
    this.state = 'patrol'; // patrol | suspicious | chase | search
    this.detection = 0; // 0..100, fills while the player is visible
    this.lastSeen = { x: this.x, y: this.y };
    this.lostSightTimer = 0;
    this.searchTimer = 0;
    this.pauseTimer = 0;
    this.caughtPlayer = false;
  }

  // Move toward a target point, sliding along walls instead of sticking.
  stepToward(grid, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const move = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * move;
    const ny = this.y + (dy / dist) * move;
    this.facing = Math.atan2(dy, dx);
    if (!circleHitsSolid(grid, nx, this.y, 13)) this.x = nx;
    if (!circleHitsSolid(grid, this.x, ny, 13)) this.y = ny;
    return dist - move < 2;
  }

  // One frame of the guard's brain.
  update(dt, grid, player, onHeard) {
    const sight = guardSeesPlayer(grid, this, player);
    this.updateDetection(dt, grid, sight, player);
    if (this.detection >= FULL_DETECTION && this.state !== 'chase') {
      this.state = 'chase';
      this.lostSightTimer = 0;
      onHeard('chase');
    }
    if (this.state === 'patrol') this.updatePatrol(dt, grid, sight, player);
    else if (this.state === 'suspicious') this.updateSuspicious(dt, grid, sight, player);
    else if (this.state === 'chase') this.updateChase(dt, grid, sight, player);
    else this.updateSearch(dt, grid, sight, player);
  }

  // Fill the meter while the player is in view, drain it out of view.
  // Nearer, standing and lit players fill it fastest.
  updateDetection(dt, grid, sight, player) {
    if (sight.visible) {
      const closeness = 1 - (sight.dist / CONE_RANGE) * 0.55;
      let rate = DETECTION_FILL_RATE * closeness;
      if (player.sneaking) rate *= SNEAK_DETECTION_MULT;
      if (tileAt(grid, player.x, player.y) === T_SHADOW) rate *= SHADOW_DETECTION_MULT;
      this.detection = Math.min(FULL_DETECTION, this.detection + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.lostSightTimer = 0;
    } else {
      this.detection = Math.max(0, this.detection - DETECTION_DECAY_RATE * dt);
    }
  }

  // Walk the waypoints, pausing a beat at each one to look around.
  updatePatrol(dt, grid, sight, player) {
    if (this.detection >= SUSPICIOUS_AT) {
      this.state = 'suspicious';
      return;
    }
    if (this.kind === 'sentry') {
      this.sweepFacing(dt);
      return;
    }
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      this.facing += GUARD_TURN_SPEED * 0.4 * dt;
      return;
    }
    const target = this.waypoints[this.waypointIndex];
    if (this.stepToward(grid, target.x, target.y, this.patrolSpeed, dt)) {
      this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      this.pauseTimer = 0.7;
    }
  }

  // Walk to the last place the player (or a noise) was, look around,
  // then go back to patrol once the meter has drained.
  updateSuspicious(dt, grid, sight, player) {
    if (this.detection <= 0) {
      this.state = 'patrol';
      return;
    }
    const arrived = this.stepToward(
      grid, this.lastSeen.x, this.lastSeen.y, GUARD_SUSPICIOUS_SPEED, dt,
    );
    if (arrived) {
      this.facing += GUARD_TURN_SPEED * dt;
      this.searchTimer += dt;
      if (this.searchTimer > SEARCH_SECONDS) {
        this.searchTimer = 0;
        this.detection = 0;
        this.state = 'patrol';
      }
    }
  }

  // Run at the player while visible; lose them for a few seconds and
  // fall back to searching the last place they were seen.
  updateChase(dt, grid, sight, player) {
    if (sight.visible) {
      this.lastSeen = { x: player.x, y: player.y };
      this.lostSightTimer = 0;
    } else {
      this.lostSightTimer += dt;
      if (this.lostSightTimer > CHASE_LOSE_SIGHT_SECONDS) {
        this.state = 'search';
        this.searchTimer = 0;
        this.detection = Math.max(this.detection, SUSPICIOUS_AT);
        return;
      }
    }
    this.stepToward(grid, this.lastSeen.x, this.lastSeen.y, GUARD_CHASE_SPEED, dt);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.hypot(dx, dy) < CATCH_DISTANCE) this.caughtPlayer = true;
  }

  // Sweep the last seen spot, then return to the patrol route.
  updateSearch(dt, grid, sight, player) {
    const arrived = this.stepToward(
      grid, this.lastSeen.x, this.lastSeen.y, GUARD_SUSPICIOUS_SPEED, dt,
    );
    if (arrived) {
      this.facing += GUARD_TURN_SPEED * dt;
      this.searchTimer += dt;
      if (this.searchTimer > SEARCH_SECONDS) {
        this.searchTimer = 0;
        this.detection = 0;
        this.state = 'patrol';
      }
    }
  }

  // A sentry's cone sweeps between its two end angles.
  sweepFacing(dt) {
    this.facing += GUARD_TURN_SPEED * 0.55 * this.sweepDirection * dt;
    if (this.facing > this.sweepTo) {
      this.facing = this.sweepTo;
      this.sweepDirection = -1;
    } else if (this.facing < this.sweepFrom) {
      this.facing = this.sweepFrom;
      this.sweepDirection = 1;
    }
  }

  // A noise pulls a guard that is not already chasing to investigate
  // the spot, unless it is too far away to hear it.
  hearNoise(nx, ny, radius) {
    if (this.state === 'chase') return;
    const dist = Math.hypot(nx - this.x, ny - this.y);
    if (dist > radius) return;
    this.lastSeen = { x: nx, y: ny };
    this.detection = Math.max(this.detection, SUSPICIOUS_AT + 5);
    this.state = 'suspicious';
    this.searchTimer = 0;
  }

  // How alarmed this guard looks, for the HUD and the cone colour.
  alertLevel() {
    if (this.state === 'chase') return 2;
    if (this.state === 'suspicious' || this.state === 'search') return 1;
    return 0;
  }
}

// The highest detection among all guards drives the HUD meter.
export function highestDetection(guards) {
  let top = 0;
  for (const guard of guards) top = Math.max(top, guard.detection);
  return top;
}

// Any guard currently giving chase?
export function anyChasing(guards) {
  return guards.some((guard) => guard.state === 'chase');
}
