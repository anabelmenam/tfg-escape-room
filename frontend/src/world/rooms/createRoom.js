import * as THREE from "three";
import { createRoomMaterials } from "./room/createRoomMaterials.js";
import { createOpenings, getTransformedOpenings, VALID_WALLS } from "./room/roomOpenings.js";
import { createRoomShell } from "./room/createRoomShell.js";
import { createWallPlacement } from "./room/createWallPlacement.js";

const DEFAULT_REPEAT = { x: 4, y: 4 };

const createRoom = ({
  width = 30,
  height = 12,
  depth = 30,
  wallThickness = 0.3,
  wallColor = 0xd9d9d9,
  floorColor = 0x6b4f35,
  ceilingColor = wallColor,
  wallTexture = null,
  floorTexture = null,
  ceilingTexture = null,
  wallTextureRepeat = { x: 4, y: 2 },
  floorTextureRepeat = DEFAULT_REPEAT,
  ceilingTextureRepeat = DEFAULT_REPEAT,
  door = { wall: "front", position: 0, width: 5, height: 8 },
  windows = [],
  passages = [],
  omitWalls = [],
} = {}) => {
  const room = new THREE.Group();
  const roomColliders = [];
  const dimensions = { width, height, depth, wallThickness };
  const openings = createOpenings({ door, windows, passages, width, height, depth });
  const materials = createRoomMaterials({
    wallColor,
    floorColor,
    ceilingColor,
    wallTexture,
    floorTexture,
    ceilingTexture,
    wallTextureRepeat,
    floorTextureRepeat,
    ceilingTextureRepeat,
  });

  createRoomShell({
    room,
    colliders: roomColliders,
    dimensions,
    openings,
    omitWalls,
    materials,
    walls: VALID_WALLS,
  });

  return {
    room,
    roomColliders,
    placeAgainstWall: createWallPlacement(room, dimensions),
    bounds: {
      minX: -width / 2 + 0.5,
      maxX: width / 2 - 0.5,
      minZ: -depth / 2 + 0.5,
      maxZ: depth / 2 - 0.5,
      floorY: 5.25,
      ceilingY: height,
    },
    ...getTransformedOpenings(openings, dimensions),
  };
};

export { createRoom };
