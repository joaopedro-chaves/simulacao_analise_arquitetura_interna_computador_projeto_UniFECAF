/* Teclado: estado contínuo (teclas pressionadas) + eventos de "apertou agora". */
const Input = {
  keys: new Set(),
  pressed: new Set(), // teclas apertadas neste frame
  MAP: {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyE: 'interact', Escape: 'cancel'
  },

  init() {
    window.addEventListener('keydown', (e) => {
      const action = this.MAP[e.code];
      if (!action) return;
      e.preventDefault();
      if (!this.keys.has(action)) this.pressed.add(action);
      this.keys.add(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = this.MAP[e.code];
      if (action) this.keys.delete(action);
    });
    window.addEventListener('blur', () => this.keys.clear());
  },

  isDown(a) { return this.keys.has(a); },
  wasPressed(a) { return this.pressed.has(a); },
  endFrame() { this.pressed.clear(); }
};
