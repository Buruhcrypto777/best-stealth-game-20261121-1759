// Render: every pixel of the game, drawn on one canvas.
// The world is drawn bottom-up — floor, exit and pickups, vision
// cones, then guards and the player — and the HUD and menu screens
// are drawn on top, big enough to read at a glance in a screenshot.

import {
  TILE, COLS, ROWS, VIEW_W, VIEW_H, COLORS, T_FLOOR, T_WALL,
  T_CRATE, T_SHADOW, FULL_DETECTION,
} from './config.js';
import { conePolygon } from './vision.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
  }

  // --- world -------------------------------------------------------

  drawFloor(grid) {
    const ctx = this.ctx;
    for (let ty = 0; ty < ROWS; ty += 1) {
      for (let tx = 0; tx < COLS; tx += 1) {
        const tile = grid[ty * COLS + tx];
        const x = tx * TILE;
        const y = ty * TILE;
        if (tile === T_WALL) {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(x, y, TILE, 5);
          ctx.fillStyle = COLORS.wallEdge;
          ctx.fillRect(x, y + TILE - 3, TILE, 3);
          ctx.fillRect(x + TILE - 3, y, 3, TILE);
        } else if (tile === T_SHADOW) {
          ctx.fillStyle = COLORS.shadowFloor;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = COLORS.shadowHatch;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + TILE - 4);
          ctx.lineTo(x + TILE - 4, y + 4);
          ctx.moveTo(x + 4, y + 12);
          ctx.lineTo(x + 20, y + 4);
          ctx.stroke();
        } else if (tile === T_CRATE) {
          ctx.fillStyle = COLORS.crate;
          ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
          ctx.strokeStyle = COLORS.crateEdge;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 2);
          ctx.lineTo(x + TILE - 2, y + TILE - 2);
          ctx.moveTo(x + TILE - 2, y + 2);
          ctx.lineTo(x + 2, y + TILE - 2);
          ctx.stroke();
          ctx.fillStyle = COLORS.crateBand;
          ctx.fillRect(x + 2, y + TILE / 2 - 2, TILE - 4, 4);
        } else {
          ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
          ctx.fillRect(x, y, TILE, TILE);
        }
      }
    }
  }

  drawExit(exit, unlocked) {
    const ctx = this.ctx;
    const x = exit.tx * TILE;
    const y = exit.ty * TILE;
    ctx.fillStyle = unlocked ? COLORS.exitGlow : '#1a2b22';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = unlocked ? COLORS.exitDoor : '#3f6b52';
    ctx.fillRect(x + 6, y + 3, TILE - 12, TILE - 6);
    ctx.fillStyle = '#0c1a12';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', x + TILE / 2, y + TILE / 2);
    if (unlocked) {
      ctx.strokeStyle = COLORS.exitDoor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
    }
  }

  drawKeycard(keycard, taken, pulse) {
    if (taken) return;
    const ctx = this.ctx;
    const cx = (keycard.tx + 0.5) * TILE;
    const cy = (keycard.ty + 0.5) * TILE;
    const glow = 0.5 + 0.3 * Math.sin(pulse * 4);
    ctx.fillStyle = `rgba(255, 210, 63, ${0.18 * glow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.keycard;
    roundRect(ctx, cx - 9, cy - 6, 18, 12, 2);
    ctx.fill();
    ctx.fillStyle = '#7a5c00';
    ctx.fillRect(cx - 6, cy - 3, 12, 2);
    ctx.fillRect(cx - 6, cy + 1, 7, 2);
    ctx.fillStyle = COLORS.keycard;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KEYCARD', cx, cy - 16);
  }

  drawLoot(loot, pulse) {
    const ctx = this.ctx;
    for (const shard of loot) {
      if (shard.taken) continue;
      const cx = (shard.tx + 0.5) * TILE;
      const cy = (shard.ty + 0.5) * TILE + Math.sin(pulse * 3 + shard.tx) * 2;
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx + 6, cy);
      ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 6, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx + 3, cy);
      ctx.lineTo(cx, cy + 4);
      ctx.lineTo(cx - 3, cy);
      ctx.closePath();
      ctx.fill();
    }
  }

  // --- actors ------------------------------------------------------

  drawVisionCone(grid, guard) {
    const ctx = this.ctx;
    const polygon = conePolygon(grid, guard);
    const level = guard.alertLevel();
    ctx.fillStyle = level === 2
      ? COLORS.coneChase
      : level === 1 ? COLORS.coneSuspicious : COLORS.conePatrol;
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i += 1) ctx.lineTo(polygon[i].x, polygon[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.coneEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawGuard(guard, pulse) {
    const ctx = this.ctx;
    const level = guard.alertLevel();
    // Alert ring under a guard that has noticed something.
    if (level > 0) {
      ctx.strokeStyle = level === 2 ? COLORS.danger : COLORS.warn;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 19 + Math.sin(pulse * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Body: a red-uniformed guard with a cap brim facing its heading.
    ctx.fillStyle = COLORS.guardBody;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    const fx = Math.cos(guard.facing);
    const fy = Math.sin(guard.facing);
    ctx.fillStyle = COLORS.guardTrim;
    ctx.beginPath();
    ctx.arc(guard.x + fx * 8, guard.y + fy * 8, 5, 0, Math.PI * 2);
    ctx.fill();
    // "?" while suspicious, "!" while chasing or searching.
    if (level > 0) {
      ctx.fillStyle = level === 2 ? COLORS.danger : COLORS.warn;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(level === 2 ? '!' : '?', guard.x, guard.y - 18);
    }
    // Personal detection arc over the guard's head.
    if (guard.detection > 1) {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - 24, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = guard.detection >= FULL_DETECTION ? COLORS.danger : COLORS.warn;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - 24, 9, -Math.PI / 2,
        -Math.PI / 2 + (Math.PI * 2 * guard.detection) / 100);
      ctx.stroke();
    }
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const crouch = player.sneaking ? 0.8 : 1;
    // Soft shadow under the player.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 10, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cloak: a triangle pointing where the player faces.
    const fx = Math.cos(player.facing);
    const fy = Math.sin(player.facing);
    const px = -fy;
    const py = fx;
    ctx.fillStyle = COLORS.playerCloak;
    ctx.beginPath();
    ctx.moveTo(player.x + fx * 15 * crouch, player.y + fy * 15 * crouch);
    ctx.lineTo(player.x - fx * 9 + px * 11, player.y - fy * 9 + py * 11);
    ctx.lineTo(player.x - fx * 9 - px * 11, player.y - fy * 9 - py * 11);
    ctx.closePath();
    ctx.fill();
    // Hooded head.
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10 * crouch + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b2436';
    ctx.beginPath();
    ctx.arc(player.x + fx * 3, player.y + fy * 3, 5, 0, Math.PI * 2);
    ctx.fill();
    if (player.sneaking) {
      ctx.fillStyle = COLORS.hudDim;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNEAKING', player.x, player.y - 20);
    }
  }

  drawTossedCoin(player) {
    const pos = player.tossedCoinPosition();
    if (!pos) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 210, 63, 0.25)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y + 18, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.keycard;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a5c00';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawNoiseRing(ring) {
    if (!ring) return;
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(255, 210, 63, ${Math.max(0, ring.alpha)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- HUD ---------------------------------------------------------

  drawHud(state) {
    const ctx = this.ctx;
    const { level, player, guards, detection, timeSeconds, alarms } = state;
    ctx.fillStyle = COLORS.hudBar;
    ctx.fillRect(0, 0, VIEW_W, 46);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(level.name, 12, 15);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '12px sans-serif';
    const objective = player.hasKeycard
      ? 'OBJECTIVE: Reach the EXIT unseen'
      : 'OBJECTIVE: Find the KEYCARD, then reach the EXIT';
    ctx.fillText(objective, 12, 34);
    // Detection meter, centred in the top bar so it never collides
    // with the level name on the left or the timer on the right.
    const meterX = VIEW_W / 2 - 90;
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DETECTION', meterX, 15);
    ctx.fillStyle = '#2a2f3a';
    ctx.fillRect(meterX, 24, 180, 12);
    const fillColor = detection >= FULL_DETECTION ? COLORS.danger
      : detection >= 40 ? COLORS.warn : COLORS.ok;
    ctx.fillStyle = fillColor;
    ctx.fillRect(meterX, 24, 180 * (detection / 100), 12);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, 24, 180, 12);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${Math.round(detection)}%`, meterX + 186, 30);
    // Timer, loot, coins, alarms.
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = Math.floor(timeSeconds % 60);
    const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`TIME ${timeText}`, VIEW_W - 12, 15);
    const lootTotal = level.loot.length;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = COLORS.hudDim;
    ctx.fillText(
      `LOOT ${player.lootCollected}/${lootTotal}   COINS ${player.coins}   ALARMS ${alarms}`,
      VIEW_W - 12, 34,
    );
    // Chasing banner, impossible to miss.
    if (guards.some((g) => g.state === 'chase')) {
      ctx.fillStyle = 'rgba(255, 60, 50, 0.9)';
      ctx.fillRect(VIEW_W / 2 - 130, 52, 260, 30);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED!  RUN!', VIEW_W / 2, 67);
    }
  }

  drawToast(text, alpha) {
    if (!text || alpha <= 0) return;
    const ctx = this.ctx;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillStyle = 'rgba(16, 19, 26, 0.85)';
    const w = ctx.measureText(text).width + 36;
    ctx.fillRect(VIEW_W / 2 - w / 2, VIEW_H - 64, w, 34);
    ctx.fillStyle = COLORS.keycard;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, VIEW_W / 2, VIEW_H - 47);
    ctx.globalAlpha = 1;
  }

  // --- screens -----------------------------------------------------

  drawCenterPanel(title, lines, accent) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 96);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '16px sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 44 + i * 26);
    });
  }

  drawTitle() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0d1017';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Decorative cones sweeping the title, like searchlights.
    const t = performance.now() / 1000;
    for (let i = 0; i < 3; i += 1) {
      const cx = 180 + i * 300;
      const cy = 520;
      const angle = -Math.PI / 2 + Math.sin(t * 0.6 + i * 2) * 0.7;
      ctx.fillStyle = 'rgba(255, 214, 90, 0.10)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 320, angle - 0.5, angle + 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = COLORS.keycard;
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NIGHTSHIFT', VIEW_W / 2, 170);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('— The Meridian Archive —', VIEW_W / 2, 212);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = COLORS.hudDim;
    const lines = [
      'Sneak through the archive. Take the keycard. Reach the exit unseen.',
      '',
      'WASD / ARROWS — move      SHIFT — sneak (slow, hard to spot)',
      'CLICK or Q — toss a coin to lure a guard      P — pause      M — mute',
      'Dark floor hides you. Crates and walls block a guard’s sight.',
      'A full detection meter means a chase. If a guard touches you, you’re caught.',
      '',
      'Click or press ENTER to begin — 3 levels, 1 clean getaway.',
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 268 + i * 26));
    ctx.fillStyle = COLORS.exitDoor;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('▶  CLICK TO START', VIEW_W / 2, 540);
  }

  drawPaused() {
    this.drawCenterPanel('PAUSED', [
      'Take a breath. The guards wait for no one, but the game does.',
      '',
      'Press P or click to keep sneaking.',
    ], COLORS.hudText);
  }

  drawCaught(levelName) {
    this.drawCenterPanel('CAUGHT!', [
      `${levelName} — a guard laid hands on you.`,
      'The archive keeps its secrets tonight.',
      '',
      'Press R or click to try the level again.',
    ], COLORS.danger);
  }

  drawLevelClear(stats) {
    this.drawCenterPanel('LEVEL CLEAR', [
      `${stats.levelName} — keycard taken, exit reached, unseen enough.`,
      `Time ${stats.timeText}   •   Loot ${stats.loot}   •   Alarms ${stats.alarms}`,
      '',
      'Press ENTER or click for the next level.',
    ], COLORS.ok);
  }

  drawVictory(stats) {
    this.drawCenterPanel('CLEAN GETAWAY', [
      'All three levels cleared. The Meridian Archive never saw you.',
      `Total time ${stats.timeText}   •   Loot ${stats.loot}/${stats.lootTotal}`,
      `Alarms raised ${stats.alarms}   •   Rating: ${stats.rating}`,
      '',
      'Press R or click to play it again.',
    ], COLORS.keycard);
  }

  // --- frame -------------------------------------------------------

  drawWorld(state) {
    const { grid, level, player, guards, pulse } = state;
    this.drawFloor(grid);
    this.drawExit(level.exit, player.hasKeycard);
    this.drawKeycard(level.keycard, player.hasKeycard, pulse);
    this.drawLoot(level.loot, pulse);
    for (const guard of guards) this.drawVisionCone(grid, guard);
    for (const guard of guards) this.drawGuard(guard, pulse);
    this.drawPlayer(player);
    this.drawTossedCoin(player);
    this.drawNoiseRing(state.noiseRing);
  }
}
