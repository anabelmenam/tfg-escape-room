import * as THREE from "three";
import { FinalKey, Lock, Screwdriver } from "../../objects/index.js";
import { BathroomMosaicPuzzle, BathroomSteamPuzzle, STEAM_SEQUENCE } from "../../puzzles/index.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const createSinkWaterControl = (vanity) => {
  let running = false;
  return {
    id: "bathroom-present-sink-water", object3D: vanity.faucet, enabled: true,
    interact: () => { running = !running; vanity.setWaterRunning(running); const lever = vanity.faucet.userData.lever; if (lever) lever.rotation.x = running ? -Math.PI / 5 : 0; },
    getInteractionText: () => running ? tInteraction("turnOff", tItem("tap")) : tInteraction("turnOn", tItem("tap")),
  };
};

const createBathroomPuzzles = ({ timeline, testMode, vanity, onFocus, onAction }) => {
  let hotWaterClueKnown = testMode;
  const steam = timeline === "past" ? new BathroomSteamPuzzle({ faucet: vanity.faucet, vanity, onSolved: () => onAction?.("puzzle.solved", "bathroom-hot-water") }) : null;
  const sinkWaterControl = timeline === "present" ? createSinkWaterControl(vanity) : null;
  const screwdriver = timeline === "present" ? new Screwdriver({ onCollect: () => onAction?.("item.pickup", "screwdriver") }) : null;
  screwdriver?.setEnabled(false);
  if (screwdriver) vanity.addObjectToDrawer(0, screwdriver.object3D, new THREE.Vector3(.45, -.08, -.55));
  const sequenceLock = timeline === "present" ? new Lock({
    id: "bathroom-sequence-lock", scale: .15, password: STEAM_SEQUENCE, color: 0x263238, metalColor: 0xc4c9c8, wheelColor: 0x111516, onFocus,
    canUnlock: () => hotWaterClueKnown,
    onUnlock: () => { vanity.unlockDrawer(0); screwdriver?.setEnabled(true); onAction?.("puzzle.solved", "bathroom-sequence"); },
  }) : null;
  if (sequenceLock) {
    const hanger = new THREE.Group(); hanger.position.set(-.04, 0, .43); hanger.rotation.set(.08, .5, -.12); hanger.add(sequenceLock.object3D);
    sequenceLock.object3D.position.set(0, -.27, 0); sequenceLock.object3D.traverse((child) => { child.userData.ignoreAging = true; });
    vanity.drawerManager.getDrawer(0).add(hanger);
  }
  const mosaic = new BathroomMosaicPuzzle({ timeline, onFocus, onSolved: () => onAction?.("puzzle.solved", "bathroom-mosaic"), onInsert: () => onAction?.("object.interact", "bathroom-mosaic", { operation: "insert-tile" }) });
  mosaic.object3D.position.set(2.6, 5.4, 4.82); mosaic.object3D.rotation.y = Math.PI; mosaic.object3D.scale.setScalar(.76);
  const finalKey = timeline === "past" ? new FinalKey({ id: "final-key-bathroom", symbol: "wave", color: 0x4f91ad, onCollect: () => onAction?.("item.pickup", "final-key-bathroom") }) : null;
  if (finalKey) { finalKey.object3D.position.set(0, 0, .58); finalKey.object3D.scale.setScalar(.42); finalKey.object3D.visible = false; finalKey.setEnabled(false); mosaic.compartment.add(finalKey.object3D); }
  if (testMode && screwdriver) { screwdriver.object3D.visible = true; screwdriver.setEnabled(true); }

  const applyState = (state) => {
    hotWaterClueKnown = Boolean(state.timelines?.past?.puzzles?.["bathroom-hot-water"]?.solved) || testMode;
    if (hotWaterClueKnown && timeline === "past") steam?.activate({ notify: false });
    if (state.timelines?.present?.puzzles?.["bathroom-sequence"]?.solved && timeline === "present") { sequenceLock?.setUnlocked(); vanity.unlockDrawer(0); screwdriver?.setEnabled(true); }
    if (screwdriver && state.inventories?.present?.includes("screwdriver")) { screwdriver.object3D.visible = false; screwdriver.setEnabled(false); }
    const mosaicState = state.timelines?.present?.puzzles?.["bathroom-mosaic"];
    if (mosaicState?.tileInserted && timeline === "present") mosaic.insertMissingTile();
    if (mosaicState?.solved) {
      if (timeline === "present") mosaic.solve({ notify: false });
      else {
        mosaic.revealCompartment();
        const unavailable = state.inventories?.past?.includes("final-key-bathroom") || ["past", "present"].some((era) => state.timelines?.[era]?.objects?.["final-bolt-bathroom"]?.unlocked);
        if (!unavailable) finalKey?.reveal();
        else if (finalKey) { finalKey.object3D.visible = false; finalKey.setEnabled(false); }
      }
    }
  };
  return { steam, sinkWaterControl, screwdriver, sequenceLock, mosaic, finalKey, applyState };
};
export { createBathroomPuzzles };
