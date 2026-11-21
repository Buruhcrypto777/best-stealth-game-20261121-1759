// Input: keyboard and mouse, read by the game loop.
// WASD / arrows move, Shift sneaks, Q or a mouse click tosses a
// coin toward the pointer, P pauses, R restarts, M mutes, Enter
// starts or advances. Clicks on menus are reported separately so
// the game can start and restart from a mouse alone.

export class Input {
  constructor(canvas) {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.sneak = false;
    this.clicked = null; // { x, y } in canvas pixels, consumed by the loop
    this.pressedKeys = new Set();
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      this.pressedKeys.add(event.key.toLowerCase());
      this.refreshHeldKeys();
    });
    window.addEventListener('keyup', (event) => {
      this.pressedKeys.delete(event.key.toLowerCase());
      this.refreshHeldKeys();
    });
    window.addEventListener('blur', () => {
      this.pressedKeys.clear();
      this.refreshHeldKeys();
    });
    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.clicked = {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    });
  }

  refreshHeldKeys() {
    const k = this.pressedKeys;
    this.up = k.has('w') || k.has('arrowup');
    this.down = k.has('s') || k.has('arrowdown');
    this.left = k.has('a') || k.has('arrowleft');
    this.right = k.has('d') || k.has('arrowright');
    this.sneak = k.has('shift');
  }

  // True once for each press of the key, until the loop reads it.
  wasPressed(key) {
    const lower = key.toLowerCase();
    if (!this.pressedKeys.has(lower)) return false;
    this.pressedKeys.delete(lower);
    this.refreshHeldKeys();
    return true;
  }

  takeClick() {
    const click = this.clicked;
    this.clicked = null;
    return click;
  }

  clear() {
    this.pressedKeys.clear();
    this.clicked = null;
    this.refreshHeldKeys();
  }
}
