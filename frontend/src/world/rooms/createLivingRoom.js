import * as THREE from "three";
import { createRoom } from "./createRoom.js";

import { createLivingRoomDecor } from "./livingRoom/createLivingRoomDecor.js";
import { createShelfPaintingPuzzle } from "./livingRoom/createShelfPaintingPuzzle.js";
import { createFireplacePuzzle } from "./livingRoom/createFireplacePuzzle.js";
import { createChestPuzzle } from "./livingRoom/createChestPuzzle.js";
import { createLivingRoomFurniture } from "./livingRoom/createLivingRoomFurniture.js";
import { createLivingRoomFixtures } from "./livingRoom/createLivingRoomFixtures.js";
import { assembleLivingRoom } from "./livingRoom/assembleLivingRoom.js";

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
  const fixtures = createLivingRoomFixtures({
    timeline,
    testMode,
    entrance,
    kitchenEntrance,
    doorOpening,
    passageOpenings,
    windowOpenings,
    eventManager,
    onSwitchPress,
    onDoorOpenChange,
    onAction: onLivingRoomAction,
  });
  const { ambientLight, door, kitchenDoor } = fixtures;
  room.add(ambientLight);

  const furniture = createLivingRoomFurniture();
  const {
    sofa,
    armchairs: [armchair1, armchair2],
    table: table1,
    shelves: [shelf1, shelf2, shelf3],
    cabinet,
    woodStyle,
  } = furniture;

  const fireplacePuzzle = createFireplacePuzzle({
    timeline,
    testMode,
    sofa,
    armchairs: [armchair1, armchair2],
    onAction: onLivingRoomAction,
    onFocus: onObjectFocus,
  });
  const { displayCase } = fireplacePuzzle;

  if (displayCase) shelf3.addToShelf(displayCase.object3D, { shelf: 1, x: 0, z: 0, placeOnSurface: false });
  const decor = createLivingRoomDecor({
    shelves: [shelf1, shelf2, shelf3],
    cabinet,
    hasEntrance: Boolean(entrance),
  });

  const chestPuzzle = createChestPuzzle({
    timeline,
    testMode,
    shelf: shelf2,
    woodStyle,
    hasLetter: fireplacePuzzle.hasLetter,
    onAction: onLivingRoomAction,
    onFocus: onObjectFocus,
  });
  const paintingPuzzle = createShelfPaintingPuzzle({
    timeline,
    testMode,
    shelf: shelf1,
    table: table1,
    onAction: onLivingRoomAction,
    onFocus: onObjectFocus,
  });
  const assembly = assembleLivingRoom({
    room,
    placeAgainstWall,
    timeline,
    fixtures,
    furniture,
    decor,
    paintingPuzzle,
    fireplacePuzzle,
    chestPuzzle,
  });
  shelf1.endingHomePosition = shelf1.object3D.position.clone();
  shelf1.endingHomeRotation = shelf1.object3D.rotation.y;
  return {
    room,
    roomColliders,
    objectColliders: assembly.objectColliders,
    bounds,
    door,
    addStoryNote: (object3D) => cabinet.addObjectToDrawer(timeline === "past" ? 5 : 4, object3D, new THREE.Vector3(0, -.16, -.52)),
    doorPassage: doorOpening
      ? {
          minX: doorOpening.position.x - doorOpening.width / 2,
          maxX: doorOpening.position.x + doorOpening.width / 2,
        }
      : null,
    interactables: assembly.interactables,
    entities: assembly.entities,
    applyLivingRoomState: (state) => {
      paintingPuzzle.applyState(state);
      fireplacePuzzle.applyState(state);
      chestPuzzle.applyState(state);
      fixtures.applyState(state);
    },
    spawnLookAt: new THREE.Vector3(0, 5.25, 0),
    spawnPosition: new THREE.Vector3(0, 5.25, 8),
    kitchenDoor,
  };
};

export { createLivingRoom };
