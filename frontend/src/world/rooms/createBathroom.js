import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { bathroomConfig, bathroomDimensions } from "./bathroom/bathroomConfig.js";
import { createBathroomFixtures } from "./bathroom/createBathroomFixtures.js";
import { createBathroomFurniture } from "./bathroom/createBathroomFurniture.js";
import { createBathroomDecor } from "./bathroom/createBathroomDecor.js";
import { createBathroomPuzzles } from "./bathroom/createBathroomPuzzles.js";
import { assembleBathroom } from "./bathroom/assembleBathroom.js";

const createBathroom = ({ character = "dad", onObjectFocus = null, onBathroomAction = null, testMode = false } = {}) => {
  const config = bathroomConfig[character];
  if (!config) throw new Error(`Character no válido para Bathroom: ${character}`);
  const { width, depth, height } = bathroomDimensions;
  const { room, roomColliders, bounds, windowOpenings, placeAgainstWall } = createRoom({
    width, depth, height,
    wallColor: config.wallColor, floorColor: config.floorColor, ceilingColor: config.wallColor,
    wallTexture: "/textures/rooms/whiteWall.jpg", floorTexture: "/textures/rooms/bathroom-floor-tiles.png", ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 6, y: 4 }, floorTextureRepeat: { x: 1.5, y: 1 }, ceilingTextureRepeat: { x: 5, y: 5 },
    door: { wall: "right", position: 0, width: 5, height: 8 }, omitWalls: ["right"],
    windows: [{ id: `bathroom-${character}-window`, wall: "left", position: .45, width: 6.2, height: 4.8, bottom: 4.15 }],
  });
  room.name = `Bathroom-${character}`;
  room.userData.character = character;
  const reportAction = (type, targetId, payload) => onBathroomAction?.(type, targetId, payload);
  const fixtures = createBathroomFixtures({ character, config, dimensions: bathroomDimensions, windowOpenings });
  const furniture = createBathroomFurniture({ character, config });
  const decor = createBathroomDecor({ vanity: furniture.vanity });
  const puzzles = createBathroomPuzzles({ character, testMode, vanity: furniture.vanity, onFocus: onObjectFocus, onAction: reportAction });
  const assembly = assembleBathroom({ room, placeAgainstWall, furniture, fixtures, decor, puzzles });
  return {
    room, roomColliders, objectColliders: assembly.objectColliders, bounds, dimensions: bathroomDimensions,
    interactables: assembly.interactables, entities: assembly.entities,
    applyBathroomState: puzzles.applyState,
    addStoryNote: (object3D) => {
      if (character === "mum") furniture.vanity.addObjectToDrawer(0, object3D, new THREE.Vector3(-.5, -.08, -.55));
      else {
        object3D.position.set(.75, .72, .05);
        object3D.rotation.set(-Math.PI / 2, 0, .08);
        furniture.vanity.object3D.add(object3D);
      }
    },
    lightSwitch: fixtures.lightSwitch,
    lamp: fixtures.lamp,
  };
};
export { createBathroom };
