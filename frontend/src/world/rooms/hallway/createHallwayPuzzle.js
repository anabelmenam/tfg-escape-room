import * as THREE from "three";
import { Key, Paper } from "../../objects/index.js";
import { ClockPuzzle, HallwayMazeMirror } from "../../puzzles/index.js";
import { MazePuzzle } from "../../puzzles/MazePuzzle.js";
import { drawMaze } from "../../puzzles/mazeLayout.js";

const createHallwayPuzzle = ({ character, testMode, onFocus, onAction }) => {
  let clockSolved = testMode;
  const note = new Paper({
    id: "hallway-maze-note",
    width: .83,
    height: .83,
    position: new THREE.Vector3(-10.25, 5.7, 0),
    content: (ctx, canvas) => drawMaze(ctx, canvas, { solution: true }),
  });
  const noteMesh = note.object3D.children[0];
  noteMesh.material.dispose();
  noteMesh.material = new THREE.MeshStandardMaterial({ map: note.texture, roughness: .95, side: THREE.DoubleSide });
  note.object3D.visible = false;
  note.dispose = () => { note.texture.dispose(); noteMesh.geometry.dispose(); noteMesh.material.dispose(); };
  const revealNote = () => { note.object3D.visible = true; };
  const clock = new ClockPuzzle({ id: `hallway-${character}-clock`, character, position: new THREE.Vector3(-10.25, 5.7, -4.42), onFocus, onSolved: () => { revealNote(); onAction?.("puzzle.solved", "hallway-clock"); } });
  const livingRoomKey = new Key({
    id: "living-room-key",
    onCollect: () => onAction?.("item.pickup", "living-room-key"),
  });
  livingRoomKey.setEnabled(false);
  const maze = character === "dad" ? new MazePuzzle({ position: new THREE.Vector3(16, 5.15, 0), rotationY: Math.PI, onFocus, key: livingRoomKey, canSolve: () => clockSolved, onSolved: () => onAction?.("puzzle.solved", "hallway-maze") }) : null;
  const mirror = new HallwayMazeMirror({ position: new THREE.Vector3(16, 5.15, 0), rotationY: Math.PI, showScrews: character === "dad", onToggle: character === "dad" ? () => onAction?.("object.interact", "hallway-maze-mirror") : null });
  if (testMode && maze) { maze.available = true; mirror.setReleased(true); mirror.setOpen(true); }
  const applyState = (state) => {
    clockSolved = Boolean(state.characters?.mum?.puzzles?.["hallway-clock"]?.solved) || testMode;
    maze?.trySolve();
    if (clockSolved && character === "mum") { clock.solve({ notify: false }); revealNote(); }
    if (state.characters?.dad?.puzzles?.["hallway-maze"]?.solved) maze?.solve({ notify: false });
    if (state.inventories?.dad?.includes("living-room-key")) {
      livingRoomKey.object3D.visible = false;
      livingRoomKey.setEnabled(false);
    }
    if (character === "dad") {
      const mirrorState = state.characters?.dad?.objects?.["hallway-maze-mirror"];
      mirror.setReleased(Boolean(mirrorState?.released));
      mirror.setOpen(Boolean(mirrorState?.open));
    }
  };
  return { note, clock, livingRoomKey, maze, mirror, applyState };
};
export { createHallwayPuzzle };
