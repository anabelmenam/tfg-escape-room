import * as THREE from "three";
import { createBedroom } from "./rooms/createBedroom.js";
import { createHallway } from "./rooms/createHallway.js";
import { createLivingRoom } from "./rooms/createLivingRoom.js";
import { createIconsRoom } from "./rooms/createIconsRoom.js";
import { createChildrenRoom } from "./rooms/createChildrenRoom.js";
import { createBathroom } from "./rooms/createBathroom.js";
import { createKitchen } from "./rooms/createKitchen.js";
import { createToyBasket } from "./objects/index.js";
import { t, tInteraction, tItem } from "../translations/index.js";
import { createFamilyStoryNotes } from "./levels/createFamilyStoryNotes.js";

const characterByPlayerRole = {
  A: "mum",
  B: "dad",
};

const createGameWorld = async ({
  playerRole,
  onSwitchPress,
  eventManager,
  onDoorOpenChange,
  onDoorUnlocked,
  onObjectFocus,
  isFlashlightOn = null,
  isInteractHeld = null,
  testArea = null,
  onHallwayAction = null,
  onBedroomAction = null,
  onChildrenRoomAction = null,
  onKitchenAction = null,
  onLivingRoomAction = null,
  onBathroomAction = null,
  onStoryNoteCollected = null,
  testMode = false,
} = {}) => {
  if (playerRole === "A" || playerRole === "B") {
    const character = characterByPlayerRole[playerRole];
    const bedroom = await createBedroom({
      character,
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
      character,
      testMode,
      isInteractHeld,
      entranceX: bedroom.doorOpening.position.x,
      entranceZ: bedroom.doorOpening.position.z,
    });
    const livingRoomEntrancePosition = -3;
    const livingRoom = await createLivingRoom({
      character,
      onSwitchPress,
      eventManager,
      onObjectFocus,
      onLivingRoomAction,
      testMode,
      entrance: {
        id: "hallway-living-room-connection",
        wall: "back",
        position: livingRoomEntrancePosition,
        width: 5,
        height: 8,
      },
      kitchenEntrance: { id: "living-room-kitchen-connection", wall: "right", position: 7, width: 5, height: 8 },
    });
    const childrenRoom = createChildrenRoom({
      character,
      onObjectFocus,
      onChildrenRoomAction,
      isFlashlightOn,
      testMode,
    });
    const bathroom = createBathroom({ character, onObjectFocus, onBathroomAction, testMode });
    const kitchen = createKitchen({ character, onObjectFocus, onKitchenAction, testMode });
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
    const storyNotes = createFamilyStoryNotes({
      character,
      rooms: { bedroom, hallway, livingRoom, childrenRoom, bathroom, kitchen },
      actions: {
        bedroom: onBedroomAction,
        hallway: onHallwayAction,
        livingRoom: onLivingRoomAction,
        childrenRoom: onChildrenRoomAction,
        bathroom: onBathroomAction,
        kitchen: onKitchenAction,
      },
      onNoteCollected: onStoryNoteCollected,
    });
    const gameWorld = new THREE.Group();
    gameWorld.name = `GameWorld-${character}`;
    gameWorld.add(bedroom.room, hallway.room, livingRoom.room, childrenRoom.room, bathroom.room, kitchen.room);
    const toyBasket = createToyBasket({ aged: false, scale: 0.92 });
    toyBasket.position.set(9.2, 0.02, -2.2);
    childrenRoom.room.add(toyBasket);

    const ambientInteractables = [];
    gameWorld.traverse((object) => {
      const descriptionKey = object.userData?.ambientDescriptionKey;
      if (!descriptionKey) return;
      ambientInteractables.push({
        id: `ambient-${descriptionKey}-${ambientInteractables.length}`,
        object3D: object,
        enabled: true,
        interact: () => {
          const panel = document.getElementById("ambient-inspection");
          if (!panel) return;
          panel.textContent = t(`ambient.${descriptionKey}`);
          panel.classList.remove("hidden");
          window.clearTimeout(panel.userDataTimeout);
          panel.userDataTimeout = window.setTimeout(() => panel.classList.add("hidden"), 5200);
        },
        getInteractionText: () => tInteraction("examine", tItem(descriptionKey)),
      });
    });

    gameWorld.updateMatrixWorld(true);
    const wallColliders = [bedroom, hallway, livingRoom, childrenRoom, bathroom, kitchen].flatMap((area) =>
      area.roomColliders
        .filter((mesh) => mesh.name.includes("-wall-section-"))
        .map((mesh) => ({ box: new THREE.Box3().setFromObject(mesh) })),
    );
    for (const door of [
      bedroom.door,
      hallway.livingRoomDoor,
      ...hallway.hallwayDoors,
      livingRoom.door,
      livingRoom.kitchenDoor,
    ].filter(Boolean)) {
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
      storyNotes,
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
      room: gameWorld,
      ...(testArea === "hallway"
        ? {
            spawnPosition: hallway.room.position.clone().add(new THREE.Vector3(16, 5.2, 0)),
            spawnLookAt: hallway.room.position.clone().add(hallway.mirror.object3D.position),
          }
        : {}),
      ...(testArea === "children"
        ? {
            spawnPosition: childrenRoom.room.position.clone().add(new THREE.Vector3(0, 5.5, 7.2)),
            spawnLookAt: childrenRoom.room.position.clone().add(new THREE.Vector3(0, 4.2, -5.5)),
          }
        : {}),
      ...(testArea === "bathroom"
        ? {
            spawnPosition: bathroom.room.position.clone().add(new THREE.Vector3(0, 3.7, 1)),
            spawnLookAt: bathroom.room.position.clone().add(new THREE.Vector3(2.55, 2.08, -3.22)),
          }
        : {}),
      ...(testArea === "kitchen"
        ? {
            spawnPosition: kitchen.room.position.clone().add(new THREE.Vector3(2.6, 4.6, -2.1)),
            spawnLookAt: kitchen.room.position.clone().add(new THREE.Vector3(7.75, 2.4, -2.1)),
          }
        : {}),
      exteriorBounds: {
        minX: Math.min(
          bedroom.bounds.minX,
          hallway.bounds.minX,
          livingRoom.room.position.x + livingRoom.bounds.minX,
          childrenRoom.room.position.x + childrenRoom.bounds.minX,
          bathroom.room.position.x + bathroom.bounds.minX,
          kitchen.room.position.x + kitchen.bounds.minX,
        ),
        maxX: Math.max(
          bedroom.bounds.maxX,
          hallway.bounds.maxX,
          livingRoom.room.position.x + livingRoom.bounds.maxX,
          childrenRoom.room.position.x + childrenRoom.bounds.maxX,
          bathroom.room.position.x + bathroom.bounds.maxX,
          kitchen.room.position.x + kitchen.bounds.maxX,
        ),
        minZ: Math.min(
          bedroom.bounds.minZ,
          hallway.bounds.minZ,
          livingRoom.room.position.z + livingRoom.bounds.minZ,
          childrenRoom.room.position.z + childrenRoom.bounds.minZ,
          bathroom.room.position.z + bathroom.bounds.minZ,
          kitchen.room.position.z + kitchen.bounds.minZ,
        ),
        maxZ: Math.max(
          bedroom.bounds.maxZ,
          hallway.bounds.maxZ,
          livingRoom.room.position.z + livingRoom.bounds.maxZ,
          childrenRoom.room.position.z + childrenRoom.bounds.maxZ,
          bathroom.room.position.z + bathroom.bounds.maxZ,
          kitchen.room.position.z + kitchen.bounds.maxZ,
        ),
      },
      interactables: [
        ...bedroom.interactables,
        ...hallway.interactables,
        ...livingRoom.interactables,
        ...childrenRoom.interactables,
        ...bathroom.interactables,
        ...kitchen.interactables,
        ...storyNotes,
        ...ambientInteractables,
      ],
      entities: [
        ...bedroom.entities,
        ...hallway.entities,
        ...livingRoom.entities,
        ...childrenRoom.entities,
        ...bathroom.entities,
        ...kitchen.entities,
        ...storyNotes,
      ],
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

export { createGameWorld };
