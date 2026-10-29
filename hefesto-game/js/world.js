/* Mundo: câmera, desenho da placa, trilhas e componentes. */
const World = {
  solids: buildSolids(),
  camera: { x: 0, y: 0 },

  updateCamera() {
    const c = this.camera;
    if (CONFIG.VIEW_W >= CONFIG.WORLD_W) {
      c.x = (CONFIG.WORLD_W - CONFIG.VIEW_W) / 2;
    } else {
      c.x = Player.x + Player.size / 2 - CONFIG.VIEW_W / 2;
      c.x = Math.max(0, Math.min(CONFIG.WORLD_W - CONFIG.VIEW_W, c.x));
    }

    if (CONFIG.VIEW_H >= CONFIG.WORLD_H) {
      c.y = (CONFIG.WORLD_H - CONFIG.VIEW_H) / 2;
    } else {
      c.y = Player.y + Player.size / 2 - CONFIG.VIEW_H / 2;
      c.y = Math.max(0, Math.min(CONFIG.WORLD_H - CONFIG.VIEW_H, c.y));
    }
  },

  /* Componente (dado) mais próximo dentro do alcance de interação, ou null. */
  nearestInteractable() {
    let best = null, bestD = CONFIG.INTERACT_DISTANCE;
    for (const s of this.solids) {
      const d = Player.distanceTo(s);
      if (d <= bestD) { best = s.parent; bestD = d; }
    }
    return best;
  },

  draw(ctx, highlight) {
    ctx.save();
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
    this.drawBoard(ctx);
    this.drawTraces(ctx);
    for (const s of this.solids) this.drawComponent(ctx, s, highlight === s.parent);
    Player.draw(ctx);
    ctx.restore();
  },

  drawBoard(ctx) {
    ctx.fillStyle = '#0b2a22';
    ctx.fillRect(0, 0, CONFIG.WORLD_W, CONFIG.WORLD_H);
    // grade sutil
    ctx.strokeStyle = 'rgba(80, 200, 150, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CONFIG.WORLD_W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.WORLD_H); ctx.stroke(); }
    for (let y = 0; y <= CONFIG.WORLD_H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CONFIG.WORLD_W, y); ctx.stroke(); }
    // borda da placa
    ctx.strokeStyle = '#1f6f55';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, CONFIG.WORLD_W - 6, CONFIG.WORLD_H - 6);
  },

  drawTraces(ctx) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const [lw, col] of [[14, '#124236'], [6, '#2f9b78']]) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = col;
      for (const t of TRACES) {
        ctx.beginPath();
        ctx.moveTo(t[0][0], t[0][1]);
        for (let i = 1; i < t.length; i++) ctx.lineTo(t[i][0], t[i][1]);
        ctx.stroke();
      }
    }
  },

  drawComponent(ctx, s, active) {
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.lineWidth = active ? 4 : 2;
    ctx.strokeStyle = active ? '#ffffff' : s.border;
    ctx.strokeRect(s.x, s.y, s.w, s.h);

    // Rótulo
    ctx.fillStyle = '#10151c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
    if (s.h > s.w * 2) { // peça comprida vertical: texto rotacionado
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 16px monospace';
      ctx.fillText(s.label, 0, 0);
      ctx.restore();
    } else {
      ctx.font = `bold ${s.id === 'cpu' ? 40 : 24}px monospace`;
      ctx.fillText(s.label, cx, cy);
    }
  }
};
