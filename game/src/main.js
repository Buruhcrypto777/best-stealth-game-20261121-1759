// NIGHTSHIFT: The Meridian Archive — boot, loop and game state.
// Owns the level, the player, the guards and the phase machine
// (title → playing → paused / caught / level clear → victory),
// and hands every frame to the renderer. A ?shot= URL stages one
// frozen scene for screenshots instead of starting play.

import { COIN_NOISE_RADIUS } from './config.js';
import { buildLevel, tileCenter, LEVEL_COUNT } from './level.js';
import { Guard, highestDetection } from './guards.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { AudioEngine } from './audio.js';
import { stageShot } from './shots.js';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function ratingFor(alarms) {
  if (alarms === 0) return 'GHOST';
  if (alarms <= 2) return 'SHADOW';
  return 'LOUD';
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.audio = new AudioEngine();
    this.phase = 'title'; // title | playing | paused | caught | levelclear | victory
    this.levelIndex = 0;
    this.timeSeconds = 0;
    this.alarms = 0;
    this.totalLoot = 0;
    this.totalLootCollected = 0;
    this.toast = '';
    this.toastAlpha = 0;
    this.pulse = 0;
    this.noiseRing = null;
    this.staged = false;
    this.victoryStats = null;
    this.loadLevel(0);
  }

  // Build a fresh level: new player, new guards, empty detection.
  loadLevel(index) {
    this.levelIndex = index;
    this.level = buildLevel(index);
    this.grid = this.level.grid;
    this.player = new Player(this.level.playerStart);
    this.guards = this.level.guards.map((def) => new Guard(def));
    this.detection = 0;
    this.noiseRing = null;
    this.toast = '';
    this.toastAlpha = 0;
  }

  startRun() {
    this.timeSeconds = 0;
    this.alarms = 0;
    this.totalLootCollected = 0;
    this.totalLoot = 0;
    for (let i = 0; i < LEVEL_COUNT; i += 1) {
      this.totalLoot += buildLevel(i).loot.length;
    }
    this.loadLevel(0);
    this.phase = 'playing';
  }

  // --- update ------------------------------------------------------

  update(dt) {
    this.pulse += dt;
    if (this.toastAlpha > 0) this.toastAlpha -= dt * 0.5;
    if (this.noiseRing) {
      this.noiseRing.radius += 260 * dt;
      this.noiseRing.alpha -= dt * 1.4;
      if (this.noiseRing.alpha <= 0) this.noiseRing = null;
    }
    if (this.phase === 'title') this.updateTitle();
    else if (this.phase === 'playing') this.updatePlaying(dt);
    else if (this.phase === 'paused') this.updatePaused();
    else if (this.phase === 'caught') this.updateCaught();
    else if (this.phase === 'levelclear') this.updateLevelClear();
    else if (this.phase === 'victory') this.updateVictory();
  }

  updateTitle() {
    const click = this.input.takeClick();
    if (click || this.input.wasPressed('enter')) {
      this.audio.ensure();
      this.startRun();
    }
  }

  updatePaused() {
    if (this.input.wasPressed('p') || this.input.takeClick()) {
      this.phase = 'playing';
    }
    if (this.input.wasPressed('r')) this.startRun();
  }

  updateCaught() {
    if (this.input.wasPressed('r') || this.input.takeClick()) {
      this.audio.ensure();
      this.loadLevel(this.levelIndex);
      this.phase = 'playing';
    }
  }

  updateLevelClear() {
    if (this.input.wasPressed('enter') || this.input.takeClick()) {
      this.audio.ensure();
      this.loadLevel(this.levelIndex + 1);
      this.phase = 'playing';
    }
  }

  updateVictory() {
    if (this.input.wasPressed('r') || this.input.takeClick()) {
      this.audio.ensure();
      this.startRun();
    }
  }

  updatePlaying(dt) {
    if (this.input.wasPressed('p')) {
      this.phase = 'paused';
      return;
    }
    if (this.input.wasPressed('r')) {
      this.startRun();
      return;
    }
    if (this.input.wasPressed('m')) this.audio.toggleMute();
    if (this.input.wasPressed('q')) {
      const center = { x: this.player.x, y: this.player.y - 120 };
      this.tossCoinAt(center.x, center.y);
    }
    const click = this.input.takeClick();
    if (click) {
      this.audio.ensure();
      this.tossCoinAt(click.x, click.y);
    }
    this.timeSeconds += dt;

    // Player first: movement, footsteps, running noise, coin landings.
    const result = this.player.update(dt, this.grid, this.input);
    if (result.stepped) this.audio.footstep(this.player.sneaking);
    if (result.noiseAt) this.broadcastNoise(result.noiseAt);
    if (result.coinLanded) this.onCoinLanded(result.coinLanded);

    // Guards next: sight, detection, patrols and chases.
    for (const guard of this.guards) {
      guard.update(dt, this.grid, this.player, (event) => {
        if (event === 'chase') {
          this.alarms += 1;
          this.audio.alarm();
        }
      });
    }
    this.detection = highestDetection(this.guards);

    this.checkPickups();
    this.checkExit();

    if (this.guards.some((guard) => guard.caughtPlayer)) {
      this.phase = 'caught';
      this.audio.caught();
    }
  }

  // A noise pulse reaches every guard close enough to hear it.
  broadcastNoise(noise) {
    for (const guard of this.guards) guard.hearNoise(noise.x, noise.y, noise.radius);
  }

  // A coin landing rings out much further than footsteps.
  onCoinLanded(spot) {
    this.audio.coinClink();
    this.noiseRing = { x: spot.x, y: spot.y, radius: 8, alpha: 0.9 };
    for (const guard of this.guards) {
      guard.hearNoise(spot.x, spot.y, COIN_NOISE_RADIUS);
    }
    this.showToast('Clink — a guard heard that');
  }

  tossCoinAt(x, y) {
    if (this.player.tossCoin(x, y)) this.audio.coinClink();
  }

  // Keycard and loot shards are picked up by walking over them.
  checkPickups() {
    const key = tileCenter(this.level.keycard.tx, this.level.keycard.ty);
    if (!this.player.hasKeycard
      && Math.hypot(this.player.x - key.x, this.player.y - key.y) < 26) {
      this.player.hasKeycard = true;
      this.audio.keycard();
      this.showToast('KEYCARD SECURED — reach the EXIT');
    }
    for (const shard of this.level.loot) {
      if (shard.taken) continue;
      const pos = tileCenter(shard.tx, shard.ty);
      if (Math.hypot(this.player.x - pos.x, this.player.y - pos.y) < 22) {
        shard.taken = true;
        this.player.lootCollected += 1;
        this.totalLootCollected += 1;
        this.audio.pickup();
      }
    }
  }

  // The exit only opens once the keycard is in hand.
  checkExit() {
    if (!this.player.hasKeycard) return;
    const exit = tileCenter(this.level.exit.tx, this.level.exit.ty);
    if (Math.hypot(this.player.x - exit.x, this.player.y - exit.y) > 26) return;
    if (this.levelIndex + 1 >= LEVEL_COUNT) {
      this.victoryStats = {
        timeText: formatTime(this.timeSeconds),
        loot: this.totalLootCollected,
        lootTotal: this.totalLoot,
        alarms: this.alarms,
        rating: ratingFor(this.alarms),
      };
      this.phase = 'victory';
      this.audio.victory();
    } else {
      this.phase = 'levelclear';
      this.audio.levelClear();
    }
  }

  showToast(text) {
    this.toast = text;
    this.toastAlpha = 1;
  }

  levelClearStats() {
    return {
      levelName: this.level.name,
      timeText: formatTime(this.timeSeconds),
      loot: `${this.player.lootCollected}/${this.level.loot.length}`,
      alarms: this.alarms,
    };
  }

  // --- render ------------------------------------------------------

  render() {
    const state = {
      grid: this.grid,
      level: this.level,
      player: this.player,
      guards: this.guards,
      detection: this.detection,
      timeSeconds: this.timeSeconds,
      alarms: this.alarms,
      pulse: this.pulse,
      noiseRing: this.noiseRing,
    };
    if (this.phase === 'title') {
      this.renderer.drawTitle();
      return;
    }
    this.renderer.drawWorld(state);
    if (this.phase === 'playing' || this.phase === 'paused') {
      this.renderer.drawHud(state);
      this.renderer.drawToast(this.toast, this.toastAlpha);
    }
    if (this.phase === 'paused') this.renderer.drawPaused();
    else if (this.phase === 'caught') this.renderer.drawCaught(this.level.name);
    else if (this.phase === 'levelclear') this.renderer.drawLevelClear(this.levelClearStats());
    else if (this.phase === 'victory') this.renderer.drawVictory(this.victoryStats);
  }

  // --- loop --------------------------------------------------------

  run() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!this.staged) this.update(dt);
      this.render();
      if (!this.staged) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

// Boot: build the game, stage a screenshot scene when asked, and go.
const canvas = document.getElementById('game');
const game = new Game(canvas);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, game);
  game.render();
} else {
  game.run();
}
// Exposed for playtesting from the browser console.
window.__nightshift = game;
