import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import {
  Bed,
  Cabinet,
  Carpet,
  Chair,
  Desk,
  Lamp,
  Switch,
  Wardrobe,
  Window,
  applyAgedFurnitureAppearance,
  createBookStack,
  createWallFrameCluster,
  Crowbar,
  BoltCutters,
  GlobePushpin,
  Key,
  Paper,
  WardrobeChains,
  FinalKey,
} from "../objects/index.js";
import {
  BlockConstructionPuzzle,
  PhotoBoardPuzzle,
  MEMORIES,
  MEMORY_PHOTO_IDS,
  MusicPuzzle,
} from "../puzzles/index.js";

const childrenRoomConfig = {
  past: {
    wallColor: 0xd8c9a9,
    floorColor: 0x76543d,
    ceilingColor: 0xeee1c7,
    blanketColors: [0x6f91b7, 0xc77b83],
    carpetColor: 0xb68d42,
    accentColors: [0xd46a5f, 0x5b88ad, 0xe0b74f, 0x719b68],
    ambientIntensity: 0.62,
  },
  present: {
    wallColor: 0xd8c9a9,
    floorColor: 0x76543d,
    ceilingColor: 0xeee1c7,
    blanketColors: [0x6f91b7, 0xc77b83],
    carpetColor: 0xb68d42,
    accentColors: [0xd46a5f, 0x5b88ad, 0xe0b74f, 0x719b68],
    ambientIntensity: 0.62,
  },
};

const woodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x765137,
  darkWoodColor: 0x4c3225,
  interiorColor: 0x805c43,
  drawerInteriorColor: 0x805c43,
  handleColor: 0xb18b4f,
};

const createChildrenRoom = ({
  timeline = "present",
  onObjectFocus = null,
  onChildrenRoomAction = null,
  testMode = false,
} = {}) => {
  const config = childrenRoomConfig[timeline];
  if (!config) throw new Error(`Timeline no válido para ChildrenRoom: ${timeline}`);

  const width = 22;
  const depth = 20;
  const height = 12;
  const { room, roomColliders, bounds, windowOpenings, placeAgainstWall } = createRoom({
    width,
    depth,
    height,
    wallColor: config.wallColor,
    floorColor: config.floorColor,
    ceilingColor: config.ceilingColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 6, y: 5 },
    floorTextureRepeat: { x: 9, y: 9 },
    ceilingTextureRepeat: { x: 6, y: 5 },
    door: { wall: "front", position: 0, width: 5, height: 8 },
    omitWalls: ["front"],
    windows: [{ id: "children-room-window-1", wall: "back", position: 0, width: 7, height: 4.5, bottom: 4 }],
  });

  room.name = `Children Room-${timeline}`;
  room.userData.timeline = timeline;

  const ambientLight = new THREE.AmbientLight(0xfff1d1, config.ambientIntensity);
  const lamps = [-5.5, 5.5].map((x, index) => {
    const lamp = new Lamp({
      id: `children-room-${timeline}-lamp-${index + 1}`,
      position: new THREE.Vector3(x, height, 0),
    });
    return lamp;
  });
  const setRoomLights = (active) => {
    lamps.forEach((lamp) => lamp.setActive(active));
  };
  setRoomLights(false);

  const lightSwitch = new Switch({
    id: `children-room-${timeline}-switch`,
    position: new THREE.Vector3(3.55, 3.5, depth / 2),
    scale: 0.75,
    onPress: (switchObject) => setRoomLights(switchObject.active),
  });
  lightSwitch.object3D.rotation.y = Math.PI;

  room.add(ambientLight, ...lamps.map((lamp) => lamp.object3D), lightSwitch.object3D);
  placeAgainstWall(lightSwitch, "front");

  const windows = windowOpenings.map(
    (opening) =>
      new Window({
        id: opening.id,
        position: opening.position.clone(),
        rotationY: opening.rotationY,
        width: opening.width,
        height: opening.height,
      }),
  );
  room.add(...windows.map((window) => window.object3D));

  const beds = [
    new Bed({
      id: "children-room-bed-1",
      position: new THREE.Vector3(-8.5, 0, -5.5),
      rotationY: 0,
      scale: 1,
      size: "single",
      ...woodStyle,
      blanketColor: config.blanketColors[0],
      pillowColor: 0xe8dfcd,
    }),
    new Bed({
      id: "children-room-bed-2",
      position: new THREE.Vector3(8.5, 0, -5.5),
      rotationY: 0,
      scale: 1,
      size: "single",
      ...woodStyle,
      blanketColor: config.blanketColors[1],
      pillowColor: 0xe8dfcd,
    }),
  ];

  // Keep the study area clear of the foot of the beds. The desks are later
  // snapped to the side walls, so only their Z coordinate controls this gap.
  const studyAreaZ = 2;
  const desks = [-0.7, 0.7].map(
    (side, index) =>
      new Desk({
        id: `children-room-desk-${index + 1}`,
        position: new THREE.Vector3(side * 9.2, 0, studyAreaZ),
        rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
        scale: 0.68,
        ...woodStyle,
      }),
  );

  const chairs = [-1, 1].map(
    (side, index) =>
      new Chair({
        id: `children-room-chair-${index + 1}`,
        position: new THREE.Vector3(side * 6.7, 0, studyAreaZ),
        rotationY: side < 0 ? -Math.PI / 2 : Math.PI / 2,
        scale: 0.58,
        ...woodStyle,
      }),
  );

  const wardrobes = [-1.2, 1.2].map(
    (side, index) =>
      new Wardrobe({
        id: `children-room-wardrobe-${index + 1}`,
        position: new THREE.Vector3(side * 5.4, 0, 8.4),
        rotationY: Math.PI,
        scale: 0.78,
        ...woodStyle,
      }),
  );
  wardrobes.forEach((wardrobe) => wardrobe.object3D.scale.y = 0.84);
  const dresser = new Cabinet({
    id: "children-room-dresser",
    position: new THREE.Vector3(0, 0, -8.3),
    width: 7,
    height: 3,
    depth: 2,
    rows: 4,
    columns: 2,
    handleType: "knob",
    ...woodStyle,
  });

  const carpets = [-2, 2].map(
    (side, index) =>
      new Carpet({
        id: `children-room-carpet-${index + 1}`,
        position: new THREE.Vector3(side * 4.2, 0.02, 1.7),
        width: 4,
        depth: 6.5,
        color: index === 0 ? config.blanketColors[0] : config.blanketColors[1],
        texture: "/textures/furniture/carpet.jpg",
        textureRepeat: { x: 2, y: 2 },
      }),
  );
  const agedDecor = false;
  const deskBooks = createBookStack({ aged: agedDecor, scale: 0.72 });
  deskBooks.position.set(-2.6, 3.31, 0.05);
  deskBooks.rotation.y = 0.18;
  desks[0].object3D.add(deskBooks);

  const musicBoxKey = timeline === "past"
    ? new Key({
        id: "music-box-key",
        color: 0xd6a43b,
        scalar: 1.1,
        onCollect: () => onChildrenRoomAction?.("item.pickup", "music-box-key"),
      })
    : null;
  if (musicBoxKey) {
    musicBoxKey.object3D.visible = false;
    musicBoxKey.setEnabled(false);
  }
  const revealMusicBoxKey = () => {
    if (!musicBoxKey) return;
    photoBoardPuzzle.revealHiddenReward();
  };

  const blockPuzzle = new BlockConstructionPuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => {
      revealBoardPushpin();
      onChildrenRoomAction?.("puzzle.solved", "children-blocks");
    },
  });
  blockPuzzle.object3D.scale.setScalar(0.78);
  blockPuzzle.object3D.position.set(0, 3.3 - 1.59 * 0.78 + .34, 0);

  const boardPushpin = timeline === "past"
    ? new GlobePushpin({ onCollect: () => onChildrenRoomAction?.("item.pickup", "globe-pushpin") })
    : null;
  if (boardPushpin) {
    boardPushpin.object3D.position.set(1.9, 3.34, 1.02);
    boardPushpin.object3D.rotation.z = Math.PI / 2;
    boardPushpin.object3D.scale.setScalar(.78);
    boardPushpin.object3D.visible = false;
    boardPushpin.setEnabled(false);
  }
  const revealBoardPushpin = () => {
    if (!boardPushpin) return;
    boardPushpin.object3D.visible = true;
    boardPushpin.setEnabled(true);
  };

  const musicPuzzle = new MusicPuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => {
      boltCutters?.reveal();
      onChildrenRoomAction?.("puzzle.solved", "children-music");
    },
    onKeyInserted: () => onChildrenRoomAction?.("puzzle.solved", "children-music-key"),
    previewOpenOnPlay: testMode,
  });
  musicPuzzle.object3D.position.set(0, 3.31, 0);
  musicPuzzle.object3D.scale.setScalar(0.68);

  const photoBoardPuzzle = new PhotoBoardPuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => {
      revealMusicBoxKey();
      if (timeline === "past") musicPuzzle.setAvailable(true);
      onChildrenRoomAction?.("puzzle.solved", "children-globe");
    },
    onPinInserted: () => onChildrenRoomAction?.("puzzle.solved", "children-globe-pin"),
    onCollect: () => onChildrenRoomAction?.("item.pickup", "children-photo-order-note"),
  });
  photoBoardPuzzle.setAvailable(true);
  if (timeline === "past") {
    photoBoardPuzzle.object3D.position.set(-7.1, 5.4, -9.72);
    photoBoardPuzzle.object3D.scale.setScalar(0.7);
  } else {
    photoBoardPuzzle.object3D.scale.setScalar(0.5);
  }
  if (musicBoxKey) photoBoardPuzzle.setHiddenReward(musicBoxKey);

  const memoryPhotos = timeline === "past"
    ? MEMORIES.map((memory, index) => new Paper({
        id: MEMORY_PHOTO_IDS[index],
        width: 1.42,
        height: 0.92,
        rotation: new THREE.Euler(-Math.PI / 2, 0, index % 2 === 0 ? -0.08 : 0.1),
        imagePath: memory.image,
        imageFit: "cover",
        imagePadding: 0,
        collectible: true,
        itemName: `memory-photo-${memory.id}`,
        inspectionTitle: `foto de ${memory.name.toLocaleLowerCase("es")}`,
        onCollect: () => onChildrenRoomAction?.("item.pickup", MEMORY_PHOTO_IDS[index]),
      }))
    : [];

  if (memoryPhotos.length) {
    dresser.addObjectToDrawer(5, memoryPhotos[0].object3D, new THREE.Vector3(0, -0.16, -0.72));
    wardrobes[1].addObjectToDrawer(0, memoryPhotos[1].object3D, new THREE.Vector3(0, -0.405, -1.1));
    desks[1].addObjectToDrawer(0, memoryPhotos[2].object3D, new THREE.Vector3(0, -0.22, -0.9));
    memoryPhotos[3].object3D.position.set(6.15, 0.055, 3.65);
    memoryPhotos[3].object3D.rotation.set(-Math.PI / 2, 0, -0.18);
  }

  const boltCutters = timeline === "past"
    ? new BoltCutters({ onCollect: () => onChildrenRoomAction?.("item.pickup", "bolt-cutters") })
    : null;
  if (boltCutters) {
    boltCutters.object3D.position.set(0, .52, 0);
    boltCutters.object3D.rotation.z = Math.PI / 2;
    boltCutters.object3D.scale.setScalar(.55);
  }

  const crowbar =
    timeline === "past"
      ? new Crowbar({
          onCollect: () => onChildrenRoomAction?.("item.pickup", "crowbar"),
        })
      : null;
  if (crowbar) {
    crowbar.object3D.position.set(-0.2, 2.49, 0.08);
    crowbar.object3D.rotation.order = "ZXY";
    crowbar.object3D.rotation.x = Math.PI / 2;
    crowbar.object3D.rotation.y = 0.16;
    crowbar.object3D.scale.setScalar(0.85);
    crowbar.object3D.visible = false;
    crowbar.setEnabled(false);
  }

  const wardrobeChains = timeline === "past"
    ? new WardrobeChains({
        onCut: () => {
          unlockRewardWardrobe();
          onChildrenRoomAction?.("puzzle.solved", "children-wardrobe-chains");
        },
      })
    : null;
  if (wardrobeChains) {
    wardrobeChains.object3D.position.z = 1.68;
    wardrobes[0].object3D.add(wardrobeChains.object3D);
  }

  const rewardWardrobeDoors = wardrobes[0]
    .getInteractables()
    .filter((interactable) => interactable.id.includes("-door-"));
  rewardWardrobeDoors.forEach((interactable) => {
    interactable.enabled = false;
    const openDoor = interactable.interact;
    interactable.interact = (...args) => {
      openDoor(...args);
      revealWardrobeReward();
    };
  });
  let rewardWardrobeUnlocked = false;
  let wardrobeRewardRevealed = false;
  const finalChildrenKey = timeline === "past"
    ? new FinalKey({
        id: "final-key-children",
        symbol: "star",
        color: 0xc6a044,
        onCollect: () => onChildrenRoomAction?.("item.pickup", "final-key-children"),
      })
    : null;
  if (finalChildrenKey) {
    finalChildrenKey.object3D.position.set(1.15, 4.25, .45);
    finalChildrenKey.object3D.rotation.z = -.35;
    finalChildrenKey.object3D.visible = false;
    finalChildrenKey.setEnabled(false);
    wardrobes[0].object3D.add(finalChildrenKey.object3D);
  }
  function unlockRewardWardrobe() {
    rewardWardrobeUnlocked = true;
    rewardWardrobeDoors.forEach((interactable) => {
      interactable.enabled = true;
    });
  }
  function revealWardrobeReward() {
    if (!rewardWardrobeUnlocked || wardrobeRewardRevealed) return;
    wardrobeRewardRevealed = true;
    if (crowbar) {
      crowbar.object3D.visible = true;
      crowbar.setEnabled(true);
    }
    finalChildrenKey?.reveal();
  }

  if (testMode) {
    musicPuzzle.setAvailable(true);
    if (timeline === "past") {
      photoBoardPuzzle.solve({ notify: false });
      photoBoardPuzzle.setOpen(true, { immediate: true });
      musicPuzzle.setKeyInserted({ notify: false });
      revealBoardPushpin();
      revealMusicBoxKey();
      musicPuzzle.openBox();
      boltCutters?.reveal();
    }
    photoBoardPuzzle.setAvailable(true);
  }

  const wallArt = createWallFrameCluster({ aged: agedDecor, scale: 0.82 });
  wallArt.position.set(6.9, 8.65, -9.78);

  room.add(
    ...beds.map((bed) => bed.object3D),
    ...desks.map((desk) => desk.object3D),
    ...chairs.map((chair) => chair.object3D),
    ...wardrobes.map((wardrobe) => wardrobe.object3D),
    dresser.object3D,
    ...carpets.map((carpet) => carpet.object3D),
    wallArt,
    ...(timeline === "past" ? [photoBoardPuzzle.object3D, memoryPhotos[3].object3D] : []),
  );

  beds.forEach((bed) => placeAgainstWall(bed, "back"));
  placeAgainstWall(desks[0], "left");
  placeAgainstWall(desks[1], "right");
  wardrobes.forEach((wardrobe) => placeAgainstWall(wardrobe, "front"));
  placeAgainstWall(dresser, "back");

  [...beds, ...desks, ...chairs, ...wardrobes, dresser, ...carpets].forEach((object) => {
    applyAgedFurnitureAppearance(object.object3D, { intensity: 0.12, wearColor: 0x745d49 });
  });
  desks[0].object3D.add(musicPuzzle.object3D);
  if (boltCutters) musicPuzzle.object3D.add(boltCutters.object3D);
  desks[1].object3D.add(blockPuzzle.object3D);
  if (boardPushpin) desks[1].object3D.add(boardPushpin.object3D);
  if (timeline === "present") {
    desks[0].addObjectToDrawer(0, photoBoardPuzzle.object3D, new THREE.Vector3(0, -0.22, -0.92));
  }
  if (crowbar) wardrobes[0].object3D.add(crowbar.object3D);

  room.updateMatrixWorld(true);
  const furniture = [...beds, ...desks, ...chairs, ...wardrobes, dresser];
  const interactables = [
    lightSwitch,
    ...desks.flatMap((desk) => desk.getInteractables()),
    ...wardrobes.flatMap((wardrobe) => wardrobe.getInteractables()),
    ...dresser.getInteractables(),
    blockPuzzle,
    musicPuzzle,
    photoBoardPuzzle,
    ...(boltCutters ? [boltCutters] : []),
    ...(wardrobeChains ? [wardrobeChains] : []),
    ...memoryPhotos,
    ...(musicBoxKey ? [musicBoxKey] : []),
    ...(boardPushpin ? [boardPushpin] : []),
    ...(crowbar ? [crowbar] : []),
    ...(finalChildrenKey ? [finalChildrenKey] : []),
  ];

  return {
    room,
    roomColliders,
    objectColliders: [
      ...furniture.map((object) => object.getCollider()),
      ...windows.map((window) => window.getCollider()),
    ],
    bounds,
    dimensions: { width, depth, height },
    interactables,
    entities: [
      lightSwitch,
      ...lamps,
      ...desks,
      ...wardrobes,
      dresser,
      blockPuzzle,
      musicPuzzle,
      photoBoardPuzzle,
      ...(boltCutters ? [boltCutters] : []),
      ...(wardrobeChains ? [wardrobeChains] : []),
      ...memoryPhotos,
      ...(musicBoxKey ? [musicBoxKey] : []),
      ...(boardPushpin ? [boardPushpin] : []),
      ...(crowbar ? [crowbar] : []),
      ...(finalChildrenKey ? [finalChildrenKey] : []),
    ],
    applyChildrenRoomState: (state) => {
      const blocksSolved = Boolean(state.timelines?.past?.puzzles?.["children-blocks"]?.solved);
      if (blocksSolved) {
        blockPuzzle.solve({ notify: false });
        revealBoardPushpin();
      }
      const musicKeyInserted = Boolean(state.timelines?.past?.puzzles?.["children-music-key"]?.solved);
      const musicKeyCollected = Boolean(state.inventories?.past?.includes("music-box-key"));
      if (musicKeyInserted) {
        musicPuzzle.setKeyInserted({ notify: false });
        musicPuzzle.setAvailable(true);
      }
      if (musicBoxKey) {
        if (musicKeyCollected || musicKeyInserted) {
          musicBoxKey.object3D.visible = false;
          musicBoxKey.setEnabled(false);
        }
      }
      const musicSolved = Boolean(state.timelines?.present?.puzzles?.["children-music"]?.solved);
      if (musicSolved) {
        musicPuzzle.solve({ notify: false });
        musicPuzzle.openBox();
        boltCutters?.reveal();
      }
      const boardPinInserted = Boolean(state.timelines?.past?.puzzles?.["children-globe-pin"]?.solved);
      const boardPushpinCollected = Boolean(state.inventories?.past?.includes("globe-pushpin"));
      if (boardPinInserted) photoBoardPuzzle.setPinInserted({ notify: false });
      if (boardPushpin && (boardPushpinCollected || boardPinInserted)) {
        boardPushpin.object3D.visible = false;
        boardPushpin.setEnabled(false);
      }
      const photoBoardSolved = Boolean(state.timelines?.past?.puzzles?.["children-globe"]?.solved);
      if (
        timeline === "present"
        && (state.inventories?.present?.includes("children-photo-order-note") || photoBoardSolved)
      ) {
        photoBoardPuzzle.object3D.visible = false;
        photoBoardPuzzle.setEnabled(false);
      }
      memoryPhotos.forEach((photo) => {
        if (state.inventories?.past?.includes(photo.id) || photoBoardSolved) {
          photo.object3D.visible = false;
          photo.setEnabled(false);
        }
      });
      if (photoBoardSolved) {
        if (timeline === "past") photoBoardPuzzle.solve({ notify: false });
        if (timeline === "past") musicPuzzle.setAvailable(true);
        if (!musicKeyCollected && !musicKeyInserted) revealMusicBoxKey();
      }
      const chainsCut = Boolean(state.timelines?.past?.puzzles?.["children-wardrobe-chains"]?.solved);
      if (boltCutters && (state.inventories?.past?.includes("bolt-cutters") || chainsCut)) {
        boltCutters.object3D.visible = false;
        boltCutters.setEnabled(false);
      }
      if (chainsCut) {
        wardrobeChains?.cut({ immediate: true });
        unlockRewardWardrobe();
      }
      const kitchenUnlocked = ["past", "present"].some(
        (era) => state.timelines?.[era]?.objects?.["hallway-kitchen-door"]?.locked === false,
      );
      if (crowbar && (state.inventories?.past?.includes("crowbar") || kitchenUnlocked)) {
        crowbar.object3D.visible = false;
        crowbar.setEnabled(false);
      }
      if (finalChildrenKey) {
        const unavailable = state.inventories?.past?.includes("final-key-children")
          || ["past", "present"].some((era) => state.timelines?.[era]?.objects?.["final-bolt-children"]?.unlocked);
        if (unavailable) { finalChildrenKey.object3D.visible = false; finalChildrenKey.setEnabled(false); }
      }
    },
  };
};

export { createChildrenRoom };
