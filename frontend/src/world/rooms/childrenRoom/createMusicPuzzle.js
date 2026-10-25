import * as THREE from "three";
import { BoltCutters } from "../../objects/index.js";
import { MusicPuzzle } from "../../puzzles/index.js";

const createMusicPuzzle = ({ timeline, testMode, desk, onFocus, onAction }) => {
  const boltCutters = timeline === "past"
    ? new BoltCutters({ onCollect: () => onAction?.("item.pickup", "bolt-cutters") })
    : null;
  if (boltCutters) {
    boltCutters.object3D.position.set(0, .52, 0);
    boltCutters.object3D.rotation.z = Math.PI / 2;
    boltCutters.object3D.scale.setScalar(.55);
  }
  const puzzle = new MusicPuzzle({
    timeline,
    onFocus,
    onSolved: () => {
      boltCutters?.reveal();
      onAction?.("puzzle.solved", "children-music");
    },
    onKeyInserted: () => onAction?.("puzzle.solved", "children-music-key"),
    previewOpenOnPlay: testMode,
  });
  if (timeline === "present") puzzle.setAvailable(true);
  puzzle.object3D.position.set(0, 3.31, 0);
  puzzle.object3D.scale.setScalar(0.68);
  desk.object3D.add(puzzle.object3D);
  if (boltCutters) puzzle.object3D.add(boltCutters.object3D);

  const applyState = (state) => {
    const keyInserted = Boolean(state.timelines?.past?.puzzles?.["children-music-key"]?.solved);
    if (keyInserted) {
      puzzle.setKeyInserted({ notify: false });
      puzzle.setAvailable(true);
    }
    const solved = Boolean(state.timelines?.present?.puzzles?.["children-music"]?.solved);
    if (solved) {
      puzzle.solve({ notify: false });
      puzzle.openBox();
      boltCutters?.reveal();
    }
    const chainsCut = Boolean(state.timelines?.past?.puzzles?.["children-wardrobe-chains"]?.solved);
    if (boltCutters && (state.inventories?.past?.includes("bolt-cutters") || chainsCut)) {
      boltCutters.object3D.visible = false;
      boltCutters.setEnabled(false);
    }
  };
  return { puzzle, boltCutters, applyState };
};

export { createMusicPuzzle };
