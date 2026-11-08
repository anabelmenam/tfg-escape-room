import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { createBedroomFurniture } from "./bedroom/createBedroomFurniture.js";
import { createBedroomFixtures } from "./bedroom/createBedroomFixtures.js";
import { createBedroomDecor } from "./bedroom/createBedroomDecor.js";
import { createBedroomItems } from "./bedroom/createBedroomItems.js";
import { setupBedroomRadioPuzzle } from "./bedroom/puzzleSetups/setupBedroomRadioPuzzle.js";
import { setupBedroomPowerPuzzles } from "./bedroom/puzzleSetups/setupBedroomPowerPuzzles.js";
import { assembleBedroom } from "./bedroom/assembleBedroom.js";

const bedroomConfig = {
  wallColor: 0xc8b89d,
  floorColor: 0x6a4d3c,
  ceilingColor: 0xb0a18c,
  blanketColor: 0xa89305,
  pillowColor: 0xa89305,
  carpetColor: 0x762d34,
  ambientLightIntensity: 0.55,
};

const createBedroom = async ({
  character = "dad",
  onDoorOpenChange,
  onDoorUnlocked,
  onObjectFocus,
  onBedroomAction = null,
  testMode = false,
} = {}) => {
  if (!["mum", "dad"].includes(character)) {
    throw new Error(`Character no válido para Bedroom: ${character}`);
  }
  const config = bedroomConfig;
  const { room, roomColliders, bounds, doorOpening, windowOpenings, placeAgainstWall } = createRoom({
    wallColor: config.wallColor,
    floorColor: config.floorColor,
    ceilingColor: config.ceilingColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: {
      x: 7,
      y: 7,
    },

    floorTextureRepeat: {
      x: 10,
      y: 14.7,
    },

    ceilingTextureRepeat: {
      x: 7,
      y: 7,
    },
    width: 17,
    depth: 25,
    door: {
      wall: "front",
      position: -3,
      width: 5,
      height: 8,
    },
    windows: [
      {
        id: "bedroom-window-1",
        wall: "left",
        position: 3.1,
        width: 7,
        height: 6,
        bottom: 4,
      },
    ],

    omitWalls: ["front"],
  });

  room.name = `Bedroom-${character}`;
  room.userData.character = character;
  const clues = {
    radioNote: testMode,
    electricalPlan: testMode,
    revealedSymbols: testMode,
    familyPhoto: testMode,
  };
  const reportAction = (type, targetId, payload) => onBedroomAction?.(type, targetId, payload);

  const fixtures = createBedroomFixtures({
    character,
    testMode,
    characterConfig: config,
    doorOpening,
    windowOpenings,
    onDoorOpenChange,
    onDoorUnlocked,
  });
  const { door, lights } = fixtures;
  room.add(...lights);
  const furniture = createBedroomFurniture({ character, characterConfig: config, testMode });

  const items = createBedroomItems({ character, furniture, onAction: reportAction });
  const { flashlight } = items;

  const decor = createBedroomDecor({ character, desk: furniture.desk, cabinet: furniture.cabinet });

  const radioPuzzle = setupBedroomRadioPuzzle({
    character,
    testMode,
    clues,
    furniture,
    items,
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const powerPuzzles = setupBedroomPowerPuzzles({
    character,
    testMode,
    clues,
    furniture,
    fixtures,
    decor,
    items,
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const { lightRevealPuzzle } = powerPuzzles;

  const assembly = assembleBedroom({
    room,
    placeAgainstWall,
    character,
    furniture,
    fixtures,
    decor,
    items,
    radioPuzzle,
    powerPuzzles,
  });

  return {
    character,
    room,
    roomColliders,
    objectColliders: assembly.objectColliders,
    bounds,
    door,
    addStoryNote: (object3D) =>
      (character === "mum" ? furniture.nightstand1 : furniture.nightstand2).addObjectToDrawer(
        1,
        object3D,
        new THREE.Vector3(0, -0.16, -0.52),
      ),
    applyBedroomState: (state) => {
      powerPuzzles.applyState(state);
      radioPuzzle.applyState(state);
      if (flashlight && state.inventories?.dad?.includes("flashlight")) {
        flashlight.object3D.visible = false;
        flashlight.setEnabled(false);
      }
      const fuseUsed =
        Boolean(state.characters?.dad?.objects?.["bedroom-electrical-panel"]?.hasFuse) ||
        Boolean(state.characters?.dad?.puzzles?.["bedroom-electrical-panel"]?.solved);
      if (items.fuse && (state.inventories?.dad?.includes("fuse") || fuseUsed)) {
        items.fuse.object3D.visible = false;
        items.fuse.setEnabled(false);
      }
    },
    doorPassage: {
      minX: doorOpening.position.x - doorOpening.width / 2,

      maxX: doorOpening.position.x + doorOpening.width / 2,
    },
    doorOpening,
    interactables: assembly.interactables,
    entities: assembly.entities,
    puzzles: [...(lightRevealPuzzle ? [lightRevealPuzzle] : [])],
    spawnPosition: new THREE.Vector3(0, 5.25, 8),
  };
};

export { createBedroom };
