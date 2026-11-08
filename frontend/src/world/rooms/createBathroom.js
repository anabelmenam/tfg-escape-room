import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { createBathroomFixtures } from "./bathroom/createBathroomFixtures.js";
import { createBathroomFurniture } from "./bathroom/createBathroomFurniture.js";
import { createBathroomDecor } from "./bathroom/createBathroomDecor.js";
import { setupBathroomPuzzles } from "./bathroom/puzzleSetups/setupBathroomPuzzles.js";
import { assembleBathroom } from "./bathroom/assembleBathroom.js";

const bathroomConfig = {
  wallColor: 0xc8b89d,
  floorColor: 0x8ba6a2,
  fixtureColor: 0xf1ead9,
  cabinetColor: 0x7b573d,
  metalColor: 0xb9aa83,
  textileColor: 0x668e8a,
  ambientIntensity: 0.38,
};
const bathroomDimensions = { width: 15, depth: 10, height: 12 };

const createBathroom = ({
  character = "dad",
  onObjectFocus = null,
  onBathroomAction = null,
  testMode = false,
} = {}) => {
  if (!["mum", "dad"].includes(character)) throw new Error(`Character no válido para Bathroom: ${character}`);
  const config = bathroomConfig;
  const { width, depth, height } = bathroomDimensions;
  const { room, roomColliders, bounds, windowOpenings, placeAgainstWall } = createRoom({
    width,
    depth,
    height,
    wallColor: config.wallColor,
    floorColor: config.floorColor,
    ceilingColor: config.wallColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/bathroom-floor-tiles.png",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 6, y: 4 },
    floorTextureRepeat: { x: 1.5, y: 1 },
    ceilingTextureRepeat: { x: 5, y: 5 },
    door: { wall: "right", position: 0, width: 5, height: 8 },
    omitWalls: ["right"],
    windows: [
      { id: `bathroom-${character}-window`, wall: "left", position: 0.45, width: 6.2, height: 4.8, bottom: 4.15 },
    ],
  });
  room.name = `Bathroom-${character}`;
  room.userData.character = character;
  const reportAction = (type, targetId, payload) => onBathroomAction?.(type, targetId, payload);

  const fixtures = createBathroomFixtures({ character, config, dimensions: bathroomDimensions, windowOpenings });
  const furniture = createBathroomFurniture({ character, config, testMode });
  const decor = createBathroomDecor({ vanity: furniture.vanity });
  const puzzles = setupBathroomPuzzles({
    character,
    testMode,
    vanity: furniture.vanity,
    onFocus: onObjectFocus,
    onAction: reportAction,
  });

  const assembly = assembleBathroom({ room, placeAgainstWall, furniture, fixtures, decor, puzzles });
  return {
    room,
    roomColliders,
    objectColliders: assembly.objectColliders,
    bounds,
    dimensions: bathroomDimensions,
    interactables: assembly.interactables,
    entities: assembly.entities,
    applyBathroomState: puzzles.applyState,
    addStoryNote: (object3D) => {
      if (character === "mum") furniture.vanity.addObjectToDrawer(0, object3D, new THREE.Vector3(-0.5, -0.08, -0.55));
      else {
        object3D.position.set(0.75, 0.72, 0.05);
        object3D.rotation.set(-Math.PI / 2, 0, 0.08);
        furniture.vanity.object3D.add(object3D);
      }
    },
    lightSwitch: fixtures.lightSwitch,
    lamp: fixtures.lamp,
  };
};
export { createBathroom };
