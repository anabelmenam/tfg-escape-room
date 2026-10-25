import * as THREE from "three";
import { MosaicTile, OvenControlPuzzle, StovePuzzle } from "../../puzzles/index.js";

const createKitchenAppliancePuzzles = ({ timeline, testMode, furniture, onFocus, onAction }) => {
  const { cooktopCounter, oven } = furniture;
  const stove = new StovePuzzle({
    timeline,
    onFocus,
    onSolved: () => {
      ovenControls.setAvailable(true);
      ovenControls.revealClue();
      onAction?.("puzzle.solved", "kitchen-stove");
    },
  });
  stove.object3D.position.set(0, 0, 0);
  cooktopCounter.object3D.add(stove.object3D);

  const ovenControls = new OvenControlPuzzle({
    timeline,
    onFocus,
    onSolved: () => {
      if (timeline === "past" && ovenDoor) ovenDoor.enabled = true;
      onAction?.("puzzle.solved", "kitchen-oven");
    },
  });
  if (timeline === "past") ovenControls.object3D.position.set(0, 4.68, 1.49);
  else {
    ovenControls.object3D.position.set(0, 3.14, 0);
    ovenControls.object3D.scale.setScalar(.8);
  }
  oven.object3D.add(ovenControls.object3D);

  let tileTaken = false;
  const mosaicTile = timeline === "present"
    ? new MosaicTile({
        onCollect: () => {
          tileTaken = true;
          onAction?.("item.pickup", "bathroom-mosaic-tile");
        },
      })
    : null;
  if (mosaicTile) {
    mosaicTile.object3D.position.set(0, 3.34, .72);
    mosaicTile.object3D.scale.setScalar(.72);
    mosaicTile.object3D.rotation.set(-Math.PI / 2, 0, .12);
    oven.object3D.add(mosaicTile.object3D);
    mosaicTile.object3D.visible = true;
    mosaicTile.setEnabled(false);
  }
  const ovenDoor = oven.getInteractables().find((item) => item.id.endsWith("-oven-panel-1"));
  if (ovenDoor) ovenDoor.enabled = false;
  const openOvenWithReward = () => {
    if (timeline !== "present") return;
    const doorState = oven.panelManager.states[1];
    if (doorState && !doorState.isOpen) oven.panelManager.toggle(1);
    if (mosaicTile && !tileTaken) mosaicTile.reveal();
  };

  if (testMode) {
    stove.setAvailable(true);
    ovenControls.setAvailable(true);
    stove.revealClue();
    openOvenWithReward();
  }

  const applyState = (state) => {
    const stoveSolved = Boolean(state.timelines?.present?.puzzles?.["kitchen-stove"]?.solved);
    if (stoveSolved) {
      if (timeline === "present") stove.solve({ notify: false });
      ovenControls.setAvailable(true);
      if (timeline === "present") ovenControls.revealClue();
    }
    const ovenSolved = Boolean(state.timelines?.past?.puzzles?.["kitchen-oven"]?.solved);
    if (ovenSolved) {
      if (timeline === "past") {
        ovenControls.solve({ notify: false });
        if (ovenDoor) ovenDoor.enabled = true;
      }
      openOvenWithReward();
    }
    if (mosaicTile && (state.inventories?.present?.includes("bathroom-mosaic-tile")
      || state.timelines?.present?.puzzles?.["bathroom-mosaic"]?.tileInserted)) {
      tileTaken = true;
      mosaicTile.object3D.visible = false;
      mosaicTile.setEnabled(false);
    }
  };

  return { stove, ovenControls, mosaicTile, openOvenWithReward, applyState };
};

export { createKitchenAppliancePuzzles };
