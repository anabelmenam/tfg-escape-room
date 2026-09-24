import * as THREE from "three";
import { createBedroom } from "../rooms/createBedroom.js";
import { createHallway } from "../rooms/createHallway.js";
import { createLivingRoom } from "../rooms/createLivingRoom.js";
import { createIconsRoom } from "../rooms/createIconsRoom.js";

const timelineByPlayerRole = {
  A: "past",
  B: "present",
};

const createLevel1 = async ({ playerRole, onSwitchPress, eventManager, onDoorOpenChange, onDoorUnlocked, onObjectFocus, testArea = null } = {}) => {
  if (playerRole === "A" || playerRole === "B") {
    const timeline = timelineByPlayerRole[playerRole];
    const bedroom = await createBedroom({
      timeline,
      onSwitchPress,
      eventManager,
      onDoorOpenChange,
      onDoorUnlocked,
      onObjectFocus,
    });
    const hallway = createHallway({
      onObjectFocus,
      timeline,
      entranceX: bedroom.doorOpening.position.x,
      entranceZ: bedroom.doorOpening.position.z,
    });
    const livingRoom = await createLivingRoom({
      onSwitchPress,
      eventManager,
      entrance: { id: "hallway-living-room-connection", wall: "back", position: 0, width: 5, height: 8 },
    });
    livingRoom.room.position.set(
      hallway.room.position.x + hallway.livingRoomOpening.position.x,
      0,
      hallway.room.position.z + hallway.dimensions.depth / 2 + 15,
    );
    const level = new THREE.Group();
    level.name = `Level 1-${timeline}`;
    level.add(bedroom.room, hallway.room, livingRoom.room);

    level.updateMatrixWorld(true);
    const wallColliders = [bedroom, hallway, livingRoom].flatMap((area) =>
      area.roomColliders
        .filter((mesh) => mesh.name.includes("-wall-section-"))
        .map((mesh) => ({ box: new THREE.Box3().setFromObject(mesh) })),
    );
    for (const door of [bedroom.door, hallway.livingRoomDoor, livingRoom.door]) {
      wallColliders.push({
        box: new THREE.Box3().setFromObject(door.object3D),
        isActive: () => !door.isOpen,
      });
    }

    return {
      ...bedroom,
      wallColliders,
      roomColliders: [...bedroom.roomColliders, ...hallway.roomColliders, ...livingRoom.roomColliders],
      objectColliders: [
        ...bedroom.objectColliders,
        ...livingRoom.objectColliders.map((box) => box.clone().translate(livingRoom.room.position)),
      ],
      room: level,
      ...(testArea === "hallway" ? {
        spawnPosition: hallway.room.position.clone().add(new THREE.Vector3(20.5, bedroom.spawnPosition.y, 0.8)),
        spawnLookAt: hallway.clock.getLookAtPosition(),
      } : {}),
      exteriorBounds: {
        minX: Math.min(hallway.bounds.minX, livingRoom.room.position.x + livingRoom.bounds.minX),
        maxX: Math.max(hallway.bounds.maxX, livingRoom.room.position.x + livingRoom.bounds.maxX),
        minZ: Math.min(hallway.bounds.minZ, livingRoom.room.position.z + livingRoom.bounds.minZ),
        maxZ: Math.max(hallway.bounds.maxZ, livingRoom.room.position.z + livingRoom.bounds.maxZ),
      },
      interactables: [...bedroom.interactables, hallway.clock, hallway.hallwaySwitch, hallway.livingRoomDoor, ...livingRoom.interactables],
      entities: [...bedroom.entities, hallway.clock, hallway.hallwaySwitch, hallway.livingRoomDoor, ...hallway.hallwayLamps, ...livingRoom.entities],
    };
  }

  if (playerRole === "D") {
    return createLivingRoom({
      onSwitchPress,
      eventManager,
      onDoorOpenChange,
    });
  }

  if (playerRole === "C") {
    return createIconsRoom({
      onSwitchPress,
      eventManager,
      onDoorOpenChange,
    });
  }

  throw new Error(`Rol de jugador no válido: ${playerRole}`);
};

export { createLevel1 };
