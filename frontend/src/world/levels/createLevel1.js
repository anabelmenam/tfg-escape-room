import * as THREE from "three";
import { createBedroom } from "../rooms/createBedroom.js";
import { createHallway } from "../rooms/createHallway.js";
import { createLivingRoom } from "../rooms/createLivingRoom.js";
import { createIconsRoom } from "../rooms/createIconsRoom.js";
import { createChildrenRoom } from "../rooms/createChildrenRoom.js";
import { createBathroom } from "../rooms/createBathroom.js";
import { createKitchen } from "../rooms/createKitchen.js";

const timelineByPlayerRole = {
  A: "past",
  B: "present",
};

const createLevel1 = async ({ playerRole, onSwitchPress, eventManager, onDoorOpenChange, onDoorUnlocked, onObjectFocus, testArea = null, onHallwayAction = null, onBedroomAction = null, onLivingRoomAction = null, onBathroomAction = null, testMode = false } = {}) => {
  if (playerRole === "A" || playerRole === "B") {
    const timeline = timelineByPlayerRole[playerRole];
    const bedroom = await createBedroom({
      timeline,
      onSwitchPress,
      eventManager,
      onDoorOpenChange,
      onDoorUnlocked,
      onObjectFocus,
      onBedroomAction,
      testMode,
    });
    const hallway = createHallway({
      onHallwayAction,
      onObjectFocus,
      timeline,
      entranceX: bedroom.doorOpening.position.x,
      entranceZ: bedroom.doorOpening.position.z,
    });
    const livingRoomEntrancePosition = -3;
    const livingRoom = await createLivingRoom({
      timeline,
      onSwitchPress,
      eventManager,
      onObjectFocus,
      onLivingRoomAction,
      testMode,
      entrance: { id: "hallway-living-room-connection", wall: "back", position: livingRoomEntrancePosition, width: 5, height: 8 },
      kitchenEntrance: { id: "living-room-kitchen-connection", wall: "right", position: 7, width: 5, height: 8 },
    });
    const childrenRoom = createChildrenRoom({ timeline, testMode });
    const bathroom = createBathroom({ timeline, onObjectFocus, onBathroomAction, testMode });
    const kitchen = createKitchen({ timeline, testMode });
    childrenRoom.room.position.set(
      hallway.room.position.x + hallway.childrenRoomOpening.position.x,
      0,
      hallway.room.position.z + hallway.childrenRoomOpening.position.z - childrenRoom.dimensions.depth / 2,
    );
    bathroom.room.position.set(
      hallway.room.position.x + hallway.bathroomOpening.position.x - bathroom.dimensions.width / 2,
      0,
      hallway.room.position.z + hallway.bathroomOpening.position.z,
    );
    kitchen.room.position.set(
      hallway.room.position.x + hallway.kitchenOpening.position.x,
      0,
      hallway.room.position.z + hallway.dimensions.depth / 2 + kitchen.dimensions.depth / 2,
    );
    livingRoom.room.position.set(
      hallway.room.position.x + hallway.livingRoomOpening.position.x - livingRoomEntrancePosition,
      0,
      hallway.room.position.z + hallway.dimensions.depth / 2 + 15,
    );
    const level = new THREE.Group();
    level.name = `Level 1-${timeline}`;
    level.add(bedroom.room, hallway.room, livingRoom.room, childrenRoom.room, bathroom.room, kitchen.room);

    level.updateMatrixWorld(true);
    const wallColliders = [bedroom, hallway, livingRoom, childrenRoom, bathroom, kitchen].flatMap((area) =>
      area.roomColliders
        .filter((mesh) => mesh.name.includes("-wall-section-"))
        .map((mesh) => ({ box: new THREE.Box3().setFromObject(mesh) })),
    );
    for (const door of [bedroom.door, hallway.livingRoomDoor, ...hallway.hallwayDoors, livingRoom.door, livingRoom.kitchenDoor].filter(Boolean)) {
      wallColliders.push({
        getBox: () => door.getCollider(),
      });
    }

    return {
      ...bedroom,
      bedroom,
      hallway,
      livingRoom,
      childrenRoom,
      bathroom,
      kitchen,
      wallColliders,
      roomColliders: [
        ...bedroom.roomColliders,
        ...hallway.roomColliders,
        ...livingRoom.roomColliders,
        ...childrenRoom.roomColliders,
        ...bathroom.roomColliders,
        ...kitchen.roomColliders,
      ],
      objectColliders: [
        ...bedroom.objectColliders,
        ...livingRoom.objectColliders.map((box) => box.clone().translate(livingRoom.room.position)),
        ...childrenRoom.objectColliders.map((box) => box.clone().translate(childrenRoom.room.position)),
        ...bathroom.objectColliders.map((box) => box.clone().translate(bathroom.room.position)),
        ...kitchen.objectColliders.map((box) => box.clone().translate(kitchen.room.position)),
      ],
      room: level,
      ...(testArea === "hallway" ? {
        spawnPosition: hallway.room.position.clone().add(new THREE.Vector3(16, 5.2, 0)),
        spawnLookAt: hallway.room.position.clone().add(hallway.mirror.object3D.position),
      } : {}),
      ...(testArea === "children" ? {
        spawnPosition: childrenRoom.room.position.clone().add(new THREE.Vector3(0, 5.5, 7.2)),
        spawnLookAt: childrenRoom.room.position.clone().add(new THREE.Vector3(0, 4.2, -5.5)),
      } : {}),
      ...(testArea === "bathroom" ? {
        spawnPosition: bathroom.room.position.clone().add(new THREE.Vector3(0, 3.7, 1)),
        spawnLookAt: bathroom.room.position.clone().add(new THREE.Vector3(2.55, 2.08, -3.22)),
      } : {}),
      ...(testArea === "kitchen" ? {
        spawnPosition: kitchen.room.position.clone().add(new THREE.Vector3(2.6, 4.6, -2.1)),
        spawnLookAt: kitchen.room.position.clone().add(new THREE.Vector3(7.75, 2.4, -2.1)),
      } : {}),
      exteriorBounds: {
        minX: Math.min(bedroom.bounds.minX, hallway.bounds.minX, livingRoom.room.position.x + livingRoom.bounds.minX, childrenRoom.room.position.x + childrenRoom.bounds.minX, bathroom.room.position.x + bathroom.bounds.minX, kitchen.room.position.x + kitchen.bounds.minX),
        maxX: Math.max(bedroom.bounds.maxX, hallway.bounds.maxX, livingRoom.room.position.x + livingRoom.bounds.maxX, childrenRoom.room.position.x + childrenRoom.bounds.maxX, bathroom.room.position.x + bathroom.bounds.maxX, kitchen.room.position.x + kitchen.bounds.maxX),
        minZ: Math.min(bedroom.bounds.minZ, hallway.bounds.minZ, livingRoom.room.position.z + livingRoom.bounds.minZ, childrenRoom.room.position.z + childrenRoom.bounds.minZ, bathroom.room.position.z + bathroom.bounds.minZ, kitchen.room.position.z + kitchen.bounds.minZ),
        maxZ: Math.max(bedroom.bounds.maxZ, hallway.bounds.maxZ, livingRoom.room.position.z + livingRoom.bounds.maxZ, childrenRoom.room.position.z + childrenRoom.bounds.maxZ, bathroom.room.position.z + bathroom.bounds.maxZ, kitchen.room.position.z + kitchen.bounds.maxZ),
      },
      interactables: [...bedroom.interactables, ...hallway.interactables, ...livingRoom.interactables, ...childrenRoom.interactables, ...bathroom.interactables, ...kitchen.interactables],
      entities: [...bedroom.entities, ...hallway.entities, ...livingRoom.entities, ...childrenRoom.entities, ...bathroom.entities, ...kitchen.entities],
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
