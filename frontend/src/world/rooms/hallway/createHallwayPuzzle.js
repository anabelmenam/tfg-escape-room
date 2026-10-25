import * as THREE from "three";
import { Key, Paper } from "../../objects/index.js";
import { ClockPuzzle, HallwayMazeMirror } from "../../puzzles/index.js";
import { MazePuzzle } from "../../puzzles/MazePuzzle.js";
import { drawMaze } from "../../puzzles/mazeLayout.js";

const createHallwayPuzzle = ({ timeline, testMode, onFocus, onAction }) => {
  let clockSolved = testMode;
  const note = new Paper({
    id: "hallway-maze-note",
    width: .83,
    height: .83,
    position: new THREE.Vector3(-10.25, 5.7, -4.42),
    content: (ctx, canvas) => drawMaze(ctx, canvas, { solution: true }),
    onFocus,
    collectible: timeline === "past",
    itemName: "maze-puzzle",
    inspectionTitle: "recorrido del laberinto",
    onCollect: () => onAction?.("item.pickup", "hallway-maze-note"),
  });
  const noteMesh = note.object3D.children[0];
  noteMesh.material.dispose();
  noteMesh.material = new THREE.MeshStandardMaterial({ map: note.texture, roughness: .95, side: THREE.DoubleSide });
  note.object3D.visible = false;
  note.setEnabled(false);
  note.getFocusPosition = () => { note.object3D.updateWorldMatrix(true, false); return note.object3D.localToWorld(new THREE.Vector3(0, 0, 1.2)); };
  note.dispose = () => { note.texture.dispose(); noteMesh.geometry.dispose(); noteMesh.material.dispose(); };
  const revealNote = () => { note.object3D.visible = true; note.setEnabled(true); };
  const clock = new ClockPuzzle({ id: `hallway-${timeline}-clock`, timeline, position: new THREE.Vector3(-10.25, 5.7, -4.42), onFocus, onSolved: () => { revealNote(); onAction?.("puzzle.solved", "hallway-clock"); } });
  const livingRoomKey = new Key({
    id: "living-room-key",
    onCollect: () => onAction?.("item.pickup", "living-room-key"),
  });
  livingRoomKey.setEnabled(false);
  const maze = timeline === "present" ? new MazePuzzle({ position: new THREE.Vector3(16, 5.15, 0), rotationY: Math.PI, onFocus, key: livingRoomKey, canSolve: () => clockSolved, onSolved: () => onAction?.("puzzle.solved", "hallway-maze") }) : null;
  const mirror = new HallwayMazeMirror({ position: new THREE.Vector3(16, 5.15, 0), rotationY: Math.PI, showScrews: timeline === "present", onToggle: timeline === "present" ? () => onAction?.("object.interact", "hallway-maze-mirror") : null });
  if (testMode && maze) { maze.available = true; mirror.setReleased(true); mirror.setOpen(true); }
  const applyState = (state) => {
    clockSolved = Boolean(state.timelines?.past?.puzzles?.["hallway-clock"]?.solved) || testMode;
    maze?.trySolve();
    if (clockSolved && timeline === "past") { clock.solve({ notify: false }); revealNote(); }
    if (timeline === "past" && state.inventories?.past?.includes("hallway-maze-note")) note.setCollected(true);
    if (state.timelines?.present?.puzzles?.["hallway-maze"]?.solved) maze?.solve({ notify: false });
    if (state.inventories?.present?.includes("living-room-key")) {
      livingRoomKey.object3D.visible = false;
      livingRoomKey.setEnabled(false);
    }
    if (timeline === "present") {
      const mirrorState = state.timelines?.present?.objects?.["hallway-maze-mirror"];
      mirror.setReleased(Boolean(mirrorState?.released));
      mirror.setOpen(Boolean(mirrorState?.open));
    }
  };
  return { note, clock, livingRoomKey, maze, mirror, applyState };
};
export { createHallwayPuzzle };
