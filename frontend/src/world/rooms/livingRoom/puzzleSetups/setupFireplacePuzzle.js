import * as THREE from "three";
import { Cushion, DisplayCase, EmberClue, EmberPuzzle, Fireplace, Match, Paper } from "../../../objects/index.js";

const drawAgedRiddle = (context, canvas) => {
  const { width, height } = canvas;
  const edge = 42;
  context.fillStyle = "#d8bf83";
  context.fillRect(0, 0, width, height);
  const stain = context.createRadialGradient(width * 0.18, height * 0.15, 10, width * 0.18, height * 0.15, width * 0.7);
  stain.addColorStop(0, "rgba(111, 67, 28, 0.16)");
  stain.addColorStop(1, "rgba(111, 67, 28, 0)");
  context.fillStyle = stain;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(84, 48, 24, 0.68)";
  context.lineWidth = 9;
  context.strokeRect(edge, edge, width - edge * 2, height - edge * 2);
  context.strokeStyle = "rgba(111, 67, 28, 0.38)";
  context.lineWidth = 3;
  context.strokeRect(edge + 13, edge + 13, width - (edge + 13) * 2, height - (edge + 13) * 2);
  context.fillStyle = "#4b2b1b";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "italic 62px Georgia, serif";
  context.fillText("A quien encuentre esta carta", width / 2, 115);
  context.font = "42px Georgia, serif";
  [
    "Cuando la flor despierta, nacen tres.",
    "Bajo el sol del verano, arden ocho.",
    "Cuando la hoja cae, queda uno.",
    "Bajo la nieve, duermen seis.",
    "Sigue el año y abre lo que guardamos.",
  ].forEach((line, index) => context.fillText(line, width / 2, 235 + index * 74));
  context.strokeStyle = "rgba(87, 45, 23, 0.5)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width * 0.25, height - 87);
  context.quadraticCurveTo(width * 0.5, height - 63, width * 0.75, height - 87);
  context.stroke();
  context.font = "italic 34px Georgia, serif";
  context.fillText("— La familia", width / 2, height - 52);
};

const setupFireplacePuzzle = ({ character, testMode, sofa, armchairs, onAction, onFocus }) => {
  const fireplace = new Fireplace({
    position: new THREE.Vector3(9, 1.7, -14.2),
    onSolved: () => onAction?.("object.interact", "living-room-fireplace"),
  });
  const displayCase = character === "mum" ? new DisplayCase() : null;
  if (displayCase) {
    displayCase.unlocked = false;
  }

  let hasLetter = false;
  const vitrineLetter =
    character === "mum"
      ? new Paper({
          id: "living-room-vitrine-letter",
          width: 1.1,
          height: 0.7,
          collectible: true,
          itemName: "family-letter",
          paperColor: "#d8bf83",
          backColor: "#c5a66d",
          content: drawAgedRiddle,
          inspectionTitle: "Carta familiar envejecida",
          inspectionTranslationKey: "papers.living-room-vitrine-letter",
          onCollect: () => {
            hasLetter = true;
            onAction?.("item.pickup", "living-room-vitrine-letter");
          },
        })
      : null;

  if (vitrineLetter && displayCase) {
    vitrineLetter.object3D.position.set(0.34, 0.185, 0.08);
    vitrineLetter.object3D.rotation.set(Math.PI / 2, 0, -0.08);
    vitrineLetter.object3D.visible = true;
    vitrineLetter.setEnabled(false);
    displayCase.object3D.add(vitrineLetter.object3D);
    displayCase.onOpen = () => {
      vitrineLetter.object3D.visible = true;
      vitrineLetter.setEnabled(true);
      onAction?.("object.interact", "living-room-display-case");
    };
  }

  const emberClue = character === "dad" ? new EmberClue() : null;
  const emberPuzzle =
    character === "mum"
      ? new EmberPuzzle({
          onFocus,
          onSolved: () => {
            displayCase?.unlock();
            onAction?.("puzzle.solved", "living-room-embers");
          },
        })
      : null;

  emberClue?.object3D.position.set(0, 1.62, 0.18);
  if (emberClue) {
    emberClue.object3D.visible = false;
  }
  emberPuzzle?.object3D.position.set(-1.12, -0.98, 0.03);
  emberPuzzle?.object3D.scale.setScalar(0.42);

  if (emberClue) {
    fireplace.object3D.add(emberClue.object3D);
  }
  if (emberPuzzle && displayCase) {
    displayCase.frontLid.add(emberPuzzle.object3D);
  }
  if (testMode) {
    emberPuzzle?.reveal();
  }

  const match = new Match({ onCollect: () => onAction?.("item.pickup", "living-room-match") });
  let cushion;

  const collectMatch = (player) => {
    sofa.object3D.updateWorldMatrix(true, true);
    const matchPosition = cushion.object3D.getWorldPosition(new THREE.Vector3());
    sofa.object3D.worldToLocal(matchPosition);
    match.object3D.position.copy(matchPosition);
    sofa.object3D.add(match.object3D);
    match.object3D.visible = true;
    match.setEnabled(true);
    match.interact(player);
  };
  const cushionOptions = {
    id: "living-room-sofa-cushion",
    parent: sofa.object3D,
    position: new THREE.Vector3(-2.1, 1.55, 0.1),
    rotation: new THREE.Euler(-0.2, 1, 0.2),
    color: 0x493027,
  };

  cushion =
    character === "dad"
      ? new Cushion({
          ...cushionOptions,
          accentColor: 0xdab77d,
          sewn: true,
          onCut: () => onAction?.("object.interact", "living-room-sofa-cushion"),
          onSearch: (player) => {
            collectMatch(player);
            onAction?.("object.interact", "living-room-sofa-cushion");
          },
        })
      : new Cushion(cushionOptions);

  const decorativeCushions = [
    new Cushion({
      id: "living-room-sofa-cushion-right",
      parent: sofa.object3D,
      position: new THREE.Vector3(2.1, 1.55, -0.15),
      rotation: new THREE.Euler(-0.2, -1, -0.2),
      color: 0x493027,
    }),
    new Cushion({
      id: "living-room-armchair-1-cushion",
      parent: armchairs[0].object3D,
      position: new THREE.Vector3(0, 1.55, -0.28),
      rotation: new THREE.Euler(-0.16, 0, 0),
      color: 0x493027,
    }),
    new Cushion({
      id: "living-room-armchair-2-cushion",
      parent: armchairs[1].object3D,
      position: new THREE.Vector3(0, 1.55, -0.28),
      rotation: new THREE.Euler(-0.16, 0, 0),
      color: 0x493027,
    }),
  ];

  const applyState = (state) => {
    const cushionState = state.characters?.dad?.objects?.["living-room-sofa-cushion"];
    if (character === "dad" && cushionState?.cut && cushion) {
      cushion.setCut();
      cushion.searched = Boolean(cushionState.searched);
    }
    if (state.characters?.dad?.objects?.["living-room-fireplace"]?.open) {
      fireplace.solved = true;
      fireplace.flame.visible = true;
      if (emberClue) emberClue.object3D.visible = true;
      emberPuzzle?.reveal();
    }
    if (state.characters?.mum?.puzzles?.["living-room-embers"]?.solved) {
      emberPuzzle?.solve({ notify: false });
      displayCase?.unlock();
    }
    const displayCaseState = state.characters?.mum?.objects?.["living-room-display-case"];
    if (displayCaseState?.open && displayCase && vitrineLetter) {
      displayCase.setOpened();
      vitrineLetter.object3D.visible = true;
      vitrineLetter.setEnabled(true);
    }
    hasLetter = Boolean(state.inventories?.mum?.includes("living-room-vitrine-letter"));
    const chestOpened = state.characters?.dad?.objects?.["living-room-chest"]?.locked === false;
    if ((hasLetter || chestOpened) && vitrineLetter) {
      vitrineLetter.object3D.visible = false;
      vitrineLetter.setEnabled(false);
    }
  };

  return {
    fireplace,
    displayCase,
    vitrineLetter,
    emberPuzzle,
    cushion,
    match,
    decorativeCushions,
    hasLetter: () => hasLetter,
    applyState,
  };
};

export { setupFireplacePuzzle };
