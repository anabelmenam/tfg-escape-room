class BookPuzzle {
  constructor({ id = "book-puzzle", books = [], onSolved = null } = {}) {
    this.id = id;
    this.solved = false;
    this.onSolved = onSolved;
    this.books = books;
    this.firstBookSelected = null;
    this.secondBookSelected = null;
    this.slotPositions = new Map();

    this.books.forEach((book) => {
      this.slotPositions.set(book.currentSlot, book.object3D.position.clone());
    });
  }

  solve({ notify = true, arrange = false } = {}) {
    if (this.solved) return;

    if (arrange) {
      this.books.forEach((book) => {
        book.currentSlot = book.correctSlot;
        book.object3D.position.copy(this.slotPositions.get(book.correctSlot));
        book.setSelected(false);
        book.setEnabled(false);
      });
    }
    this.solved = true;
    if (notify) this.onSolved?.();
  }

  handleBookInteraction(book) {
    if (book.isAnimating) {
      return;
    }

    if (!this.firstBookSelected) {
      this.firstBookSelected = book;
      book.setSelected(true);
      return;
    }

    if (this.firstBookSelected === book) {
      book.setSelected(false);
      this.firstBookSelected = null;
      return;
    }
    if (this.firstBookSelected.blockInteraction || book.blockInteraction) {
      return;
    }

    this.secondBookSelected = book;

    const firstBook = this.firstBookSelected;
    const secondBook = this.secondBookSelected;
    const firstSlot = firstBook.currentSlot;
    const secondSlot = secondBook.currentSlot;
    const firstTargetPosition = this.slotPositions.get(secondSlot).clone();
    const secondTargetPosition = this.slotPositions.get(firstSlot).clone();

    firstBook.currentSlot = secondSlot;
    secondBook.currentSlot = firstSlot;
    firstBook.animateTo(firstTargetPosition, 0.4);
    secondBook.animateTo(secondTargetPosition, 0.4);

    this.firstBookSelected = null;
    this.secondBookSelected = null;

    setTimeout(() => {
      this.check();
    }, 400);
  }

  check() {
    if (this.solved) {
      return true;
    }

    const isCorrect = this.books.every((book) => {
      return book.currentSlot === book.correctSlot;
    });

    if (isCorrect) {
      this.books.forEach((book) => {
        book.setEnabled(false);
      });
      this.solve();
    }

    return isCorrect;
  }
}

export { BookPuzzle };
