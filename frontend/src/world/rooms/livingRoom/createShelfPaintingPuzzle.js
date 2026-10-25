import * as THREE from "three";
import { Book, FallenPainting, PaintingSlot, Paper } from "../../objects/index.js";
import { BookPuzzle } from "../../puzzles/index.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const rainbowBookData = [
  ["orange", 0xeb8e3d, 1],
  ["violet", 0xa7679c, 6],
  ["green", 0x71a96d, 3],
  ["red", 0xdf574b, 0],
  ["blue", 0x4d92b8, 4],
  ["yellow", 0xe3c84e, 2],
  ["indigo", 0x6960aa, 5],
];

const createShelfPaintingPuzzle = ({ timeline, testMode, shelf, table, onAction, onFocus }) => {
  const rainbowDrawing = timeline === "past"
    ? new Paper({
        id: "living-room-rainbow-drawing",
        width: 1.8,
        height: 1.2,
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        onFocus,
        focusOffset: new THREE.Vector3(0, -1.5, 2.1),
        imagePath: "/images/puzzles/rainbow-drawing.png",
        imagePadding: 0,
      })
    : null;
  if (rainbowDrawing) {
    rainbowDrawing.object3D.position.set(0, 2.1, 0);
    table.object3D.add(rainbowDrawing.object3D);
  }

  const fallenPainting = new FallenPainting({
    position: new THREE.Vector3(-12.55, 1.5, 9.75),
    rotationY: Math.PI / 2,
    onCollect: () => onAction?.("item.pickup", "living-room-fallen-painting"),
  });
  if (testMode && timeline === "past") fallenPainting.reveal();

  const paintingSlot = new PaintingSlot({
    timeline,
    position: new THREE.Vector3(13.5, 5.2, -3),
    rotationY: -Math.PI / 2,
    onPlaced: () => onAction?.("object.interact", "living-room-painting-slot"),
    onPieceInserted: (index) => onAction?.("object.interact", `living-room-painting-piece-${index}`),
  });
  if (paintingSlot.hiddenScissors) {
    paintingSlot.hiddenScissors.onCollect = () => onAction?.("item.pickup", "living-room-scissors");
  }

  const rainbowBooks = timeline === "present"
    ? rainbowBookData.map(([name, color, correctSlot], currentSlot) => {
        const book = new Book({
          id: `rainbow-book-${name}`,
          color,
          currentSlot,
          correctSlot,
          rotationY: Math.PI / 2,
        });
        shelf.addToShelf(book.object3D, { shelf: 1, x: 1.1 + currentSlot * .52, z: 0 });
        return book;
      })
    : [];

  let booksRevealed = false;
  let shelfIsOpen = false;
  const moveShelf = (open) => {
    if (!booksRevealed || shelfIsOpen === open || shelf.isMechanismMoving) return;
    shelfIsOpen = open;
    shelf.openMechanism({ angle: open ? -Math.PI / 2 : Math.PI / 2, duration: 2, side: "left" });
  };
  const revealResult = () => {
    booksRevealed = true;
    if (timeline === "past") {
      moveShelf(true);
      fallenPainting.reveal();
    }
  };
  const bookPuzzle = timeline === "present"
    ? new BookPuzzle({
        id: "living-room-rainbow-books",
        books: rainbowBooks,
        onSolved: () => {
          revealResult();
          onAction?.("puzzle.solved", "living-room-rainbow-books");
        },
      })
    : null;
  rainbowBooks.forEach((book) => book.setOnInteract(bookPuzzle.handleBookInteraction.bind(bookPuzzle)));

  if (testMode && timeline === "present") paintingSlot.setPlaced(true);
  shelf.interact = () => { if (timeline === "past") moveShelf(!shelfIsOpen); };
  shelf.getInteractionText = () => (
    timeline === "past" && booksRevealed ? tInteraction(shelfIsOpen ? "close" : "open", tItem("shelf")) : null
  );

  const applyState = (state) => {
    if (state.timelines?.present?.puzzles?.["living-room-rainbow-books"]?.solved) {
      bookPuzzle?.solve({ notify: false, arrange: true });
      revealResult();
    }
    const paintingState = state.timelines?.past?.objects?.["living-room-painting-slot"];
    if (paintingState?.placed && timeline === "past") paintingSlot.setPlaced(true);
    for (const index of paintingState?.restoredPieces ?? []) paintingSlot.restorePiece(index);
    if (state.timelines?.past?.puzzles?.["living-room-painting"]?.solved) paintingSlot.setRestored();
  };

  return { rainbowDrawing, fallenPainting, paintingSlot, rainbowBooks, applyState };
};

export { createShelfPaintingPuzzle };
