import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { childrenRoomConfig, childrenRoomDimensions } from "./childrenRoom/childrenRoomConfig.js";
import { createChildrenRoomFurniture } from "./childrenRoom/createChildrenRoomFurniture.js";
import { createChildrenRoomFixtures } from "./childrenRoom/createChildrenRoomFixtures.js";
import { createChildrenRoomDecor } from "./childrenRoom/createChildrenRoomDecor.js";
import { createBlockPuzzle } from "./childrenRoom/createBlockPuzzle.js";
import { createPhotoBoardPuzzle } from "./childrenRoom/createPhotoBoardPuzzle.js";
import { createMusicPuzzle } from "./childrenRoom/createMusicPuzzle.js";
import { createWardrobePuzzle } from "./childrenRoom/createWardrobePuzzle.js";
import { assembleChildrenRoom } from "./childrenRoom/assembleChildrenRoom.js";

const createChildrenRoom = ({
  character = "dad",
  onObjectFocus = null,
  onChildrenRoomAction = null,
  testMode = false,
} = {}) => {
  const config = childrenRoomConfig[character];
  if (!config) throw new Error(`Character no válido para ChildrenRoom: ${character}`);
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
  const blockPuzzle = createBlockPuzzle({
    character,
    desk: furniture.desks[1],
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const musicPuzzle = createMusicPuzzle({
    character,
    testMode,
    desk: furniture.desks[0],
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const photoPuzzle = createPhotoBoardPuzzle({
    character,
    furniture,
    onFocus: onObjectFocus,
    onAction: reportAction,
    onSolved: () => {
      if (character === "mum") musicPuzzle.puzzle.setAvailable(true);
    },
  });
  const wardrobePuzzle = createWardrobePuzzle({
    character,
    wardrobe: furniture.wardrobes[0],
    onAction: reportAction,
  });

  if (testMode) {
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
    addStoryNote: (object3D) => furniture.dresser.addObjectToDrawer(character === "mum" ? 7 : 6, object3D, new THREE.Vector3(0, -.16, -.54)),
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
