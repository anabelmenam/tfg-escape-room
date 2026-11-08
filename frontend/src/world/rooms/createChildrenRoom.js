import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { createChildrenRoomFurniture } from "./childrenRoom/createChildrenRoomFurniture.js";
import { createChildrenRoomFixtures } from "./childrenRoom/createChildrenRoomFixtures.js";
import { createChildrenRoomDecor } from "./childrenRoom/createChildrenRoomDecor.js";
import { setupBlockPuzzle } from "./childrenRoom/puzzleSetups/setupBlockPuzzle.js";
import { setupPhotoBoardPuzzle } from "./childrenRoom/puzzleSetups/setupPhotoBoardPuzzle.js";
import { setupMusicPuzzle } from "./childrenRoom/puzzleSetups/setupMusicPuzzle.js";
import { setupWardrobePuzzle } from "./childrenRoom/puzzleSetups/setupWardrobePuzzle.js";
import { assembleChildrenRoom } from "./childrenRoom/assembleChildrenRoom.js";

const childrenRoomConfig = {
  wallColor: 0xd8c9a9,
  floorColor: 0x76543d,
  ceilingColor: 0xeee1c7,
  blanketColors: [0x6f91b7, 0xc77b83],
  carpetColor: 0xb68d42,
  ambientIntensity: 0.62,
};
const childrenRoomDimensions = { width: 22, depth: 20, height: 12 };

const createChildrenRoom = ({
  character = "dad",
  onObjectFocus = null,
  onChildrenRoomAction = null,
  testMode = false,
} = {}) => {
  if (!["mum", "dad"].includes(character)) throw new Error(`Character no válido para ChildrenRoom: ${character}`);
  const config = childrenRoomConfig;
  const { width, depth, height } = childrenRoomDimensions;
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
  room.name = `Children Room-${character}`;
  room.userData.character = character;

  const reportAction = (type, targetId) => onChildrenRoomAction?.(type, targetId);
  const furniture = createChildrenRoomFurniture({ config });
  const fixtures = createChildrenRoomFixtures({
    character,
    config,
    dimensions: childrenRoomDimensions,
    windowOpenings,
  });
  const decor = createChildrenRoomDecor({ desks: furniture.desks });

  const blockPuzzle = setupBlockPuzzle({
    character,
    desk: furniture.desks[1],
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const musicPuzzle = setupMusicPuzzle({
    character,
    testMode,
    desk: furniture.desks[0],
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const photoPuzzle = setupPhotoBoardPuzzle({
    character,
    furniture,
    onFocus: onObjectFocus,
    onAction: reportAction,
    onSolved: () => {
      if (character === "mum") musicPuzzle.puzzle.setAvailable(true);
    },
  });
  const wardrobePuzzle = setupWardrobePuzzle({
    character,
    testMode,
    wardrobe: furniture.wardrobes[0],
    onAction: reportAction,
  });

  if (testMode) {
    wardrobePuzzle.unlock();
    musicPuzzle.puzzle.setAvailable(true);
    if (character === "mum") {
      photoPuzzle.puzzle.solve({ notify: false });
      photoPuzzle.puzzle.setOpen(true, { immediate: true });
      musicPuzzle.puzzle.setKeyInserted({ notify: false });
      blockPuzzle.revealPushpin();
      photoPuzzle.puzzle.revealHiddenReward();
      musicPuzzle.puzzle.openBox();
      musicPuzzle.boltCutters?.reveal();
    }
    photoPuzzle.puzzle.setAvailable(true);
  }

  const assembly = assembleChildrenRoom({
    room,
    placeAgainstWall,
    character,
    furniture,
    fixtures,
    decor,
    blockPuzzle,
    photoPuzzle,
    musicPuzzle,
    wardrobePuzzle,
  });

  return {
    room,
    roomColliders,
    objectColliders: assembly.objectColliders,
    bounds,
    dimensions: childrenRoomDimensions,
    addStoryNote: (object3D) =>
      furniture.dresser.addObjectToDrawer(character === "mum" ? 7 : 6, object3D, new THREE.Vector3(0, -0.16, -0.54)),
    interactables: assembly.interactables,
    entities: assembly.entities,
    applyChildrenRoomState: (state) => {
      blockPuzzle.applyState(state);
      photoPuzzle.applyState(state);
      musicPuzzle.applyState(state);
      wardrobePuzzle.applyState(state);
    },
  };
};

export { createChildrenRoom };
