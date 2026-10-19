import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import {
  Carpet,
  Door,
  Frame,
  Lamp,
  Switch,
  Table,
  Paper,
  Key,
  createKeyBowl,
  createUmbrellaStand,
  createVase,
} from "../objects/index.js";

import { MazePuzzle } from "../puzzles/MazePuzzle.js";
import { HallwayMazeMirror } from "../puzzles/index.js";
import { drawMaze } from "../puzzles/mazeLayout.js";

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
    wallColor: 0xa7a49c,
    floorColor: 0x4e4541,
    ceilingColor: 0x8b8983,
    carpetColor: 0x51484c,
    carpetSideColor: 0x242426,
  },
  present: {
    wallColor: 0xa7a49c,
    floorColor: 0x4e4541,
    ceilingColor: 0x8b8983,
    carpetColor: 0x51484c,
    carpetSideColor: 0x242426,
  },
};

const createHallway = ({
  timeline = "present",
  entranceX = -3,
  entranceZ = 12.5,
  onObjectFocus = null,
  onHallwayAction = null,
} = {}) => {
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
  const { room, roomColliders, passageOpenings, placeAgainstWall } = createRoom({
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
      { id: "living-room-hallway-connection", wall: "front", position: -14, width: 5, height: 8 },
      { id: "hallway-kitchen-opening", wall: "front", position: 11, width: 5, height: 8 },
      { id: "hallway-children-room-opening", wall: "back", position: 9, width: 5, height: 8 },
      { id: "hallway-bathroom-opening", wall: "left", position: 0, width: 5, height: 8 },
      { id: "hallway-street-opening", wall: "right", position: 0, width: 5, height: 8 },
    ],
  });

  room.name = `Bedroom Hallway-${timeline}`;
  room.position.set(hallwayCenterX, 0, entranceZ + separationFromBedroom + depth / 2);
  const livingRoomOpening = passageOpenings.find((opening) => opening.id === "living-room-hallway-connection");
  const childrenRoomOpening = passageOpenings.find((opening) => opening.id === "hallway-children-room-opening");
  const bathroomOpening = passageOpenings.find((opening) => opening.id === "hallway-bathroom-opening");
  const kitchenOpening = passageOpenings.find((opening) => opening.id === "hallway-kitchen-opening");
  const livingRoomDoorPosition = livingRoomOpening.position.clone();
  livingRoomDoorPosition.x -= livingRoomOpening.width / 2;
  livingRoomDoorPosition.y = livingRoomOpening.height / 2;
  const livingRoomDoor = new Door({
    id: "hallway-living-room-door",
    position: livingRoomDoorPosition,
    //requiredKey: "living-room-key",
    onUnlock: () => onHallwayAction?.("object.interact", "hallway-living-room-door"),
  });
  room.add(livingRoomDoor.object3D);

  const hallwayDoorSpecs = [
    ["hallway-children-room-door", "hallway-children-room-opening"],
    ["hallway-bathroom-door", "hallway-bathroom-opening"],
    ["hallway-kitchen-door", "hallway-kitchen-opening"],
    ["hallway-street-door", "hallway-street-opening"],
  ];
  const hallwayDoors = hallwayDoorSpecs.map(([id, openingId]) => {
    const opening = passageOpenings.find((entry) => entry.id === openingId);
    const position = opening.position
      .clone()
      .add(new THREE.Vector3(-opening.width / 2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), opening.rotationY));
    const door = new Door({
      id,
      position,
      rotationY: opening.rotationY,
      locked: false,
    });
    room.add(door.object3D);
    return door;
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

  const hallwaySwitches = [];
  const onHallwaySwitchPress = (pressedSwitch) => {
    setHallwayLights(pressedSwitch.active);
    hallwaySwitches.forEach((switchObject) => {
      if (switchObject !== pressedSwitch) switchObject.setActive(pressedSwitch.active);
    });
  };

  const hallwaySwitch = new Switch({
    id: `hallway-${timeline}-switch`,
    position: new THREE.Vector3(connectionX + 3, 4, -depth / 2 + 0.48),
    scale: 0.75,
    onPress: onHallwaySwitchPress,
  });

  const hallwayExitSwitch = new Switch({
    id: `hallway-${timeline}-exit-switch`,
    position: new THREE.Vector3(0, 4, 3.5),
    scale: 0.75,
    onPress: onHallwaySwitchPress,
  });
  hallwayExitSwitch.object3D.rotation.y = -Math.PI / 2;
  hallwaySwitches.push(hallwaySwitch, hallwayExitSwitch);

  room.add(hallwaySwitch.object3D, hallwayExitSwitch.object3D);

  const consoleTable = new Table({
    id: `hallway-${timeline}-console`,
    position: new THREE.Vector3(16, 0, 0),
    rotationY: Math.PI,
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
    depth: 5,
    color: timelineConfig.carpetColor,
    texture: "/textures/furniture/carpet.jpg",
    textureRepeat: {
      x: 8,
      y: 1,
    },
    hasFringes: false,
  });

  const agedDecor = true;
  const consoleVase = createVase({ aged: agedDecor, scale: 0.72, flowers: true });
  consoleVase.position.set(-0.72, 2.62, 0);
  consoleTable.object3D.add(consoleVase);

  const keyBowl = createKeyBowl({ aged: agedDecor, scale: 0.82 });
  keyBowl.position.set(0.9, 2.59, 0);
  consoleTable.object3D.add(keyBowl);

  const umbrellaStand = createUmbrellaStand({ aged: agedDecor, scale: 0.95 });
  umbrellaStand.position.set(23.8, 0, 4.3);

  const mazeNote = new Paper({
    id: "hallway-maze-note",
    width: 0.83,
    height: 0.83,
    position: new THREE.Vector3(-10.25, 5.7, -4.42),
    rotationY: 0,
    content: (ctx, canvas) => drawMaze(ctx, canvas, { solution: true }),
    onFocus: onObjectFocus,
  });
  const noteMesh = mazeNote.object3D.children[0];
  noteMesh.material.dispose();
  noteMesh.material = new THREE.MeshBasicMaterial({ map: mazeNote.texture, side: THREE.DoubleSide });
  mazeNote.object3D.visible = false;
  mazeNote.setEnabled(false);
  mazeNote.getFocusPosition = () => {
    mazeNote.object3D.updateWorldMatrix(true, false);
    return mazeNote.object3D.localToWorld(new THREE.Vector3(0, 0, 1.2));
  };
  mazeNote.dispose = () => {
    mazeNote.texture.dispose();
    noteMesh.geometry.dispose();
    noteMesh.material.dispose();
  };
  const revealNote = () => {
    mazeNote.object3D.visible = true;
    mazeNote.setEnabled(true);
  };
  const clock = new ClockPuzzle({
    onSolved: () => {
      revealNote();
      onHallwayAction?.("puzzle.solved", "hallway-clock");
    },
    id: `hallway-${timeline}-clock`,
    onFocus: onObjectFocus,
    timeline,
    position: new THREE.Vector3(-10.25, 5.7, -4.42),
    rotationY: 0,
  });

  const livingRoomKey = new Key({ id: "living-room-key" });
  livingRoomKey.setEnabled(false);
  const maze =
    timeline === "present"
      ? new MazePuzzle({
          position: new THREE.Vector3(16, 5.15, 0),
          rotationY: Math.PI,
          onFocus: onObjectFocus,
          key: livingRoomKey,
          onSolved: () => onHallwayAction?.("puzzle.solved", "hallway-maze"),
        })
      : null;
  const mazeMirror = new HallwayMazeMirror({
    position: new THREE.Vector3(16, 5.15, 0),
    rotationY: Math.PI,
    showScrews: timeline === "present",
    onToggle: timeline === "present"
      ? () => onHallwayAction?.("object.interact", "hallway-maze-mirror")
      : null,
  });
  if (maze) room.add(maze.object3D);
  if (mazeMirror) room.add(mazeMirror.object3D);
  if (timeline === "past") room.add(mazeNote.object3D);

  const daughterFrame = new Frame({
    id: `hallway-${timeline}-daughter-frame`,
    position: new THREE.Vector3(-13, 5.7, -4.42),
    rotationY: 0,
    width: 1.65,
    height: 2.2,
    scale: 2,
    imagePath: "/images/family/daughter-portrait.png",
    mount: "wall",
  });
  const sonFrame = new Frame({
    id: `hallway-${timeline}-son-frame`,
    position: new THREE.Vector3(-7.5, 5.7, -4.42),
    rotationY: 0,
    width: 1.65,
    height: 2.2,
    scale: 2,
    imagePath: "/images/family/son-portrait.png",
    mount: "wall",
  });
  room.add(
    consoleTable.object3D,
    hallwayCarpet.object3D,
    clock.object3D,
    daughterFrame.object3D,
    sonFrame.object3D,
    umbrellaStand,
  );

  placeAgainstWall(hallwaySwitch, "back");
  placeAgainstWall(hallwayExitSwitch, "right");
  placeAgainstWall(consoleTable, "front");
  placeAgainstWall(clock, "back");
  if (timeline === "past") placeAgainstWall(mazeNote, "back");
  if (maze) {
    placeAgainstWall(maze, "front");
    // Keep the maze and its key behind the closed mirror instead of letting
    // the key clip through the reflective surface.
    maze.object3D.translateZ(-0.13);
  }
  if (mazeMirror) placeAgainstWall(mazeMirror, "front");
  placeAgainstWall(daughterFrame, "back");
  placeAgainstWall(sonFrame, "back");

  return {
    room,
    roomColliders,
    maze,
    mazeMirror,
    mazeNote,
    livingRoomKey,
    applyHallwayState: (state) => {
      if (maze && state.timelines?.past?.puzzles?.["hallway-clock"]?.solved) maze.available = true;
      if (state.timelines?.past?.puzzles?.["hallway-clock"]?.solved && timeline === "past") {
        clock.solve({ notify: false });
        revealNote();
      }
      if (state.timelines?.present?.puzzles?.["hallway-maze"]?.solved) maze?.solve({ notify: false });
      if (timeline === "present") {
        const mirrorState = state.timelines?.present?.objects?.["hallway-maze-mirror"];
        mazeMirror.setReleased(Boolean(mirrorState?.released));
        mazeMirror.setOpen(Boolean(mirrorState?.open));
      }
      if (state.timelines?.[timeline]?.objects?.["hallway-living-room-door"]?.locked === false) {
        livingRoomDoor.unlock({ notify: false });
        livingRoomKey.object3D.visible = false;
        livingRoomKey.setEnabled(false);
      }
    },
    interactables: [
      clock,
      hallwaySwitch,
      hallwayExitSwitch,
      livingRoomDoor,
      ...hallwayDoors,
      ...(timeline === "present" ? [mazeMirror] : []),
      ...(timeline === "past" ? [mazeNote] : [maze]),
    ],
    entities: [clock, hallwaySwitch, hallwayExitSwitch, livingRoomDoor, ...hallwayDoors, ...hallwayLamps, ...(mazeMirror ? [mazeMirror] : []), ...(maze ? [maze] : [mazeNote])],
    mirror: mazeMirror,
    clock,
    hallwaySwitch,
    hallwayExitSwitch,
    hallwayLamps,
    consoleTable,
    hallwayCarpet,
    livingRoomDoor,
    hallwayDoors,
    livingRoomOpening,
    childrenRoomOpening,
    bathroomOpening,
    kitchenOpening,
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
