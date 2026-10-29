/* Loop principal do jogo. */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CONFIG.VIEW_W = window.innerWidth;
    CONFIG.VIEW_H = window.innerHeight;
  }
  handleResize();
  window.addEventListener('resize', handleResize);

  Input.init();
  UI.init();
  Player.init();

  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); // limita saltos ao trocar de aba
    last = now;

    const near = World.nearestInteractable();

    if (UI.isDialogOpen) {
      // Com o diálogo aberto o jogador fica parado
      if (Input.wasPressed('cancel') || Input.wasPressed('interact')) UI.closeDialog();
    } else {
      Player.update(dt, World.solids, near);
      if (near && Input.wasPressed('interact')) UI.openDialog(near);
    }

    UI.showPrompt(!!near);
    World.updateCamera();

    ctx.clearRect(0, 0, CONFIG.VIEW_W, CONFIG.VIEW_H);
    World.draw(ctx, near);

    Input.endFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
