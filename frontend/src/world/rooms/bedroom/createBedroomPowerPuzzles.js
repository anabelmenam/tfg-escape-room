import * as THREE from "three";
import { AlarmClock, Lock, Safe } from "../../objects/index.js";
import { ElectricalPanelPuzzle, FamilyPhotoPuzzle, LightRevealPuzzle } from "../../puzzles/index.js";

const createBedroomPowerPuzzles = ({
  timeline,
  testMode,
  clues,
  furniture,
  fixtures,
  decor,
  items,
  onFocus,
  onAction,
}) => {
  const { desk } = furniture;
  const { lightSwitch1, lightSwitch2 } = fixtures;
  const { deskLamp, deskPaper } = decor;
  const lightRevealPuzzle = timeline === "present"
    ? new LightRevealPuzzle({
        id: "bedroom-light-reveal-puzzle",
        deskLamp,
        paper: deskPaper,
        onSolved: () => {
          clues.revealedSymbols = true;
          onAction?.("puzzle.solved", "bedroom-light-reveal-puzzle");
        },
      })
    : null;
  const electricalPanel = timeline === "present"
    ? new ElectricalPanelPuzzle({
        id: "electrical-panel",
        position: new THREE.Vector3(-7.5, 5.5, 10),
        rotationY: Math.PI / 2,
        scale: 0.5,
        onFocus,
        onFuseInserted: () => onAction?.("object.interact", "bedroom-electrical-panel", { operation: "insert-fuse" }),
        onSolved: () => {
          lightSwitch1.setPowerAvailable(true);
          lightSwitch2.setPowerAvailable(true);
          deskLamp.setPowerAvailable(true);
          onAction?.("puzzle.solved", "bedroom-electrical-panel");
        },
        canSolve: () => clues.electricalPlan,
      })
    : null;
  if (testMode && electricalPanel) {
    electricalPanel.hasFuse = true;
    electricalPanel.fuse.visible = true;
    deskLamp.setPowerAvailable(true);
    lightSwitch1.setPowerAvailable(true);
    lightSwitch2.setPowerAvailable(true);
  }

  const lock = timeline === "present"
    ? new Lock({
        id: "bedroom-lock",
        position: new THREE.Vector3(4.95, 2.3, 6.6),
        rotationY: Math.PI / 4,
        scale: 0.15,
        digits: 4,
        password: "0328",
        onUnlock: () => {
          desk.unlockDrawer(0);
          onAction?.("object.interact", "bedroom-lock");
        },
        onFocus,
      })
    : null;
  if (lock) desk.addObjectToDrawer(0, lock.object3D, new THREE.Vector3(0, -0.25, 0.25));

  const alarmClock = new AlarmClock({
    id: "bedroom-alarm-clock",
    position: new THREE.Vector3(3, 2.8, -11),
    rotationY: -Math.PI / 5,
    scale: 0.55,
    time: "03:28",
    isBroken: timeline === "present",
  });
  const safe = timeline === "past"
    ? new Safe({
        id: "bedroom-symbol-safe",
        position: new THREE.Vector3(7, 2.5, -1.5),
        rotationY: -Math.PI / 2,
        scale: 0.55,
        symbols: ["□", "△", "✕", "☆", "○", "◇"],
        password: ["△", "○", "□", "✕"],
        onFocus,
        onUnlock: (targetSafe) => {
          targetSafe.open();
          onAction?.("object.interact", "bedroom-symbol-safe");
        },
        canUnlock: () => clues.revealedSymbols,
      })
    : null;
  if (safe && items.radioDial) {
    safe.addItem(items.radioDial, {
      position: new THREE.Vector3(0, 0.35, 0.72),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1,
    });
  }
  const familyPhoto = timeline === "present"
    ? new FamilyPhotoPuzzle({
        id: "bedroom-family-photo",
        position: new THREE.Vector3(7.92, 6, 2.5),
        rotationY: -Math.PI / 2,
        scale: 0.7,
        onFocus,
        onSolved: () => onAction?.("puzzle.solved", "bedroom-family-photo"),
      })
    : null;

  const applyState = (state) => {
    const lightSolved = Boolean(state.timelines?.present?.puzzles?.["bedroom-light-reveal-puzzle"]?.solved);
    const electricalSolved = Boolean(state.timelines?.present?.puzzles?.["bedroom-electrical-panel"]?.solved);
    const electricalState = state.timelines?.present?.objects?.["bedroom-electrical-panel"];
    clues.revealedSymbols ||= lightSolved;
    clues.familyPhoto ||= Boolean(state.timelines?.present?.puzzles?.["bedroom-family-photo"]?.solved);
    if (lightSolved) {
      lightRevealPuzzle?.solve({ notify: false });
      lightRevealPuzzle?.setRevealed(true);
    }
    electricalPanel?.applyState({ hasFuse: electricalState?.hasFuse, solved: electricalSolved });
    if (!electricalSolved) electricalPanel?.trySolve();
    if (electricalSolved) {
      lightSwitch1.setPowerAvailable(true);
      lightSwitch2.setPowerAvailable(true);
      deskLamp.setPowerAvailable(true);
    }
    if (state.timelines?.present?.objects?.["bedroom-lock"]?.open) desk.unlockDrawer(0);
    if (state.timelines?.past?.objects?.["bedroom-symbol-safe"]?.open) safe?.open();
    else safe?.checkPassword();
    if (state.timelines?.present?.puzzles?.["bedroom-family-photo"]?.solved) familyPhoto?.solve({ notify: false });
  };

  return { lightRevealPuzzle, electricalPanel, lock, alarmClock, safe, familyPhoto, applyState };
};

export { createBedroomPowerPuzzles };
