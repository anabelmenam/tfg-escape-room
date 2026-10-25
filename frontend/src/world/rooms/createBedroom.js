import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { createBedroomFurniture } from "./bedroom/createBedroomFurniture.js";
import { createBedroomFixtures } from "./bedroom/createBedroomFixtures.js";
import { createBedroomDecor } from "./bedroom/createBedroomDecor.js";
import { createBedroomItems } from "./bedroom/createBedroomItems.js";
import { createBedroomRadioPuzzle } from "./bedroom/createBedroomRadioPuzzle.js";
import { createBedroomPowerPuzzles } from "./bedroom/createBedroomPowerPuzzles.js";
import { assembleBedroom } from "./bedroom/assembleBedroom.js";

const bedroomTimelineConfig = {
  past: {
    wallColor: 0xc8b89d,
    floorColor: 0x6a4d3c,
    ceilingColor: 0xb0a18c,
    blanketColor: 0xa89305,
    pillowColor: 0xa89305,
    carpetColor: 0x762d34,
    ambientLightIntensity: 0.55,
  },
  present: {
    wallColor: 0xc8b89d,
    floorColor: 0x6a4d3c,
    ceilingColor: 0xb0a18c,
    blanketColor: 0xa89305,
    pillowColor: 0xa89305,
    carpetColor: 0x762d34,
    ambientLightIntensity: 0.55,
  },
};

const createBedroom = async ({
  timeline = "present",
  onDoorOpenChange,
  onDoorUnlocked,
  onObjectFocus,
  onBedroomAction = null,
  testMode = false,
} = {}) => {
  const timelineConfig = bedroomTimelineConfig[timeline];

  if (!timelineConfig) {
    throw new Error(`Timeline no válido para Bedroom: ${timeline}`);
  }
  const { room, roomColliders, bounds, doorOpening, windowOpenings, placeAgainstWall } = createRoom({
    wallColor: timelineConfig.wallColor,
    floorColor: timelineConfig.floorColor,
    ceilingColor: timelineConfig.ceilingColor,
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

  room.name = `Bedroom-${timeline}`;
  room.userData.timeline = timeline;
  const clues = {
    radioNote: testMode,
    electricalPlan: testMode,
    revealedSymbols: testMode,
    familyPhoto: testMode,
  };
  const reportAction = (type, targetId, payload) => onBedroomAction?.(type, targetId, payload);

  const fixtures = createBedroomFixtures({
    timeline,
    testMode,
    timelineConfig,
    doorOpening,
    windowOpenings,
    onDoorOpenChange,
    onDoorUnlocked,
  });
  const { door, lights } = fixtures;
  room.add(...lights);
  const furniture = createBedroomFurniture({ timeline, timelineConfig });

  const items = createBedroomItems({ timeline, furniture, onAction: reportAction });
  const { flashlight } = items;

  const decor = createBedroomDecor({ timeline, desk: furniture.desk, cabinet: furniture.cabinet });

  const radioPuzzle = createBedroomRadioPuzzle({
    timeline,
    testMode,
    clues,
    furniture,
    items,
    onFocus: onObjectFocus,
    onAction: reportAction,
  });
  const powerPuzzles = createBedroomPowerPuzzles({
    timeline,
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
    timeline,
    furniture,
    fixtures,
    decor,
    items,
    radioPuzzle,
    powerPuzzles,
  });

  return {
    timeline,
    room,
    roomColliders,
    objectColliders: assembly.objectColliders,
    bounds,
    door,
    addStoryNote: (object3D) => (timeline === "past" ? furniture.nightstand1 : furniture.nightstand2)
      .addObjectToDrawer(1, object3D, new THREE.Vector3(0, -.16, -.52)),
    applyBedroomState: (state) => {
      powerPuzzles.applyState(state);
      radioPuzzle.applyState(state);
      if (flashlight && state.inventories?.present?.includes("flashlight")) {
        flashlight.object3D.visible = false;
        flashlight.setEnabled(false);
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
