class LightRevealPuzzle {
  constructor({ id, deskLamp, paper, onSolved } = {}) {
    if (!deskLamp || !paper) {
      throw new Error("LightRevealPuzzle necesita una lámpara de escritorio y un papel.");
    }

    this.id = id;
    this.solved = false;
    this.onSolved = onSolved;
    this.deskLamp = deskLamp;
    this.paper = paper;
    this.isRevealed = deskLamp.getActive();
    const previousOnToggle = deskLamp.onToggle;

    deskLamp.onToggle = (active, lamp) => {
      previousOnToggle?.(active, lamp);
      this.setRevealed(active);
    };

    this.updatePaperSymbols();
  }

  solve({ notify = true } = {}) {
    if (this.solved) return;

    this.solved = true;
    if (notify) this.onSolved?.();
  }

  setRevealed(revealed) {
    this.isRevealed = revealed;
    this.updatePaperSymbols();

    if (revealed) {
      this.solve();
    }
  }

  updatePaperSymbols() {
    this.paper.setContent((context, canvas) => {
      if (!this.isRevealed) {
        return;
      }

      context.strokeStyle = "#5a2d18";
      context.lineWidth = 18;
      context.lineCap = "round";
      context.lineJoin = "round";

      const positions = [180, 400, 620, 840];
      const centerY = canvas.height / 2;
      const size = 78;

      this.drawTriangle(context, positions[0], centerY, size);
      this.drawCircle(context, positions[1], centerY, size);
      this.drawSquare(context, positions[2], centerY, size);
      this.drawCross(context, positions[3], centerY, size);
    });
  }

  drawTriangle(context, x, y, size) {
    context.beginPath();
    context.moveTo(x, y - size);
    context.lineTo(x - size, y + size);
    context.lineTo(x + size, y + size);
    context.closePath();
    context.stroke();
  }

  drawCircle(context, x, y, size) {
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.stroke();
  }

  drawSquare(context, x, y, size) {
    context.beginPath();
    context.rect(x - size, y - size, size * 2, size * 2);
    context.stroke();
  }

  drawCross(context, x, y, size) {
    context.beginPath();
    context.moveTo(x - size, y - size);
    context.lineTo(x + size, y + size);
    context.moveTo(x + size, y - size);
    context.lineTo(x - size, y + size);
    context.stroke();
  }

  reset() {
    this.solved = false;
    this.deskLamp.setActive(false, { notify: false });
    this.setRevealed(false);
  }
}

export { LightRevealPuzzle };
