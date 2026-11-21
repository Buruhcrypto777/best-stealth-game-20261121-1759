// Vision: line of sight and vision cones.
// Walls and crates block sight; shadow floor does not. The cone a
// guard projects is clipped ray by ray, so it wraps around corners
// exactly the way the guard's own sight check does.

import {
  CONE_RANGE, CONE_HALF_ANGLE, CONE_RAYS, T_WALL, T_CRATE,
} from './config.js';
import { tileAt } from './level.js';

// True when nothing solid stands between two points. Sampled finely
// enough that a crate corner can never hide a false gap.
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tile = tileAt(grid, x0 + dx * t, y0 + dy * t);
    if (tile === T_WALL || tile === T_CRATE) return false;
  }
  return true;
}

// Smallest absolute angle between two directions, 0..PI.
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Can this guard see the player right now? Returns whether the
// player is visible and how far away they are, for the detection
// rate to scale with distance.
export function guardSeesPlayer(grid, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return { visible: false, dist };
  const angleToPlayer = Math.atan2(dy, dx);
  if (angleDifference(angleToPlayer, guard.facing) > CONE_HALF_ANGLE) {
    return { visible: false, dist };
  }
  if (!hasLineOfSight(grid, guard.x, guard.y, player.x, player.y)) {
    return { visible: false, dist };
  }
  return { visible: true, dist };
}

// Cast one sight ray until it hits something solid or runs out of
// range, and return how far it travelled.
export function castSightRay(grid, x, y, angle) {
  const step = 6;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  for (let d = step; d <= CONE_RANGE; d += step) {
    const tile = tileAt(grid, x + dirX * d, y + dirY * d);
    if (tile === T_WALL || tile === T_CRATE) return d - step / 2;
  }
  return CONE_RANGE;
}

// The cone's outline as a polygon of points, clipped by walls and
// crates so the drawn cone matches what the guard can actually see.
export function conePolygon(grid, guard) {
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const angle = guard.facing - CONE_HALF_ANGLE
      + (2 * CONE_HALF_ANGLE * i) / CONE_RAYS;
    const reach = castSightRay(grid, guard.x, guard.y, angle);
    points.push({
      x: guard.x + Math.cos(angle) * reach,
      y: guard.y + Math.sin(angle) * reach,
    });
  }
  return points;
}
