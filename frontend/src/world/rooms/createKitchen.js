import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { kitchenConfig, kitchenDimensions } from "./kitchen/kitchenConfig.js";
import { createKitchenFixtures } from "./kitchen/createKitchenFixtures.js";
import { createKitchenFurniture } from "./kitchen/createKitchenFurniture.js";
import { createKitchenDecor } from "./kitchen/createKitchenDecor.js";
import { createKitchenAppliancePuzzles } from "./kitchen/createKitchenAppliancePuzzles.js";
import { createKitchenFoodPuzzles } from "./kitchen/createKitchenFoodPuzzles.js";
import { assembleKitchen } from "./kitchen/assembleKitchen.js";

const createKitchen = ({
  character = "dad",
  onObjectFocus = null,
  onKitchenAction = null,
  testMode = false,
} = {}) => {
  const config = kitchenConfig[character];
  if (!config) throw new Error(`Character no válido para Kitchen: ${character}`);
  const { width, depth, height } = kitchenDimensions;
  const { room, roomColliders, bounds, windowOpenings, placeAgainstWall } = createRoom({
    width,
    depth,
    height,
    wallColor: config.wallColor,
    floorColor: config.floorColor,
    ceilingColor: config.wallColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 7, y: 7 },
    floorTextureRepeat: { x: 9, y: 13 },
    ceilingTextureRepeat: { x: 5, y: 8 },
    door: null,
    passages: [
      { id: "kitchen-hallway-connection", wall: "back", position: 0, width: 5, height: 8 },
      { id: "kitchen-living-room-connection", wall: "left", position: 9, width: 5, height: 8 },
    ],
    omitWalls: ["back", "left"],
    windows: [
      { id: `kitchen-${character}-window`, wall: "front", position: 0, width: 8, height: 6, bottom: 3.2 },
      { id: `kitchen-${character}-sink-window`, wall: "right", position: -2.1, width: 5.4, height: 6, bottom: 3.2 },
    ],
  });
  room.name = `Kitchen-${character}`;
  room.userData.character = character;

  const reportAction = (type, targetId, payload) => onKitchenAction?.(type, targetId, payload);
  const fixtures = createKitchenFixtures({ character, config, dimensions: kitchenDimensions, windowOpenings });
  const furniture = createKitchenFurniture({ character, config });
  const decor = createKitchenDecor({ character, depth, furniture });
  const appliancePuzzles = createKitchenAppliancePuzzles({
    character,
    testMode,
    furniture,
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const foodPuzzles = createKitchenFoodPuzzles({
    character,
    testMode,
    furniture,
    appliancePuzzles,
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const assembly = assembleKitchen({
    room,
    placeAgainstWall,
    furniture,
    fixtures,
    decor,
    foodPuzzles,
    appliancePuzzles,
  });

  return {
    room,
    roomColliders,
    objectColliders: assembly.objectColliders,
    bounds,
    dimensions: kitchenDimensions,
    interactables: assembly.interactables,
    entities: assembly.entities,
    applyKitchenState: (state) => {
      foodPuzzles.applyState(state);
      appliancePuzzles.applyState(state);
    },
    addStoryNote: (object3D) => {
      if (character === "mum") return furniture.smallCounter.addObjectToDrawer(0, object3D, new THREE.Vector3(0, -.12, -.58));
      object3D.position.set(0, 4.86, -.05);
      furniture.secondTallCabinet.object3D.add(object3D);
      return true;
    },
    lightSwitch: fixtures.lightSwitch,
    livingRoomDoorSwitch: fixtures.livingRoomDoorSwitch,
    lamps: fixtures.lamps,
  };
};

export { createKitchen };
