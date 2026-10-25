import * as THREE from "three";
import { FinalKey, Paper } from "../../objects/index.js";
import { RadioPuzzle, SewingBoxPuzzle } from "../../puzzles/index.js";

const createBedroomRadioPuzzle = ({
  timeline,
  testMode,
  clues,
  furniture,
  items,
  onFocus,
  onAction,
}) => {
  const { cabinet, nightstand1 } = furniture;
  const { key, radioDial } = items;
  const planPaper = timeline === "past"
    ? new Paper({
        id: "bedroom-electrical-plan",
        width: 2.45,
        height: 1.63,
        imagePath: "/images/puzzles/electrical-plan-lights.png",
        imageFit: "cover",
        imagePadding: 0,
        collectible: true,
        itemName: "electrical-plan",
        inspectionTitle: "plano eléctrico",
        onCollect: () => {
          clues.electricalPlan = true;
          onAction?.("item.pickup", "bedroom-electrical-plan");
        },
      })
    : null;
  if (planPaper) {
    planPaper.object3D.visible = false;
    planPaper.setEnabled(false);
  }

  const radio = timeline === "past"
    ? new RadioPuzzle({
        id: "bedroom-radio",
        position: new THREE.Vector3(0, 3.52, 0),
        rotationY: 0,
        scale: 0.5,
        onFocus,
        key,
        dialItem: testMode ? null : radioDial,
        onDialInserted: () => onAction?.("object.interact", "bedroom-radio", { operation: "insert-dial" }),
        canSolve: () => clues.radioNote,
        onSolved: () => onAction?.("puzzle.solved", "bedroom-radio"),
      })
    : null;
  if (radio) cabinet.object3D.add(radio.object3D);

  const finalKey = timeline === "present"
    ? new FinalKey({
        id: "final-key-bedroom",
        symbol: "moon",
        color: 0x9aa7ba,
        onCollect: () => onAction?.("item.pickup", "final-key-bedroom"),
      })
    : null;
  if (finalKey) {
    finalKey.object3D.position.set(-.4, 3.45, .3);
    finalKey.object3D.visible = false;
    finalKey.setEnabled(false);
    cabinet.object3D.add(finalKey.object3D);
  }

  const radioNote = timeline === "present"
    ? new Paper({
        id: "bedroom-radio-note",
        position: new THREE.Vector3(1.5, 0.08, -3),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        width: 2.1,
        height: 1.35,
        onFocus,
        imagePath: "/images/puzzles/radio-program-note.png",
        imageFit: "cover",
        imagePadding: 0,
        collectible: true,
        itemName: "radio-program-note",
        inspectionTitle: "programación nocturna",
        onCollect: () => {
          clues.radioNote = true;
          onAction?.("item.pickup", "bedroom-radio-note");
        },
      })
    : null;

  const sewingBox = timeline === "past"
    ? new SewingBoxPuzzle({
        id: "bedroom-sewing-box",
        position: new THREE.Vector3(-6, 3, -6),
        scale: 0.26,
        onFocus,
        planPaper,
        canSolve: () => clues.familyPhoto,
        onSolved: () => onAction?.("puzzle.solved", "bedroom-sewing-box"),
      })
    : null;
  if (sewingBox) nightstand1.addObjectToDrawer(0, sewingBox.object3D, new THREE.Vector3(-0.5, -0.1, -0.5));

  const applyState = (state) => {
    const radioSolved = Boolean(state.timelines?.past?.puzzles?.["bedroom-radio"]?.solved);
    if (state.timelines?.past?.objects?.["bedroom-radio"]?.hasDial) radio?.restoreDialState();
    const sewingSolved = Boolean(state.timelines?.past?.puzzles?.["bedroom-sewing-box"]?.solved);
    if (radioSolved) radio?.restoreSolvedState();
    if (sewingSolved) sewingBox?.solve({ notify: false });
    else sewingBox?.trySolve();
    clues.radioNote ||= Boolean(state.inventories?.present?.includes("bedroom-radio-note")
      || radioSolved);
    clues.electricalPlan ||= Boolean(state.inventories?.past?.includes("bedroom-electrical-plan")
      || state.timelines?.present?.puzzles?.["bedroom-electrical-panel"]?.solved);
    if (radioNote && (clues.radioNote || radioSolved)) {
      radioNote.object3D.visible = false;
      radioNote.setEnabled(false);
    }
    if (planPaper && (clues.electricalPlan || state.timelines?.present?.puzzles?.["bedroom-electrical-panel"]?.solved)) {
      planPaper.object3D.visible = false;
      planPaper.setEnabled(false);
    }
    if (finalKey) {
      const earned = radioSolved;
      const unavailable = state.inventories?.present?.includes("final-key-bedroom")
        || ["past", "present"].some((era) => state.timelines?.[era]?.objects?.["final-bolt-bedroom"]?.unlocked);
      if (earned && !unavailable) finalKey.reveal();
      else if (unavailable) {
        finalKey.object3D.visible = false;
        finalKey.setEnabled(false);
      }
    }
  };

  return { planPaper, radio, finalKey, radioNote, sewingBox, applyState };
};

export { createBedroomRadioPuzzle };
