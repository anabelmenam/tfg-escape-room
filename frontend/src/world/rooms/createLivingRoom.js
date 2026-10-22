import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import {
  Door,
  Lamp,
  Key,
  Shelf,
  Cabinet,
  Chest,
  Lock,
  Switch,
  Sofa,
  Table,
  Book,
  Paper,
  Cushion,
  Match,
  Fireplace,
  DisplayCase,
  EmberClue,
  EmberPuzzle,
  FallenPainting,
  PaintingSlot,
  Window,
  FinalKey,
  createBookStack,
  createCandleCluster,
  createPottedPlant,
  createVase,
  createWallFrameCluster,
} from "../objects/index.js";

import { BookPuzzle } from "../puzzles/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

const livingRoomWoodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: {
    x: 1,
    y: 1,
  },
  woodColor: 0x5b3a29,
  darkWoodColor: 0x422a1e,
  interiorColor: 0x6b4734,
  drawerInteriorColor: 0x6b4734,
  handleColor: 0x9b773d,
};

const addCombinationLockHasp = (chest) => {
  const metal = new THREE.MeshStandardMaterial({ color: 0x655744, roughness: 0.48, metalness: 0.72 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x292622, roughness: 0.56, metalness: 0.68 });
  const frontZ = chest.depth / 2 + 0.035;

  // The chest's ornamental key lock would sit behind the combination lock.
  chest.bodyGroup.getObjectByName(`${chest.id}-lock`)?.removeFromParent();
  chest.bodyGroup.getObjectByName(`${chest.id}-keyhole`)?.removeFromParent();

  const lowerPlate = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.17, 0.045), metal);
  lowerPlate.position.set(0, chest.bodyHeight - 0.12, frontZ);
  chest.bodyGroup.add(lowerPlate);

  const upperPlate = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.16, 0.045), metal);
  upperPlate.position.set(0, 0.105, 0.03);
  chest.lidGroup.add(upperPlate);

  const tongueShape = new THREE.Shape();
  tongueShape.moveTo(-0.075, 0.14);
  tongueShape.lineTo(0.075, 0.14);
  tongueShape.lineTo(0.075, -0.16);
  tongueShape.lineTo(-0.075, -0.16);
  tongueShape.closePath();
  const shackleOpening = new THREE.Path();
  shackleOpening.absellipse(0, -0.09, 0.043, 0.052, 0, Math.PI * 2, false);
  tongueShape.holes.push(shackleOpening);
  const tongue = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tongueShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }),
    metal,
  );
  tongue.position.set(0, -0.02, 0.05);
  chest.lidGroup.add(tongue);

  const rivetGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.018, 14);
  [-0.12, 0.12].forEach((x) => {
    const lowerRivet = new THREE.Mesh(rivetGeometry, darkMetal);
    lowerRivet.rotation.x = Math.PI / 2;
    lowerRivet.position.set(x, chest.bodyHeight - 0.12, frontZ + 0.037);
    chest.bodyGroup.add(lowerRivet);

    const upperRivet = lowerRivet.clone();
    upperRivet.position.set(x, 0.105, 0.063);
    chest.lidGroup.add(upperRivet);
  });

  [lowerPlate, upperPlate, tongue].forEach((part) => {
    part.castShadow = true;
    part.receiveShadow = true;
  });
};

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
  const lines = [
    "Cuando la flor despierta, nacen tres.",
    "Bajo el sol del verano, arden ocho.",
    "Cuando la hoja cae, queda uno.",
    "Bajo la nieve, duermen seis.",
    "Sigue el año y abre lo que guardamos.",
  ];
  lines.forEach((line, index) => context.fillText(line, width / 2, 235 + index * 74));

  context.strokeStyle = "rgba(87, 45, 23, 0.5)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width * 0.25, height - 87);
  context.quadraticCurveTo(width * 0.5, height - 63, width * 0.75, height - 87);
  context.stroke();

  context.font = "italic 34px Georgia, serif";
  context.fillText("— La familia", width / 2, height - 52);
};

const createLivingRoom = async ({
  timeline = "past",
  onSwitchPress,
  eventManager,
  onDoorOpenChange,
  entrance = null,
  kitchenEntrance = null,
  onLivingRoomAction = null,
  onObjectFocus = null,
  testMode = false,
} = {}) => {
  const { room, roomColliders, bounds, doorOpening, passageOpenings, windowOpenings, placeAgainstWall } = createRoom({
    width: 26,
    depth: 30,
    wallColor: 0xb9aa91,
    floorColor: 0x594438,
    ceilingColor: 0x9e8f7c,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: {
      x: 7,
      y: 7,
    },
    floorTextureRepeat: {
      x: 15,
      y: 15,
    },
    ceilingTextureRepeat: {
      x: 7,
      y: 7,
    },
    door: entrance ? null : { wall: "front", position: 0, width: 5, height: 8 },
    windows: [
      { id: `living-room-${timeline}-window-1`, wall: "front", position: -6.5, width: 5.5, height: 6, bottom: 3.3 },
      { id: `living-room-${timeline}-window-2`, wall: "front", position: 6.5, width: 5.5, height: 6, bottom: 3.3 },
    ],
    passages: [entrance, kitchenEntrance].filter(Boolean),
    omitWalls: entrance ? [entrance.wall] : [],
  });

  room.name = "Living Room";
  const temporaryReviewAccess = testMode;

  const kitchenOpening = kitchenEntrance
    ? passageOpenings.find((opening) => opening.id === kitchenEntrance.id)
    : null;
  const kitchenDoor = kitchenOpening
    ? new Door({
        id: "living-room-kitchen-door",
        position: kitchenOpening.position.clone().add(
          new THREE.Vector3(-kitchenOpening.width / 2, 0, 0).applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            kitchenOpening.rotationY,
          ),
        ),
        rotationY: kitchenOpening.rotationY,
        requiredKey: temporaryReviewAccess ? null : timeline === "past" ? "crowbar" : null,
        locked: !temporaryReviewAccess,
        onUnlock: () => onLivingRoomAction?.("object.interact", "living-room-kitchen-door"),
      })
    : null;
  const windows = windowOpenings.map(
    (opening) =>
      new Window({
        id: opening.id,
        position: opening.position.clone(),
        rotationY: opening.rotationY,
        width: opening.width,
        height: opening.height,
        columns: 2,
        rows: 2,
        curtainColor: 0xa47b63,
      }),
  );

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
  room.add(ambientLight);

  const blueKey = doorOpening
    ? new Key({
        id: "blue-key",
        position: new THREE.Vector3(0, 2, -2),
      })
    : null;

  const door = doorOpening
    ? new Door({
        id: "living-room-exit-door",
        position: doorOpening.position.clone().add(new THREE.Vector3(-doorOpening.width / 2, 0, 0)),
        requiredKey: "blue-key",
        onOpenChange: onDoorOpenChange,
      })
    : null;

  const lightSwitch = new Switch({
    id: "living-room-switch",
    onPress: onSwitchPress,
    position: new THREE.Vector3(13, 3.5, 3.5),
  });
  lightSwitch.object3D.rotation.y = -Math.PI / 2;

  const entranceLightSwitch = new Switch({
    id: "living-room-entrance-switch",
    onPress: onSwitchPress,
    position: new THREE.Vector3((entrance?.position ?? 0) + (entrance?.width ?? 5) / 2 + 1.5, 3.5, -14.5),
  });

  const lamp1 = new Lamp({
    id: "living-room-lamp-1",
    position: new THREE.Vector3(0, 12, 0),
    eventManager,
    linkedButton: ["living-room-switch", "living-room-entrance-switch"],
  });

  const sofa = new Sofa({
    id: "living-room-sofa",
    position: new THREE.Vector3(-2, 0, -3),
    rotationY: Math.PI / 2,
    seats: 2,
    scale: 1.5,
    width: 6,
    height: 3,
    depth: 3,
  });

  const armchair1 = new Sofa({
    id: "living-room-armchair-1",
    position: new THREE.Vector3(3, 0, 4),
    rotationY: Math.PI,
    seats: 1,
    scale: 1.5,
    width: 3,
    height: 3,
    depth: 3,
  });

  const armchair2 = new Sofa({
    id: "living-room-armchair-2",
    position: new THREE.Vector3(3, 0, -10),
    seats: 1,
    scale: 1.5,
    width: 3,
    height: 3,
    depth: 3,
  });

  const table1 = new Table({
    id: "living-room-table",
    position: new THREE.Vector3(3, 0, -3),
    rotationY: Math.PI / 2,
    scale: 1,
    width: 6,
    height: 2,
    depth: 3,
    ...livingRoomWoodStyle,
    createCollider: true,
  });

  const fireplace = new Fireplace({
    position: new THREE.Vector3(9, 1.7, -14.2),
    onSolved: () => onLivingRoomAction?.("object.interact", "living-room-fireplace"),
  });
  const displayCase = timeline === "past" ? new DisplayCase() : null;
  if (displayCase) displayCase.unlocked = false;
  let hasVitrineLetter = false;
  const vitrineLetter = timeline === "past" ? new Paper({
    id: "living-room-vitrine-letter",
    width: 1.1,
    height: 0.7,
    collectible: true,
    itemName: "family-letter",
    paperColor: "#d8bf83",
    backColor: "#c5a66d",
    content: drawAgedRiddle,
    inspectionTitle: "Carta familiar envejecida",
    onCollect: () => {
      hasVitrineLetter = true;
      onLivingRoomAction?.("item.pickup", "living-room-vitrine-letter");
    },
  }) : null;
  if (vitrineLetter && displayCase) {
    vitrineLetter.object3D.position.set(0.34, 0.185, 0.08);
    vitrineLetter.object3D.rotation.set(Math.PI / 2, 0, -0.08);
    vitrineLetter.object3D.visible = true;
    vitrineLetter.setEnabled(false);
    displayCase.object3D.add(vitrineLetter.object3D);
    displayCase.onOpen = () => {
      vitrineLetter.object3D.visible = true;
      vitrineLetter.setEnabled(true);
      onLivingRoomAction?.("object.interact", "living-room-display-case");
    };
  }
  const emberClue = timeline === "present" ? new EmberClue() : null;
  const emberPuzzle =
    timeline === "past"
      ? new EmberPuzzle({
          onFocus: onObjectFocus,
          onSolved: () => { displayCase?.unlock(); onLivingRoomAction?.("puzzle.solved", "living-room-embers"); },
        })
      : null;
  emberClue?.object3D.position.set(0, 1.62, 0.18);
  if (emberClue) emberClue.object3D.visible = false;
  emberPuzzle?.object3D.position.set(-1.12, -0.98, 0.03);
  emberPuzzle?.object3D.scale.setScalar(0.42);
  if (emberClue) fireplace.object3D.add(emberClue.object3D);
  if (emberPuzzle && displayCase) displayCase.frontLid.add(emberPuzzle.object3D);
  if (testMode) emberPuzzle?.reveal();

  const rainbowDrawing =
    timeline === "past"
      ? new Paper({
          id: "living-room-rainbow-drawing",
          width: 1.8,
          height: 1.2,
          rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
          onFocus: onObjectFocus,
          focusOffset: new THREE.Vector3(0, -1.5, 2.1),
          imagePath: "/images/puzzles/rainbow-drawing.png",
          imagePadding: 0,
        })
      : null;
  if (rainbowDrawing) {
    rainbowDrawing.object3D.position.set(0, 2.1, 0);
    table1.object3D.add(rainbowDrawing.object3D);
  }

  const shelf1 = new Shelf({
    id: "living-room-shelf-1",
    position: new THREE.Vector3(-13.5, 0, 9.75),
    rotationY: Math.PI / 2,
    backWall: true,
    width: 9.5,
    height: 7,
    depth: 2,
    shelves: 4,
    thickness: 0.3,
    ...livingRoomWoodStyle,
  });

  const shelf2 = new Shelf({
    id: "living-room-shelf-2",
    position: new THREE.Vector3(-13.5, 0, 0),
    rotationY: Math.PI / 2,
    backWall: true,
    width: 10,
    height: 7,
    depth: 2,
    shelves: 4,
    thickness: 0.3,
    ...livingRoomWoodStyle,
  });

  const shelf3 = new Shelf({
    id: "living-room-shelf-3",
    position: new THREE.Vector3(-13.5, 0, -9.75),
    rotationY: Math.PI / 2,
    backWall: true,
    width: 9.5,
    height: 7,
    depth: 2,
    shelves: 4,
    thickness: 0.3,
    ...livingRoomWoodStyle,
  });
  if (displayCase) shelf3.addToShelf(displayCase.object3D, { shelf: 1, x: 0, z: 0, placeOnSurface: false });

  const addShelfDecor = (shelf, specifications) => {
    specifications.forEach(({ kind, shelf: level, x, z = 0, scale = 1 }) => {
      let decoration;
      if (kind === "books") decoration = createBookStack({ aged: false, scale });
      if (kind === "vase") decoration = createVase({ aged: false, scale });
      if (kind === "candles") decoration = createCandleCluster({ aged: false, scale, count: 2 });
      if (decoration) shelf.addToShelf(decoration, { shelf: level, x, z });
    });
  };
  addShelfDecor(shelf1, [
    { kind: "books", shelf: 0, x: -2.7, scale: 1.15 },
    { kind: "vase", shelf: 0, x: 2.55, scale: .8 },
    { kind: "candles", shelf: 2, x: -2.7, scale: .95 },
    { kind: "books", shelf: 3, x: 2.25, scale: 1.05 },
  ]);
  addShelfDecor(shelf2, [
    { kind: "books", shelf: 0, x: -2.55, scale: 1.12 },
    { kind: "candles", shelf: 0, x: 2.65, scale: .9 },
    { kind: "vase", shelf: 2, x: -2.75, scale: .72 },
    { kind: "books", shelf: 2, x: 2.35, scale: 1.08 },
    { kind: "candles", shelf: 3, x: 0, scale: .92 },
  ]);
  addShelfDecor(shelf3, [
    { kind: "books", shelf: 0, x: -2.55, scale: 1.1 },
    { kind: "vase", shelf: 0, x: 2.65, scale: .76 },
    { kind: "candles", shelf: 2, x: -2.65, scale: .9 },
    { kind: "books", shelf: 2, x: 2.35, scale: 1.02 },
    { kind: "vase", shelf: 3, x: 0, scale: .68 },
  ]);

  const cabinet = new Cabinet({
    id: "living-room-cabinet",
    position: new THREE.Vector3(13.5, 0, -3),
    rotationY: -Math.PI / 2,
    scale: 1,
    width: 10,
    height: 3,
    depth: 2,
    columns: 2,
    rows: 3,
    ...livingRoomWoodStyle,
  });
  const cabinetInteractables = cabinet.getInteractables();
  const agedDecor = false;
  const tableBooks = createBookStack({ aged: agedDecor, scale: 1.05 });
  tableBooks.position.set(-1.45, 2.01, 0.38);
  const tableCandles = createCandleCluster({ aged: agedDecor, scale: 1.05, count: 2 });
  tableCandles.position.set(1.4, 2.01, 0.2);
  table1.object3D.add(tableBooks, tableCandles);
  const cabinetVase = createVase({ aged: agedDecor, scale: 0.82 });
  cabinetVase.position.set(0, 3.01, 0);
  cabinet.object3D.add(cabinetVase);
  const livingRoomPlant = createPottedPlant({ aged: agedDecor, scale: 1.2 });
  livingRoomPlant.position.set(11.55, 0, -9.35);
  const livingRoomFrames = createWallFrameCluster({
    aged: agedDecor,
    scale: 0.95,
    imagePaths: [
      "/images/decor/family-photo-1980s.png",
      "/images/decor/couple-photo-1980s.png",
      "/images/decor/bedroom-landscape.png",
    ],
  });
  livingRoomFrames.position.set(0, 7.1, 14.78);
  livingRoomFrames.rotation.y = Math.PI;

  const chest = new Chest({
    id: "living-room-chest",
    position: new THREE.Vector3(17, 2, 12),
    scale: 1,
    width: 1.5,
    height: 1,
    depth: 1,
    locked: timeline === "past",
    ...livingRoomWoodStyle,
  });
  addCombinationLockHasp(chest);

  const studyKey =
    timeline === "past"
      ? new Key({
          id: "study-key",
          color: 0xb07c32,
          scalar: 1.45,
        })
      : null;
  const finalLivingRoomKey = timeline === "present"
    ? new FinalKey({
        id: "final-key-living-room",
        symbol: "flame",
        color: 0xb56b38,
        onCollect: () => onLivingRoomAction?.("item.pickup", "final-key-living-room"),
      })
    : null;
  let finalLivingRoomKeyEarned = false;
  let finalLivingRoomKeyUnavailable = false;
  if (finalLivingRoomKey) {
    finalLivingRoomKey.object3D.visible = false;
    finalLivingRoomKey.setEnabled(false);
    chest.addItem(finalLivingRoomKey, { position: new THREE.Vector3(0, .22, 0), scale: 1.15, visible: false });
  }
  let studyKeyUnavailable = false;
  if (studyKey) {
    studyKey.setEnabled(false);
    studyKey.object3D.visible = false;
    studyKey.interact = (player) => {
      if (!player.inventory.add(studyKey)) return;
      studyKeyUnavailable = true;
      studyKey.object3D.visible = false;
      studyKey.setEnabled(false);
      onLivingRoomAction?.("item.pickup", "study-key");
    };
  }

  const chestLock =
    timeline === "past"
      ? new Lock({
          id: "living-room-chest-lock",
          position: new THREE.Vector3(0, 0.405, 0.61),
          scale: 0.074,
          password: "3816",
          onFocus: onObjectFocus,
          canUnlock: () => testMode || hasVitrineLetter,
          onUnlock: () => {
            chest.unlock();
            onLivingRoomAction?.("object.interact", "living-room-chest");
          },
        })
      : null;
  if (chestLock) chest.object3D.add(chestLock.object3D);
  chest.onOpenChange = ({ isOpen }) => {
    if (!isOpen) return;
    if (studyKey && !studyKeyUnavailable && !studyKey.object3D.visible) {
      studyKey.object3D.visible = true;
      studyKey.setEnabled(true);
    }
    if (finalLivingRoomKey && finalLivingRoomKeyEarned && !finalLivingRoomKeyUnavailable && !finalLivingRoomKey.object3D.visible) {
      finalLivingRoomKey.reveal();
    }
  };

  if (studyKey) {
    chest.addItem(studyKey, {
      position: new THREE.Vector3(0, 0.22, 0),
      scale: 1.4,
      visible: false,
    });
  }

  shelf2.addToShelf(chest.object3D, {
    shelf: 1,
    x: 0,
    z: 2,
    placeOnSurface: false,
  });

  const fallenPainting = new FallenPainting({ position: new THREE.Vector3(-12.55, 1.5, 9.75), rotationY: Math.PI / 2 });
  if (testMode && timeline === "past") fallenPainting.reveal();
  const paintingSlot = new PaintingSlot({
    timeline,
    position: new THREE.Vector3(13.5, 5.2, -3),
    rotationY: -Math.PI / 2,
    onPlaced: () => onLivingRoomAction?.("object.interact", "living-room-painting-slot"),
    onPieceInserted: (index) => onLivingRoomAction?.("object.interact", `living-room-painting-piece-${index}`),
  });
  if (paintingSlot.hiddenScissors) {
    paintingSlot.hiddenScissors.onCollect = () => onLivingRoomAction?.("item.pickup", "living-room-scissors");
  }

  const match = new Match({
    onCollect: () => onLivingRoomAction?.("item.pickup", "living-room-match"),
  });

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

  const cushion =
    timeline === "present"
      ? new Cushion({
          id: "living-room-sofa-cushion",
          parent: sofa.object3D,
          position: new THREE.Vector3(-2.1, 1.55, 0.1),
          rotation: new THREE.Euler(-0.2, 1, 0.2),
          color: 0x493027,
          accentColor: 0xdab77d,
          sewn: true,
          onCut: () => {
            onLivingRoomAction?.("object.interact", "living-room-sofa-cushion");
          },
          onSearch: (player) => {
            collectMatch(player);
            onLivingRoomAction?.("object.interact", "living-room-sofa-cushion");
          },
        })
      : new Cushion({
          id: "living-room-sofa-cushion",
          parent: sofa.object3D,
          position: new THREE.Vector3(-2.1, 1.55, 0.1),
          rotation: new THREE.Euler(-0.2, 1, 0.2),
          color: 0x493027,
        });

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
      parent: armchair1.object3D,
      position: new THREE.Vector3(0, 1.55, -0.28),
      rotation: new THREE.Euler(-0.16, 0, 0),
      color: 0x493027,
    }),
    new Cushion({
      id: "living-room-armchair-2-cushion",
      parent: armchair2.object3D,
      position: new THREE.Vector3(0, 1.55, -0.28),
      rotation: new THREE.Euler(-0.16, 0, 0),
      color: 0x493027,
    }),
  ];
  if (timeline === "past") room.add(fallenPainting.object3D);
  room.add(paintingSlot.object3D);

  const rainbowBookData = [
    ["orange", 0xeb8e3d, 1],
    ["violet", 0xa7679c, 6],
    ["green", 0x71a96d, 3],
    ["red", 0xdf574b, 0],
    ["blue", 0x4d92b8, 4],
    ["yellow", 0xe3c84e, 2],
    ["indigo", 0x6960aa, 5],
  ];
  const rainbowBooks =
    timeline === "present"
      ? rainbowBookData.map(([name, color, correctSlot], currentSlot) => {
          const book = new Book({
            id: `rainbow-book-${name}`,
            color,
            currentSlot,
            correctSlot,
            rotationY: Math.PI / 2,
          });
          const x = 1.1 + currentSlot * 0.52;
          shelf1.addToShelf(book.object3D, { shelf: 1, x, z: 0 });
          return book;
        })
      : [];
  let booksRevealed = false;
  let shelfIsOpen = false;
  const moveShelf = (open) => {
    if (!booksRevealed || shelfIsOpen === open || shelf1.isMechanismMoving) return;
    shelfIsOpen = open;
    shelf1.openMechanism({ angle: open ? -Math.PI / 2 : Math.PI / 2, duration: 2, side: "left" });
  };
  const revealBooksResult = () => {
    booksRevealed = true;
    moveShelf(true);
    if (timeline === "past") fallenPainting.reveal();
  };
  const bookPuzzle =
    timeline === "present"
      ? new BookPuzzle({
          id: "living-room-rainbow-books",
          books: rainbowBooks,
          onSolved: () => {
            revealBooksResult();
            onLivingRoomAction?.("puzzle.solved", "living-room-rainbow-books");
          },
        })
      : null;
  rainbowBooks.forEach((book) => book.setOnInteract(bookPuzzle.handleBookInteraction.bind(bookPuzzle)));
  if (testMode && timeline === "present") paintingSlot.setPlaced(true);
  shelf1.interact = () => moveShelf(!shelfIsOpen);
  shelf1.getInteractionText = () =>
    booksRevealed ? tInteraction(shelfIsOpen ? "close" : "open", tItem("shelf")) : null;

  room.add(sofa.object3D);
  room.add(armchair1.object3D);
  room.add(armchair2.object3D);
  room.add(...windows.map((window) => window.object3D));
  room.add(table1.object3D);
  if (door) room.add(door.object3D);
  if (kitchenDoor) room.add(kitchenDoor.object3D);
  room.add(lightSwitch.object3D);
  room.add(entranceLightSwitch.object3D);
  room.add(lamp1.object3D);
  room.add(fireplace.object3D);
  room.add(shelf1.object3D);
  room.add(shelf2.object3D);
  room.add(shelf3.object3D);
  room.add(cabinet.object3D);
  room.add(livingRoomPlant);
  if (entrance) room.add(livingRoomFrames);
  placeAgainstWall(lightSwitch, "right");
  placeAgainstWall(entranceLightSwitch, "back");
  [shelf1, shelf2, shelf3].forEach((shelf) => placeAgainstWall(shelf, "left"));
  placeAgainstWall(cabinet, "right");
  placeAgainstWall(paintingSlot, "right");

  room.updateMatrixWorld(true);
  const sofaCollider = sofa.getCollider();
  const armchair1Collider = armchair1.getCollider();
  const armchair2Collider = armchair2.getCollider();
  const table1Collider = table1.getCollider();
  const chestCollider = chest.getCollider();
  const fireplaceCollider = fireplace.getCollider();
  const shelf1Collider = shelf1.getCollider();
  const shelf2Collider = shelf2.getCollider();
  const shelf3Collider = shelf3.getCollider();
  const cabinetCollider = cabinet.getCollider();
  return {
    room,
    roomColliders,
    objectColliders: [
      sofaCollider,
      armchair1Collider,
      armchair2Collider,
      table1Collider,
      chestCollider,
      fireplaceCollider,
      shelf1Collider,
      shelf2Collider,
      shelf3Collider,
      cabinetCollider,
      ...windows.map((window) => window.getCollider()),
    ],
    bounds,
    door,
    doorPassage: doorOpening
      ? {
          minX: doorOpening.position.x - doorOpening.width / 2,
          maxX: doorOpening.position.x + doorOpening.width / 2,
        }
      : null,
    interactables: [
      lightSwitch,
      entranceLightSwitch,
      ...(blueKey ? [blueKey] : []),
      ...(door ? [door] : []),
      ...(kitchenDoor ? [kitchenDoor] : []),
      chest,
      ...(chestLock ? [chestLock] : []),
      ...(studyKey ? [studyKey] : []),
      ...(finalLivingRoomKey ? [finalLivingRoomKey] : []),
      cabinet,
      ...cabinetInteractables,
      shelf1,
      ...rainbowBooks,
      ...(rainbowDrawing ? [rainbowDrawing] : []),
      ...(timeline === "past" ? [fallenPainting] : []),
      paintingSlot,
      ...(paintingSlot.hiddenScissors ? [paintingSlot.hiddenScissors] : []),
      ...(cushion ? [cushion, match] : []),
      fireplace,
      ...(displayCase ? [displayCase] : []),
      ...(vitrineLetter ? [vitrineLetter] : []),
      ...(emberPuzzle ? [emberPuzzle] : []),
    ],
    entities: [
      lightSwitch,
      entranceLightSwitch,
      ...(door ? [door] : []),
      ...(kitchenDoor ? [kitchenDoor] : []),
      lamp1,
      ...(blueKey ? [blueKey] : []),
      chest,
      ...(chestLock ? [chestLock] : []),
      ...(studyKey ? [studyKey] : []),
      ...(finalLivingRoomKey ? [finalLivingRoomKey] : []),
      sofa,
      armchair1,
      armchair2,
      table1,
      cabinet,
      ...rainbowBooks,
      ...(timeline === "past" ? [fallenPainting] : []),
      ...(paintingSlot.hiddenScissors ? [paintingSlot.hiddenScissors] : []),
      ...(cushion ? [cushion, match] : []),
      fireplace,
      ...(displayCase ? [displayCase] : []),
      ...(vitrineLetter ? [vitrineLetter] : []),
      ...(emberPuzzle ? [emberPuzzle] : []),
      ...decorativeCushions,
      shelf1,
      paintingSlot,
    ],
    applyLivingRoomState: (state) => {
      if (state.timelines?.present?.puzzles?.["living-room-rainbow-books"]?.solved) revealBooksResult();
      const paintingState = state.timelines?.past?.objects?.["living-room-painting-slot"];
      if (paintingState?.placed && timeline === "past") paintingSlot.setPlaced(true);
      for (const index of paintingState?.restoredPieces ?? []) paintingSlot.restorePiece(index);
      if (state.timelines?.past?.puzzles?.["living-room-painting"]?.solved) paintingSlot.setRestored();
      const livingRoomState = state.timelines?.present?.objects;
      const cushionState = livingRoomState?.["living-room-sofa-cushion"];
      if (cushionState?.cut && cushion) {
        cushion.setCut();
        cushion.searched = Boolean(cushionState.searched);
      }
      if (state.timelines?.present?.objects?.["living-room-fireplace"]?.open) {
        fireplace.solved = true;
        fireplace.flame.visible = true;
        if (emberClue) emberClue.object3D.visible = true;
        emberPuzzle?.reveal();
      }
      if (state.timelines?.past?.puzzles?.["living-room-embers"]?.solved) {
        emberPuzzle?.solve({ notify: false });
        displayCase?.unlock();
      }
      const displayCaseState = state.timelines?.past?.objects?.["living-room-display-case"];
      if (displayCaseState?.open && displayCase && vitrineLetter) {
        displayCase.setOpened();
        vitrineLetter.object3D.visible = true;
        vitrineLetter.setEnabled(true);
      }
      hasVitrineLetter = Boolean(state.inventories?.past?.includes("living-room-vitrine-letter"));
      if (hasVitrineLetter) {
        if (vitrineLetter) {
          vitrineLetter.object3D.visible = false;
          vitrineLetter.setEnabled(false);
        }
      }
      const chestState = state.timelines?.past?.objects?.["living-room-chest"] ?? state.timelines?.present?.objects?.["living-room-chest"];
      if (chestState?.locked === false) {
        finalLivingRoomKeyEarned = true;
        chest.unlock();
        chestLock?.setUnlocked();
      }
      if (finalLivingRoomKey) {
        finalLivingRoomKeyUnavailable = state.inventories?.present?.includes("final-key-living-room")
          || ["past", "present"].some((era) => state.timelines?.[era]?.objects?.["final-bolt-living-room"]?.unlocked);
        if (finalLivingRoomKeyUnavailable) { finalLivingRoomKey.object3D.visible = false; finalLivingRoomKey.setEnabled(false); }
      }
      const childrenRoomDoorUnlocked = state.timelines?.past?.objects?.["hallway-children-room-door"]?.locked === false;
      if (studyKey && (state.inventories?.[timeline]?.includes("study-key") || childrenRoomDoorUnlocked)) {
        studyKeyUnavailable = true;
        studyKey.object3D.visible = false;
        studyKey.setEnabled(false);
      }
      const kitchenDoorUnlocked = ["past", "present"].some((era) =>
        state.timelines?.[era]?.objects?.["living-room-kitchen-door"]?.locked === false
        || state.timelines?.[era]?.objects?.["hallway-kitchen-door"]?.locked === false,
      );
      if (kitchenDoorUnlocked) kitchenDoor?.unlock({ notify: false });
    },
    spawnLookAt: new THREE.Vector3(0, 5.25, 0),
    spawnPosition: new THREE.Vector3(0, 5.25, 8),
    kitchenDoor,
  };
};

export { createLivingRoom };
