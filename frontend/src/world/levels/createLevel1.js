import * as THREE from "three";
import { createBedroom } from "../rooms/createBedroom.js";
import { createHallway } from "../rooms/createHallway.js";
import { createLivingRoom } from "../rooms/createLivingRoom.js";
import { createIconsRoom } from "../rooms/createIconsRoom.js";
import { createChildrenRoom } from "../rooms/createChildrenRoom.js";
import { createBathroom } from "../rooms/createBathroom.js";
import { createKitchen } from "../rooms/createKitchen.js";
import { t, tInteraction, tItem } from "../../translations/index.js";

const timelineByPlayerRole = {
  A: "past",
  B: "present",
};

const createAmbientProp = ({ kind, color = 0x6b4634 } = {}) => {
  const group = new THREE.Group();
  group.name = `ambient-${kind}`;
  group.userData.ambientDescriptionKey = kind;
  const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xcbb991, roughness: .96 });
  const coverMaterial = new THREE.MeshStandardMaterial({ color, roughness: .84 });
  if (kind === "scatteredLetters") {
    for (let index = 0; index < 3; index += 1) {
      const book = new THREE.Mesh(new THREE.BoxGeometry(1.15 - index * .08, .13, .76), coverMaterial);
      book.position.set(index * .12, .08 + index * .14, index * .05);
      book.rotation.y = (index - 1) * .12;
      group.add(book);
    }
    for (let index = 0; index < 4; index += 1) {
      const letter = new THREE.Mesh(new THREE.PlaneGeometry(.72, .5), paperMaterial);
      letter.rotation.x = -Math.PI / 2;
      letter.rotation.z = -.4 + index * .27;
      letter.position.set(.75 + index * .22, .018 + index * .004, -.32 + (index % 2) * .32);
      group.add(letter);
    }
  } else if (kind === "teaSet") {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .08, 28), coverMaterial);
    tray.position.y = .05;
    group.add(tray);
    [-.38, .35].forEach((x) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(.22, .18, .38, 18), paperMaterial);
      cup.position.set(x, .28, 0);
      group.add(cup);
    });
    const pot = new THREE.Mesh(new THREE.SphereGeometry(.36, 20, 14), paperMaterial);
    pot.position.set(0, .4, .42);
    group.add(pot);
  } else if (kind === "forgottenToys") {
    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.45, .55, 1), coverMaterial);
    basket.position.y = .28;
    group.add(basket);
    [0xd36b5d, 0x557da0, 0xd2aa43, 0x6d9567].forEach((toyColor, index) => {
      const toy = new THREE.Mesh(new THREE.SphereGeometry(.23, 14, 10), new THREE.MeshStandardMaterial({ color: toyColor, roughness: .8 }));
      toy.position.set(-.48 + index * .31, .68 + (index % 2) * .12, -.12 + (index % 2) * .28);
      group.add(toy);
    });
  } else if (kind === "spiceJars") {
    [0x9b513c, 0xb78a3f, 0x657747, 0x7e5944].forEach((spiceColor, index) => {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(.22, .24, .62, 16), new THREE.MeshStandardMaterial({ color: spiceColor, roughness: .54 }));
      jar.position.set(-.55 + index * .38, .32, 0);
      group.add(jar);
    });
  }
  group.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  return group;
};

const createLevel1 = async ({ playerRole, onSwitchPress, eventManager, onDoorOpenChange, onDoorUnlocked, onObjectFocus, isFlashlightOn = null, isInteractHeld = null, testArea = null, onHallwayAction = null, onBedroomAction = null, onChildrenRoomAction = null, onKitchenAction = null, onLivingRoomAction = null, onBathroomAction = null, testMode = false } = {}) => {
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
      testMode,
      isInteractHeld,
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
    const childrenRoom = createChildrenRoom({ timeline, onObjectFocus, onChildrenRoomAction, isFlashlightOn, testMode });
    const bathroom = createBathroom({ timeline, onObjectFocus, onBathroomAction, testMode });
    const kitchen = createKitchen({ timeline, onObjectFocus, onKitchenAction, testMode });
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
    const atmosphericClutter = [
      [livingRoom.table1.object3D, new THREE.Vector3(0, 2.02, 0), "teaSet", 0x8a714d],
      [childrenRoom.room, new THREE.Vector3(6.1, .02, 7.1), "forgottenToys", 0x4e6881],
    ];
    atmosphericClutter.forEach(([parent, position, kind, color]) => {
      const clutter = createAmbientProp({ kind, color });
      clutter.position.copy(position);
      parent.add(clutter);
    });

    const ambientInteractables = [];
    level.traverse((object) => {
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
      interactables: [...bedroom.interactables, ...hallway.interactables, ...livingRoom.interactables, ...childrenRoom.interactables, ...bathroom.interactables, ...kitchen.interactables, ...ambientInteractables],
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
