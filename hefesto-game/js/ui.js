/* Interface HTML sobreposta ao canvas: dica de interação e diálogo. */
const UI = {
  isDialogOpen: false,

  init() {
    this.prompt = document.getElementById('prompt');
    this.dialog = document.getElementById('dialog');
    document.getElementById('dialog-close').addEventListener('click', () => this.closeDialog());
  },

  showPrompt(visible) {
    this.prompt.classList.toggle('hidden', !visible || this.isDialogOpen);
  },

  openDialog(c) {
    document.getElementById('dialog-title').textContent = c.name;
    document.getElementById('dialog-role').textContent = c.role;
    document.getElementById('dialog-text').textContent = c.text;
    document.getElementById('dialog-fun').textContent = c.fun || '';
    this.dialog.classList.remove('hidden');
    this.prompt.classList.add('hidden');
    this.isDialogOpen = true;
  },

  closeDialog() {
    this.dialog.classList.add('hidden');
    this.isDialogOpen = false;
  }
};
