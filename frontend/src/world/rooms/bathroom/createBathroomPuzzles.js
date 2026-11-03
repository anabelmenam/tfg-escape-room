import * as THREE from "three";
import { FinalKey, Lock, Screwdriver } from "../../objects/index.js";
import { BathroomMosaicPuzzle, BathroomSteamPuzzle, STEAM_SEQUENCE } from "../../puzzles/index.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const createSinkWaterControl = (vanity) => {
  let running = false;
  return {
    id: "bathroom-dad-sink-water",
    object3D: vanity.faucet,
    enabled: true,
    interact: () => {
      running = !running;
      vanity.setWaterRunning(running);
      const lever = vanity.faucet.userData.lever;
      if (lever) lever.rotation.x = running ? -Math.PI / 5 : 0;
    },
    getInteractionText: () => (running ? tInteraction("turnOff", tItem("tap")) : tInteraction("turnOn", tItem("tap"))),
  };
};

const createBathroomPuzzles = ({ character, testMode, vanity, onFocus, onAction }) => {
  let hotWaterClueKnown = testMode;
  const steam =
    character === "mum"
      ? new BathroomSteamPuzzle({
          faucet: vanity.faucet,
          vanity,
          onSolved: () => onAction?.("puzzle.solved", "bathroom-hot-water"),
        })
      : null;
  const sinkWaterControl = character === "dad" ? createSinkWaterControl(vanity) : null;
  const screwdriver =
    character === "dad" ? new Screwdriver({ onCollect: () => onAction?.("item.pickup", "screwdriver") }) : null;
  screwdriver?.setEnabled(false);
  if (screwdriver) vanity.addObjectToDrawer(0, screwdriver.object3D, new THREE.Vector3(0.45, -0.08, -0.55));
  const sequenceLock =
    character === "dad"
      ? new Lock({
          id: "bathroom-sequence-lock",
          scale: 0.15,
          password: STEAM_SEQUENCE,
          color: 0x263238,
          metalColor: 0xc4c9c8,
          wheelColor: 0x111516,
          onFocus,
          canUnlock: () => hotWaterClueKnown,
          onUnlock: () => {
            vanity.unlockDrawer(0);
            screwdriver?.setEnabled(true);
            onAction?.("puzzle.solved", "bathroom-sequence");
          },
        })
      : null;
  if (sequenceLock) {
    const hanger = new THREE.Group();
    hanger.position.set(-0.04, 0, 0.43);
    hanger.rotation.set(0.08, 0.5, -0.12);
    hanger.add(sequenceLock.object3D);
    sequenceLock.object3D.position.set(0, -0.27, 0);
    sequenceLock.object3D.traverse((child) => {
      child.userData.ignoreAging = true;
    });
    vanity.drawerManager.getDrawer(0).add(hanger);
  }
  const mosaic = new BathroomMosaicPuzzle({
    character,
    onFocus,
    onSolved: () => onAction?.("puzzle.solved", "bathroom-mosaic"),
    onInsert: () => onAction?.("object.interact", "bathroom-mosaic", { operation: "insert-tile" }),
  });
  mosaic.object3D.position.set(2.6, 5.4, 4.82);
  mosaic.object3D.rotation.y = Math.PI;
  mosaic.object3D.scale.setScalar(0.76);
  const finalKey =
    character === "dad"
      ? new FinalKey({
          id: "final-key-bathroom",
          symbol: "wave",
          color: 0x4f91ad,
          onCollect: () => onAction?.("item.pickup", "final-key-bathroom"),
        })
      : null;
  if (finalKey) {
    finalKey.object3D.position.set(0, 0.18, 0);
    finalKey.object3D.rotation.set(0, 0, 0);
    finalKey.object3D.scale.setScalar(0.3);
    finalKey.object3D.visible = false;
    finalKey.setEnabled(false);
    mosaic.rearMount.add(finalKey.object3D);
  }
  if (testMode && screwdriver) {
    screwdriver.object3D.visible = true;
    screwdriver.setEnabled(true);
  }
  if (testMode && character === "dad") {
    mosaic.solve({ notify: false });
    finalKey?.reveal();
  }

  const applyState = (state) => {
    hotWaterClueKnown = Boolean(state.characters?.mum?.puzzles?.["bathroom-hot-water"]?.solved) || testMode;
    if (hotWaterClueKnown && character === "mum") steam?.activate({ notify: false });
    if (hotWaterClueKnown) sequenceLock?.checkCombination();
    if (state.characters?.dad?.puzzles?.["bathroom-sequence"]?.solved && character === "dad") {
      sequenceLock?.setUnlocked();
      vanity.unlockDrawer(0);
      screwdriver?.setEnabled(true);
    }
    if (screwdriver && state.inventories?.dad?.includes("screwdriver")) {
      screwdriver.object3D.visible = false;
      screwdriver.setEnabled(false);
    }
    const mosaicState = state.characters?.dad?.puzzles?.["bathroom-mosaic"];
    if (mosaicState?.tileInserted && character === "dad") mosaic.insertMissingTile();
    if (mosaicState?.solved) {
      if (character === "dad") {
        mosaic.solve({ notify: false });
        const unavailable =
          state.inventories?.dad?.includes("final-key-bathroom") ||
          ["mum", "dad"].some((era) => state.characters?.[era]?.objects?.["final-bolt-bathroom"]?.unlocked);
        if (!unavailable) finalKey?.reveal();
        else if (finalKey) {
          finalKey.object3D.visible = false;
          finalKey.setEnabled(false);
        }
      }
    }
  };
  return { steam, sinkWaterControl, screwdriver, sequenceLock, mosaic, finalKey, applyState };
};
export { createBathroomPuzzles };
