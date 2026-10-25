import * as THREE from "three";
import { GlobePushpin } from "../../objects/index.js";
import { BlockConstructionPuzzle } from "../../puzzles/index.js";

const createBlockPuzzle = ({ timeline, desk, onFocus, onAction }) => {
  const pushpin = timeline === "past"
    ? new GlobePushpin({ onCollect: () => onAction?.("item.pickup", "globe-pushpin") })
    : null;
  if (pushpin) {
    pushpin.object3D.position.set(1.9, 3.34, 1.02);
    pushpin.object3D.rotation.z = Math.PI / 2;
    pushpin.object3D.scale.setScalar(.78);
    pushpin.object3D.visible = false;
    pushpin.setEnabled(false);
    desk.object3D.add(pushpin.object3D);
  }
  const revealPushpin = () => {
    if (!pushpin) return;
    pushpin.object3D.visible = true;
    pushpin.setEnabled(true);
  };
  const puzzle = new BlockConstructionPuzzle({
    timeline,
    onFocus,
    onSolved: () => {
      revealPushpin();
      onAction?.("puzzle.solved", "children-blocks");
    },
  });
  puzzle.object3D.scale.setScalar(0.78);
  puzzle.object3D.position.set(0, 3.3 - 1.59 * 0.78 + .34, 0);
  desk.object3D.add(puzzle.object3D);

  const applyState = (state) => {
    const solved = Boolean(state.timelines?.past?.puzzles?.["children-blocks"]?.solved);
    if (solved && timeline === "past") {
      puzzle.solve({ notify: false });
      revealPushpin();
    }
    const inserted = Boolean(state.timelines?.past?.puzzles?.["children-globe-pin"]?.solved);
    const collected = Boolean(state.inventories?.past?.includes("globe-pushpin"));
    if (pushpin && (collected || inserted)) {
      pushpin.object3D.visible = false;
      pushpin.setEnabled(false);
    }
  };
  return { puzzle, pushpin, revealPushpin, applyState };
};

export { createBlockPuzzle };
