import { createRoom } from "./createRoom.js";
import { hallwayDimensions, hallwayTimelineConfig } from "./hallway/hallwayConfig.js";
import { createHallwayDoors } from "./hallway/createHallwayDoors.js";
import { createHallwayLighting } from "./hallway/createHallwayLighting.js";
import { createHallwayPuzzle } from "./hallway/createHallwayPuzzle.js";
import { createHallwayDecor } from "./hallway/createHallwayDecor.js";

const createHallway = ({ timeline = "present", entranceX = -3, entranceZ = 12.5, onObjectFocus = null, onHallwayAction = null, isInteractHeld = () => false, testMode = false } = {}) => {
  const config = hallwayTimelineConfig[timeline];
  if (!config) throw new Error(`Timeline no válido para Hallway: ${timeline}`);
  const { width, depth, height } = hallwayDimensions;
  const hallwayCenterX = entranceX + width / 2 - 6;
  const connectionX = entranceX - hallwayCenterX;
  const { room, roomColliders, passageOpenings, placeAgainstWall } = createRoom({
    width, depth, height,
    wallColor: config.wallColor, floorColor: config.floorColor, ceilingColor: config.ceilingColor,
    wallTexture: "/textures/rooms/whiteWall.jpg", floorTexture: "/textures/rooms/floor2.jpg", ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 20, y: 7 }, floorTextureRepeat: { x: 29, y: 5.5 }, ceilingTextureRepeat: { x: 3, y: 4 }, door: null,
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
  room.position.set(hallwayCenterX, 0, entranceZ + depth / 2);
  const reportAction = (type, targetId, payload) => onHallwayAction?.(type, targetId, payload);
  const doors = createHallwayDoors({ timeline, testMode, passageOpenings, isInteractHeld, onAction: reportAction });
  const lighting = createHallwayLighting({ timeline, connectionX, dimensions: hallwayDimensions });
  const puzzle = createHallwayPuzzle({ timeline, testMode, onFocus: onObjectFocus, onAction: reportAction });
  const decor = createHallwayDecor({ timeline, config });

  room.add(
    doors.livingRoomDoor.object3D, ...doors.hallwayDoors.map((door) => door.object3D), ...doors.finalBolts.map((bolt) => bolt.object3D),
    lighting.ambientLight, ...lighting.lamps.map((lamp) => lamp.object3D), lighting.hallwaySwitch.object3D, lighting.exitSwitch.object3D,
    decor.consoleTable.object3D, decor.carpet.object3D, decor.umbrellaStand, decor.daughterFrame.object3D, decor.sonFrame.object3D,
    puzzle.clock.object3D, puzzle.mirror.object3D,
  );
  if (puzzle.maze) room.add(puzzle.maze.object3D);
  if (timeline === "past") room.add(puzzle.note.object3D);
  placeAgainstWall(lighting.hallwaySwitch, "back"); placeAgainstWall(lighting.exitSwitch, "right");
  placeAgainstWall(decor.consoleTable, "front"); placeAgainstWall(puzzle.clock, "back");
  if (timeline === "past") placeAgainstWall(puzzle.note, "back");
  if (puzzle.maze) { placeAgainstWall(puzzle.maze, "front"); puzzle.maze.object3D.translateZ(-.13); }
  placeAgainstWall(puzzle.mirror, "front"); placeAgainstWall(decor.daughterFrame, "back"); placeAgainstWall(decor.sonFrame, "back");

  const openings = Object.fromEntries(passageOpenings.map((opening) => [opening.id, opening]));
  return {
    room, roomColliders, maze: puzzle.maze, mazeMirror: puzzle.mirror, mazeNote: puzzle.note, livingRoomKey: puzzle.livingRoomKey,
    applyHallwayState: (state) => { puzzle.applyState(state); doors.applyState(state, puzzle.livingRoomKey); },
    interactables: [puzzle.clock, lighting.hallwaySwitch, lighting.exitSwitch, doors.livingRoomDoor, ...doors.hallwayDoors, ...doors.finalBolts, doors.threshold, ...(timeline === "present" ? [puzzle.mirror] : [puzzle.note]), ...(timeline === "present" && puzzle.maze ? [puzzle.maze] : [])],
    entities: [puzzle.clock, lighting.hallwaySwitch, lighting.exitSwitch, doors.livingRoomDoor, ...doors.hallwayDoors, ...doors.finalBolts, doors.threshold, ...lighting.lamps, puzzle.mirror, puzzle.livingRoomKey, ...(puzzle.maze ? [puzzle.maze] : [puzzle.note])],
    mirror: puzzle.mirror, clock: puzzle.clock, hallwaySwitch: lighting.hallwaySwitch, hallwayExitSwitch: lighting.exitSwitch, hallwayLamps: lighting.lamps,
    consoleTable: decor.consoleTable, hallwayCarpet: decor.carpet, livingRoomDoor: doors.livingRoomDoor, hallwayDoors: doors.hallwayDoors, finalThreshold: doors.threshold,
    livingRoomOpening: openings["living-room-hallway-connection"], childrenRoomOpening: openings["hallway-children-room-opening"], bathroomOpening: openings["hallway-bathroom-opening"], kitchenOpening: openings["hallway-kitchen-opening"],
    dimensions: { width, depth },
    bounds: { minX: hallwayCenterX - width / 2, maxX: hallwayCenterX + width / 2, minZ: entranceZ, maxZ: entranceZ + depth },
  };
};
export { createHallway };
