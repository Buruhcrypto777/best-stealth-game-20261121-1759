// Sound: tiny WebAudio synth, no audio files at all.
// Footsteps, a coin's clink, a keycard blip, the alarm sting and
// the win and lose phrases are all built from oscillators, so the
// game loads nothing over the network and works offline.

export class AudioEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.lastFootstepAt = 0;
  }

  // Browsers only let audio start after a user gesture.
  ensure() {
    if (!this.context) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.context = new AudioContextClass();
      } catch {
        this.context = null;
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // One short tone: frequency, seconds, shape and loudness.
  tone(freq, duration, type = 'sine', volume = 0.08, when = 0) {
    if (!this.context || this.muted) return;
    const startAt = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  // A soft tick under the player's feet; guards' steps are lower.
  footstep(sneaking) {
    if (!this.context || this.muted) return;
    const now = performance.now();
    if (now - this.lastFootstepAt < 120) return;
    this.lastFootstepAt = now;
    this.tone(sneaking ? 140 : 190, 0.05, 'triangle', sneaking ? 0.015 : 0.035);
  }

  coinClink() {
    this.tone(1567, 0.12, 'sine', 0.07);
    this.tone(2093, 0.16, 'sine', 0.05, 0.05);
  }

  pickup() {
    this.tone(660, 0.09, 'sine', 0.08);
    this.tone(990, 0.14, 'sine', 0.08, 0.07);
  }

  keycard() {
    this.tone(523, 0.1, 'square', 0.04);
    this.tone(784, 0.1, 'square', 0.04, 0.09);
    this.tone(1046, 0.18, 'square', 0.04, 0.18);
  }

  // Two-note sting when a guard starts a chase.
  alarm() {
    this.tone(220, 0.16, 'sawtooth', 0.06);
    this.tone(311, 0.22, 'sawtooth', 0.06, 0.14);
  }

  caught() {
    this.tone(196, 0.25, 'sawtooth', 0.07);
    this.tone(147, 0.4, 'sawtooth', 0.07, 0.2);
  }

  levelClear() {
    this.tone(523, 0.12, 'sine', 0.07);
    this.tone(659, 0.12, 'sine', 0.07, 0.1);
    this.tone(784, 0.22, 'sine', 0.07, 0.2);
  }

  victory() {
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((freq, i) => this.tone(freq, 0.16, 'sine', 0.07, i * 0.11));
  }
}
