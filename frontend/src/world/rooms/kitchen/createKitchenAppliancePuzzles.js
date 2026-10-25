import * as THREE from "three";
import { MosaicTile, OvenControlPuzzle, StovePuzzle } from "../../puzzles/index.js";

const createKitchenAppliancePuzzles = ({ character, testMode, furniture, onFocus, onAction }) => {
  const { cooktopCounter, oven } = furniture;
  let tableSolved = testMode;
  let stoveSolved = testMode;
  const stove = new StovePuzzle({
    character,
    onFocus,
    canSolve: () => tableSolved,
    onSolved: () => {
      stoveSolved = true;
      ovenControls.setAvailable(true);
      ovenControls.trySolve();
      ovenControls.revealClue();
      onAction?.("puzzle.solved", "kitchen-stove");
    },
  });
  stove.object3D.position.set(0, 0, 0);
  cooktopCounter.object3D.add(stove.object3D);

  const ovenControls = new OvenControlPuzzle({
    character,
    onFocus,
    canSolve: () => stoveSolved,
    onSolved: () => {
      if (character === "mum" && ovenDoor) ovenDoor.enabled = true;
      onAction?.("puzzle.solved", "kitchen-oven");
    },
  });
  if (character === "mum") ovenControls.object3D.position.set(0, 4.68, 1.49);
  else {
    ovenControls.object3D.position.set(0, 4.68, 1.49);
    ovenControls.object3D.scale.setScalar(.8);
  }
  oven.object3D.add(ovenControls.object3D);
  if (character === "dad") stove.setAvailable(true);
  if (character === "mum") ovenControls.setAvailable(true);

  let tileTaken = false;
  const mosaicTile = character === "dad"
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
    if (character !== "dad") return;
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
    tableSolved = Boolean(state.characters?.dad?.puzzles?.["kitchen-family-table"]?.solved) || testMode;
    stove.trySolve();
    stoveSolved = Boolean(state.characters?.dad?.puzzles?.["kitchen-stove"]?.solved) || testMode;
    if (stoveSolved) {
      if (character === "dad") stove.solve({ notify: false });
      ovenControls.setAvailable(true);
      if (character === "dad") ovenControls.revealClue();
    }
    ovenControls.trySolve();
    const ovenSolved = Boolean(state.characters?.mum?.puzzles?.["kitchen-oven"]?.solved);
    if (ovenSolved) {
      if (character === "mum") {
        ovenControls.solve({ notify: false });
        if (ovenDoor) ovenDoor.enabled = true;
      }
      openOvenWithReward();
    }
    if (mosaicTile && (state.inventories?.dad?.includes("bathroom-mosaic-tile")
      || state.characters?.dad?.puzzles?.["bathroom-mosaic"]?.tileInserted)) {
      tileTaken = true;
      mosaicTile.object3D.visible = false;
      mosaicTile.setEnabled(false);
    }
  };

  return { stove, ovenControls, mosaicTile, openOvenWithReward, applyState };
};

export { createKitchenAppliancePuzzles };
