class Puzzle {
  constructor({ id, onSolved } = {}) {
    this.id = id;
    this.solved = false;
    this.onSolved = onSolved;
  }

  check() {
    throw new Error("check() must be implemented");
  }

  solve() {
    if (this.solved) return;

    this.solved = true;

    if (this.onSolved) {
      this.onSolved();
    }
  }

  reset() {
    this.solved = false;
  }
}

export { Puzzle };
