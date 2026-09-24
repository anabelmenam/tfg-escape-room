import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { Carpet, Door, Frame, Lamp, Mirror, Switch, Table } from "../objects/index.js";

import { ClockPuzzle } from "../puzzles/ClockPuzzle.js";

const hallwayWoodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: {
    x: 1,
    y: 1,
  },
  woodColor: 0x5b3a29,
  darkWoodColor: 0x422a1e,
  interiorColor: 0x6b4734,
  drawerInteriorColor: 0x6b4734,
  handleColor: 0x9b773d,
};

const hallwayTimelineConfig = {
  past: {
    wallColor: 0xc8b89d,
    floorColor: 0x6a4d3c,
    ceilingColor: 0xb0a18c,
    trimColor: 0x4a2c1d,
    carpetColor: 0x762d34,
    carpetSideColor: 0x3d1c20,
  },
  present: {
    wallColor: 0xa7a49c,
    floorColor: 0x4e4541,
    ceilingColor: 0x8b8983,
    trimColor: 0x292526,
    carpetColor: 0x51484c,
    carpetSideColor: 0x242426,
  },
};

const createHallway = ({ timeline = "present", entranceX = -3, entranceZ = 12.5, onObjectFocus = null } = {}) => {
  const timelineConfig = hallwayTimelineConfig[timeline];
  if (!timelineConfig) {
    throw new Error(`Timeline no válido para Hallway: ${timeline}`);
  }

  const width = 50;
  const depth = 10;
  const height = 12;
  const separationFromBedroom = 0;
  const edgeInset = 6;
  const hallwayCenterX = entranceX + width / 2 - edgeInset;
  const connectionX = entranceX - hallwayCenterX;
  const { room, roomColliders, passageOpenings } = createRoom({
    width,
    depth,
    height,
    wallColor: timelineConfig.wallColor,
    floorColor: timelineConfig.floorColor,
    ceilingColor: timelineConfig.ceilingColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 20, y: 7 },
    floorTextureRepeat: { x: 29, y: 5.5 },
    ceilingTextureRepeat: { x: 3, y: 4 },
    door: null,
    passages: [
      { id: "bedroom-hallway-connection", wall: "back", position: connectionX, width: 5, height: 8 },
      { id: "living-room-hallway-connection", wall: "front", position: 0, width: 5, height: 8 },
    ],
  });

  room.name = `Bedroom Hallway-${timeline}`;
  room.position.set(hallwayCenterX, 0, entranceZ + separationFromBedroom + depth / 2);
  const livingRoomOpening = passageOpenings.find((opening) => opening.id === "living-room-hallway-connection");
  const livingRoomDoorPosition = livingRoomOpening.position.clone();
  livingRoomDoorPosition.x -= livingRoomOpening.width / 2;
  livingRoomDoorPosition.y = livingRoomOpening.height / 2;
  const livingRoomDoor = new Door({ id: "hallway-living-room-door", position: livingRoomDoorPosition });
  room.add(livingRoomDoor.object3D);

  const trimMaterial = new THREE.MeshStandardMaterial({ color: timelineConfig.trimColor, roughness: 0.65 });
  [-1, 1].forEach((side) => {
    const baseboard = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.45, depth - 0.4), trimMaterial);
    baseboard.position.set(side * (width / 2 - 0.08), 0.22, 0);
    baseboard.castShadow = true;
    baseboard.receiveShadow = true;
    room.add(baseboard);
  });

  const hallwayLamps = [connectionX + 10, connectionX + 30].map((lampX, index) => {
    const lamp = new Lamp({
      id: `hallway-${timeline}-lamp-${index + 1}`,
      position: new THREE.Vector3(lampX, height, 0),
    });
    room.add(lamp.object3D);
    return lamp;
  });

  const setHallwayLights = (active) => {
    hallwayLamps.forEach((lamp) => lamp.setActive(active));
  };
  setHallwayLights(false);

  const hallwaySwitch = new Switch({
    id: `hallway-${timeline}-switch`,
    position: new THREE.Vector3(connectionX + 3, 4, -depth / 2 + 0.48),
    scale: 0.75,
    onPress: (switchObject) => setHallwayLights(switchObject.active),
  });

  room.add(hallwaySwitch.object3D);

  const consoleTable = new Table({
    id: `hallway-${timeline}-console`,
    position: new THREE.Vector3(-24, 0, 0),
    rotationY: Math.PI / 2,
    width: 4,
    height: 2.5,
    depth: 1,
    hasShelf: true,
    ...hallwayWoodStyle,
    createCollider: false,
  });
  const hallwayCarpet = new Carpet({
    id: `hallway-${timeline}-carpet`,
    position: new THREE.Vector3(0, 0.03, 0),
    width: 34,
    depth: 2.3,
    color: timelineConfig.carpetColor,
    texture: "/textures/furniture/carpet.jpg",
    textureRepeat: {
      x: 8,
      y: 1,
    },
    hasFringes: false,
  });
  const mirror = new Mirror({
    id: `hallway-${timeline}-mirror`,
    scale: 1.5,
    position: new THREE.Vector3(-24.42, 5.6),
    rotationY: Math.PI / 2,
  });
  const clock = new ClockPuzzle({
    id: `hallway-${timeline}-clock`,
    onFocus: onObjectFocus,
    timeline,
    position: new THREE.Vector3(24.42, 7.6, 0),
    rotationY: -Math.PI / 2,
  });

  const daughterFrame = new Frame({
    id: `hallway-${timeline}-daughter-frame`,
    position: new THREE.Vector3(24.42, 5.7, -2.4),
    rotationY: -Math.PI / 2,
    width: 1.65,
    height: 2.2,
    scale: 2,
    imagePath: "/images/family/daughter-portrait.png",
    mount: "wall",
  });
  const sonFrame = new Frame({
    id: `hallway-${timeline}-son-frame`,
    position: new THREE.Vector3(24.42, 5.7, 2.4),
    rotationY: -Math.PI / 2,
    width: 1.65,
    height: 2.2,
    scale: 2,
    imagePath: "/images/family/son-portrait.png",
    mount: "wall",
  });
  room.add(
    consoleTable.object3D,
    hallwayCarpet.object3D,
    mirror.object3D,
    clock.object3D,
    daughterFrame.object3D,
    sonFrame.object3D,
  );

  return {
    room,
    roomColliders,
    mirror,
    clock,
    hallwaySwitch,
    hallwayLamps,
    consoleTable,
    hallwayCarpet,
    livingRoomDoor,
    livingRoomOpening,
    dimensions: { width, depth },
    bounds: {
      minX: hallwayCenterX - width / 2,
      maxX: hallwayCenterX + width / 2,
      minZ: entranceZ,
      maxZ: entranceZ + separationFromBedroom + depth,
    },
  };
};

export { createHallway };
