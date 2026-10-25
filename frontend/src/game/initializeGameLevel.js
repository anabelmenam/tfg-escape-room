import * as THREE from "three";
import { createLevel1 } from "../world/levels/createLevel1.js";

const createEndingPreviewState = () => {
  const bolts = {
    "final-bolt-bedroom": { unlocked: true }, "final-bolt-living-room": { unlocked: true },
    "final-bolt-children": { unlocked: true }, "final-bolt-bathroom": { unlocked: true },
    "hallway-street-door": { locked: true, open: false },
  };
  return {
    timelines: { past: { objects: structuredClone(bolts), puzzles: {} }, present: { objects: structuredClone(bolts), puzzles: {} } },
    inventories: { past: [], present: [] },
    ending: { phase: "threshold", holding: { past: false, present: false }, choice: null, sacrificeTimeline: null },
  };
};

const positionEndingPreview = (game, roomData) => {
  const streetDoor = roomData.hallway?.hallwayDoors?.find((door) => door.id === "hallway-street-door");
  if (!streetDoor) return;
  const parentQuaternion = new THREE.Quaternion();
  streetDoor.object3D.parent.getWorldQuaternion(parentQuaternion);
  const closedQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), streetDoor.closedRotation);
  const doorwayCenter = streetDoor.object3D.position.clone().add(new THREE.Vector3(2.5, 0, 0).applyQuaternion(closedQuaternion));
  streetDoor.object3D.parent.localToWorld(doorwayCenter);
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(parentQuaternion.clone().multiply(closedQuaternion)).setY(0).normalize();
  const hallwayCenter = new THREE.Vector3(); roomData.hallway.room.getWorldPosition(hallwayCenter);
  if (hallwayCenter.clone().sub(doorwayCenter).dot(normal) < 0) normal.negate();
  roomData.spawnPosition = doorwayCenter.clone().addScaledVector(normal, 4.2); roomData.spawnPosition.y = 5.2;
  roomData.spawnLookAt = doorwayCenter.clone(); roomData.spawnLookAt.y = 3.1;
};

export const initializeGameLevel = async (game) => {
  const withAudio = (handler) => (type, ...args) => { game.gameAudio.playAction(type); handler?.(type, ...args); };
  const roomData = await createLevel1({
    playerRole: game.playerRole, testArea: game.testArea, testMode: game.testMode,
    onSwitchPress: (lightSwitch) => {
      const active = game.gameState.toggle(lightSwitch.id); lightSwitch.setActive(active);
      game.eventManager.emit("buttonPressed", { id: lightSwitch.id, active });
    },
    eventManager: game.eventManager,
    onDoorOpenChange: (isOpen) => game.collisionManager.setDoorOpen(isOpen),
    onDoorUnlocked: () => { if (game.timeline === "past") game.onDoorUnlocked?.(); },
    onHallwayAction: withAudio(game.onHallwayAction), onBedroomAction: withAudio(game.onBedroomAction),
    onChildrenRoomAction: withAudio(game.onChildrenRoomAction), onKitchenAction: withAudio(game.onKitchenAction),
    onLivingRoomAction: withAudio(game.onLivingRoomAction), onBathroomAction: withAudio(game.onBathroomAction),
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
  game.timeline = roomData.timeline ?? null;
  game.scene.userData.timeline = game.timeline;
  if (game.endingPreview) game.sharedState = createEndingPreviewState();
  game.multiplayer.initialize();
  for (const entity of roomData.entities ?? []) { entity.setAudioListener?.(game.gameAudio); game.entityManager.add(entity); }
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
    game.collisionManager.isOutsideRoom = checkpoint.roomKey ? checkpoint.roomKey !== "bedroom" : game.collisionManager.isOutsideRoom;
    game.ready = false;
  }
};
