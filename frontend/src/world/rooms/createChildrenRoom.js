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
  timeline = "present",
  onObjectFocus = null,
  onChildrenRoomAction = null,
  testMode = false,
} = {}) => {
  const config = childrenRoomConfig[timeline];
  if (!config) throw new Error(`Timeline no válido para ChildrenRoom: ${timeline}`);
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
  room.name = `Children Room-${timeline}`;
  room.userData.timeline = timeline;

  const reportAction = (type, targetId) => onChildrenRoomAction?.(type, targetId);
  const furniture = createChildrenRoomFurniture({ config });
  const fixtures = createChildrenRoomFixtures({
    timeline,
    config,
    dimensions: childrenRoomDimensions,
    windowOpenings,
  });
  const decor = createChildrenRoomDecor({ desks: furniture.desks });
  const blockPuzzle = createBlockPuzzle({
    timeline,
    desk: furniture.desks[1],
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const musicPuzzle = createMusicPuzzle({
    timeline,
    testMode,
    desk: furniture.desks[0],
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const photoPuzzle = createPhotoBoardPuzzle({
    timeline,
    furniture,
    onFocus: onObjectFocus,
    onAction: reportAction,
    onSolved: () => {
      if (timeline === "past") musicPuzzle.puzzle.setAvailable(true);
    },
  });
  const wardrobePuzzle = createWardrobePuzzle({
    timeline,
    wardrobe: furniture.wardrobes[0],
    onAction: reportAction,
  });

  if (testMode) {
    musicPuzzle.puzzle.setAvailable(true);
    if (timeline === "past") {
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
    timeline,
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
    addStoryNote: (object3D) => furniture.dresser.addObjectToDrawer(timeline === "past" ? 7 : 6, object3D, new THREE.Vector3(0, -.16, -.54)),
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
