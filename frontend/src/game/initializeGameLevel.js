import * as THREE from "three";
import { createGameWorld } from "../world/createGameWorld.js";

const createEndingPreviewState = () => {
  const bolts = {
    "final-bolt-bedroom": { unlocked: true },
    "final-bolt-living-room": { unlocked: true },
    "final-bolt-children": { unlocked: true },
    "final-bolt-bathroom": { unlocked: true },
    "hallway-street-door": { locked: true, open: false },
  };
  return {
    characters: {
      mum: { objects: structuredClone(bolts), puzzles: {} },
      dad: { objects: structuredClone(bolts), puzzles: {} },
    },
    inventories: { mum: [], dad: [] },
    ending: { phase: "threshold", holding: { mum: false, dad: false }, choice: null, sacrificeCharacter: null },
  };
};

const positionEndingPreview = (game, roomData) => {
  const streetDoor = roomData.hallway?.hallwayDoors?.find((door) => door.id === "hallway-street-door");
  if (!streetDoor) return;
  const parentQuaternion = new THREE.Quaternion();
  streetDoor.object3D.parent.getWorldQuaternion(parentQuaternion);
  const closedQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    streetDoor.closedRotation,
  );
  const doorwayCenter = streetDoor.object3D.position
    .clone()
    .add(new THREE.Vector3(2.5, 0, 0).applyQuaternion(closedQuaternion));
  streetDoor.object3D.parent.localToWorld(doorwayCenter);
  const normal = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(parentQuaternion.clone().multiply(closedQuaternion))
    .setY(0)
    .normalize();
  const hallwayCenter = new THREE.Vector3();
  roomData.hallway.room.getWorldPosition(hallwayCenter);
  if (hallwayCenter.clone().sub(doorwayCenter).dot(normal) < 0) normal.negate();
  roomData.spawnPosition = doorwayCenter.clone().addScaledVector(normal, 4.2);
  roomData.spawnPosition.y = 5.2;
  roomData.spawnLookAt = doorwayCenter.clone();
  roomData.spawnLookAt.y = 3.1;
};

export const initializeGameLevel = async (game) => {
  const completionObjects = new Set([
    "bedroom-lock",
    "bedroom-symbol-safe",
    "living-room-fireplace",
    "living-room-chest",
  ]);
  const withAudio =
    (handler) =>
    (type, targetId, ...args) => {
      const completedInteraction =
        type === "object.interact" && (completionObjects.has(targetId) || args[0]?.completed);
      game.gameAudio.playAction(completedInteraction ? "puzzle.solved" : type);
      handler?.(type, targetId, ...args);
    };
  const roomData = await createGameWorld({
    playerRole: game.playerRole,
    testArea: game.testArea,
    testMode: game.testMode,
    onSwitchPress: (lightSwitch) => {
      const active = lightSwitch.active;
      game.gameState.set(lightSwitch.id, active);
      game.eventManager.emit("buttonPressed", { id: lightSwitch.id, active });
    },
    eventManager: game.eventManager,
    onDoorOpenChange: (isOpen) => game.collisionManager.setDoorOpen(isOpen),
    onDoorUnlocked: () => {
      if (game.character === "mum") game.onDoorUnlocked?.();
    },
    onHallwayAction: withAudio(game.onHallwayAction),
    onBedroomAction: withAudio(game.onBedroomAction),
    onChildrenRoomAction: withAudio(game.onChildrenRoomAction),
    onKitchenAction: withAudio(game.onKitchenAction),
    onLivingRoomAction: withAudio(game.onLivingRoomAction),
    onBathroomAction: withAudio(game.onBathroomAction),
    onObjectFocus: (object) => game.player.focusObject(object),
    onStoryNoteCollected: (noteId) => {
      if (!game.testMode || game.localJournalEntries.includes(noteId)) return;
      game.localJournalEntries.push(noteId);
      game.onDiaryEntriesChanged?.([...game.localJournalEntries].sort());
    },
    isFlashlightOn: () => game.flashlightOn,
    isInteractHeld: () => game.input.isPressed("KeyE"),
  });
  game.roomData = roomData;
  if (game.testArea && roomData.hallway?.maze) roomData.hallway.maze.available = true;
  game.character = roomData.character ?? null;
  game.scene.userData.character = game.character;
  if (game.endingPreview) game.sharedState = createEndingPreviewState();
  game.multiplayer.initialize();
  for (const entity of roomData.entities ?? []) {
    entity.setAudioListener?.(game.gameAudio);
    if (typeof entity.press === "function" && typeof entity.setActive === "function") {
      const originalOnPress = entity.onPress;
      entity.onPress = (switchObject) => {
        originalOnPress?.(switchObject);
        if (!game.applyingSharedState)
          game.onHallwayAction?.("object.interact", entity.id, {
            operation: "set-active",
            active: switchObject.active,
          });
      };
    }
    if (typeof entity.open === "function" && typeof entity.close === "function" && "isOpen" in entity) {
      const originalOnOpenChange = entity.onOpenChange;
      entity.onOpenChange = (open) => {
        originalOnOpenChange?.(open);
        if (!game.applyingSharedState)
          game.onHallwayAction?.("object.interact", entity.id, { operation: "set-open", open });
      };
    }
    game.entityManager.add(entity);
  }
  game.collisionManager.setObjectColliders(roomData.objectColliders ?? []);
  game.collisionManager.setWallColliders(roomData.wallColliders ?? []);
  game.scene.add(roomData.room);
  roomData.room.updateMatrixWorld(true);
  game.roomRegions = ["bedroom", "hallway", "livingRoom", "childrenRoom", "bathroom", "kitchen"]
    .map((key) => ({ key, box: roomData[key]?.room ? new THREE.Box3().setFromObject(roomData[key].room) : null }))
    .filter(({ box }) => box);
  game.interactionManager.setOccluders(roomData.roomColliders ?? []);
  if (game.endingPreview) positionEndingPreview(game, roomData);
  game.camera.position.copy(roomData.spawnPosition);
  game.collisionManager.previousPosition = game.camera.position.clone();
  if (roomData.spawnLookAt) game.player.setLookAt(roomData.spawnLookAt);
  game.multiplayer.placePreviewEchoes();
  game.collisionManager.setRoomBounds(roomData.bounds);
  game.collisionManager.setDoorPassage(roomData.doorPassage);
  game.collisionManager.setExteriorBounds(roomData.exteriorBounds);
  if (game.testArea && game.testArea !== "bedroom" && game.testArea !== "icons") {
    game.collisionManager.isOutsideRoom = true;
    game.collisionManager.previousPosition = game.camera.position.clone();
  }
  for (const interactable of roomData.interactables ?? []) game.interactableManager.add(interactable);
  game.applySharedState(game.sharedState);
  if (game.pendingCheckpoint && !game.testMode && !game.endingPreview) {
    const checkpoint = game.pendingCheckpoint;
    game.ready = true;
    game.applyCheckpoint(checkpoint);
    game.collisionManager.isOutsideRoom = checkpoint.roomKey
      ? checkpoint.roomKey !== "bedroom"
      : game.collisionManager.isOutsideRoom;
    game.ready = false;
  }
};
