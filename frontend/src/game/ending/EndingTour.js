import * as THREE from "three";
import { ENDING_TOUR } from "./endingConfig.js";

const applySolvedHouseState = (game) => {
  const cleanState = structuredClone(game.sharedState);
  const solved = (timeline, id, extra = {}) => {
    cleanState.timelines[timeline].puzzles[id] = {
      ...cleanState.timelines[timeline].puzzles[id],
      solved: true,
      ...extra,
    };
  };
  ["bedroom-radio", "bedroom-sewing-box", "hallway-clock", "bathroom-hot-water", "children-blocks", "children-music-key", "children-globe-pin", "children-globe", "children-wardrobe-chains", "living-room-painting", "living-room-embers", "kitchen-oven"].forEach((id) => solved("past", id));
  ["bedroom-family-photo", "bedroom-electrical-panel", "bedroom-light-reveal-puzzle", "hallway-maze", "living-room-rainbow-books", "children-music", "kitchen-stove", "bathroom-sequence"].forEach((id) => solved("present", id));
  solved("present", "kitchen-recipe", { placements: ["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"] });
  solved("present", "kitchen-family-table", { placements: ["kitchen-napkin-red", "kitchen-napkin-green", "kitchen-napkin-blue", "kitchen-napkin-ochre"] });
  solved("present", "bathroom-mosaic", { tileInserted: true });
  cleanState.timelines.past.objects["living-room-painting-slot"] = { placed: true, restoredPieces: [0, 1] };
  cleanState.timelines.present.objects["living-room-sofa-cushion"] = { cut: true, searched: true };

  game.roomData.hallway?.applyHallwayState(cleanState);
  game.roomData.bedroom?.applyBedroomState(cleanState);
  game.roomData.childrenRoom?.applyChildrenRoomState(cleanState);
  game.roomData.kitchen?.applyKitchenState(cleanState);
  game.roomData.livingRoom?.applyLivingRoomState(cleanState);
  game.roomData.bathroom?.applyBathroomState(cleanState);
};

const resetFurniture = (entities = []) => {
  for (const entity of entities) {
    if (entity.id === "living-room-shelf-1" && entity.mechanismStartPosition) {
      entity.object3D.position.copy(entity.endingHomePosition ?? entity.mechanismStartPosition);
      entity.object3D.rotation.y = entity.endingHomeRotation ?? entity.mechanismStartRotation;
      entity.mechanismStartPosition.copy(entity.object3D.position);
      entity.mechanismStartRotation = entity.object3D.rotation.y;
      entity.mechanismTargetRotation = entity.object3D.rotation.y;
      entity.mechanismProgress = 0;
      entity.isMechanismMoving = false;
      entity.refreshCollider?.();
    }
    entity.drawerManager?.states?.forEach((state, index) => {
      const drawer = entity.drawerManager.drawers[index];
      state.isOpen = false;
      state.targetZ = drawer.userData.closedZ;
      drawer.position.z = drawer.userData.closedZ;
    });
    entity.panelManager?.states?.forEach((state, index) => {
      const panel = entity.panelManager.panels[index];
      state.isOpen = false;
      state.targetRotation = state.closedRotation;
      panel.rotation[state.axis] = state.closedRotation;
    });
    if (Array.isArray(entity.doorStates)) {
      entity.doorStates.forEach((state, index) => {
        if (typeof state === "boolean") {
          entity.doorStates[index] = false;
          if (entity.doors?.[index]) entity.doors[index].rotation.y = 0;
        } else if (state) {
          state.isOpen = false;
          state.targetRotation = 0;
          if (entity.cabinetDoors?.[index]) entity.cabinetDoors[index].rotation.y = 0;
        }
      });
    }
    if (Array.isArray(entity.drawerStates)) {
      entity.drawerStates.fill(false);
      entity.drawers?.forEach((drawer) => {
        drawer.position.z = entity.closedDrawerZ;
      });
    }
    if (entity.doorPivot && "targetDoorRotation" in entity) {
      entity.isOpen = false;
      entity.targetDoorRotation = 0;
      entity.doorPivot.rotation.y = 0;
    }
    if (entity.lidPivot && "lidTargetRotation" in entity) {
      entity.isLidOpen = false;
      entity.lidTargetRotation = 0;
      entity.lidPivot.rotation.x = 0;
    }
    if (entity.id === "children-globe") entity.setOpen?.(false, { immediate: true });
    if (entity.id === "children-music" && entity.lidGroup) entity.lidGroup.rotation.x = 0;
    if (entity.id === "living-room-painting-slot" && entity.hinge) {
      entity.hinge.rotation.y = 0;
      if (entity.timeline === "present") entity.restored = false;
    }
    if (entity.id === "living-room-display-case" && entity.frontLid) {
      entity.opened = false;
      entity.targetLidAngle = 0;
      entity.lidAngle = 0;
      entity.frontLid.rotation.x = 0;
    }
    if (entity.id === "living-room-chest" && entity.lidPivot) {
      entity.isOpen = false;
      entity.targetOpen = false;
      entity.lidPivot.rotation.x = 0;
    }
  }
};

const createTourScenes = (game) => {
  const worldPoint = (parent, localPoint) => parent.localToWorld(localPoint.clone());
  const makeDoorView = (area, openingWorld, { height = 4.7 } = {}) => {
    const { minX, maxX, minZ, maxZ } = area.bounds;
    const target = area.room.localToWorld(new THREE.Vector3((minX + maxX) / 2, 3.05, (minZ + maxZ) / 2));
    const inward = target.clone().sub(openingWorld).setY(0).normalize();
    const start = openingWorld.clone().addScaledVector(inward, 1.8);
    const startLocal = area.room.worldToLocal(start.clone());
    startLocal.x = THREE.MathUtils.clamp(startLocal.x, minX + 1.4, maxX - 1.4);
    startLocal.z = THREE.MathUtils.clamp(startLocal.z, minZ + 1.4, maxZ - 1.4);
    startLocal.y = height;
    area.room.localToWorld(startLocal);
    const guide = game.camera.clone();
    guide.position.copy(startLocal);
    guide.lookAt(target);
    return { start: startLocal, quaternion: guide.quaternion.clone() };
  };
  const makeLocalView = (area, startLocal, targetLocal) => {
    const start = area.room.localToWorld(startLocal.clone());
    const target = area.room.localToWorld(targetLocal.clone());
    const guide = game.camera.clone();
    guide.position.copy(start);
    guide.lookAt(target);
    return { start, quaternion: guide.quaternion.clone() };
  };
  const { bedroom, hallway, livingRoom, childrenRoom, kitchen, bathroom } = game.roomData;
  return [
    makeDoorView(bedroom, worldPoint(bedroom.room, bedroom.doorOpening.position)),
    makeDoorView(livingRoom, worldPoint(hallway.room, hallway.livingRoomOpening.position)),
    makeDoorView(childrenRoom, worldPoint(hallway.room, hallway.childrenRoomOpening.position)),
    makeDoorView(kitchen, worldPoint(hallway.room, hallway.kitchenOpening.position)),
    makeDoorView(bathroom, worldPoint(hallway.room, hallway.bathroomOpening.position), { height: 4.2 }),
    makeLocalView(
      hallway,
      new THREE.Vector3(hallway.dimensions.width / 2 - 2.2, 4.7, 0),
      new THREE.Vector3(hallway.dimensions.width / 2 - 13, 3.1, 0),
    ),
  ];
};

const closeTourDoors = (roomData) => {
  const doors = [
    roomData.bedroom.door,
    roomData.hallway.livingRoomDoor,
    ...roomData.hallway.hallwayDoors,
    roomData.livingRoom.door,
    roomData.livingRoom.kitchenDoor,
  ].filter(Boolean);
  doors.forEach((door) => {
    door.isOpen = false;
    door.targetRotation = door.closedRotation;
    door.object3D.rotation.y = door.closedRotation;
    door.object3D.visible = true;
  });
  return doors;
};

const startEndingHouseTour = (game, { onBeat, onFade, onComplete } = {}) => {
  if (game.endingTour || !game.roomData) return;
  game.paused = false;
  applySolvedHouseState(game);
  resetFurniture(game.roomData.entities);
  if (game.remoteEcho?.object3D) game.remoteEcho.object3D.visible = false;
  game.previewEchoes.forEach((echo) => { echo.object3D.visible = false; });
  const scenes = createTourScenes(game);
  const doors = closeTourDoors(game.roomData);

  game.camera.position.copy(scenes[0].start);
  game.camera.quaternion.copy(scenes[0].quaternion);
  game.endingTour = { scenes, sceneIndex: 0, phase: "hold", elapsed: 0, doors, onBeat, onFade, onComplete };
  onFade?.(false);
  onBeat?.(0);
};

const updateEndingTour = (game, delta) => {
  const tour = game.endingTour;
  if (!tour) return;
  tour.elapsed += delta;
  const scene = tour.scenes[tour.sceneIndex];
  game.camera.position.copy(scene.start);
  game.camera.quaternion.copy(scene.quaternion);
  if (tour.phase === "hold") {
    const duration = tour.sceneIndex === 0 ? ENDING_TOUR.firstSceneDuration : ENDING_TOUR.sceneDuration;
    if (tour.elapsed < duration) return;
    if (tour.sceneIndex + 1 >= tour.scenes.length) {
      tour.phase = "finalFade";
      tour.elapsed = 0;
      tour.onBeat?.(null);
      tour.onFade?.(true);
      return;
    }
    tour.elapsed = 0;
    tour.phase = "fade";
    tour.onBeat?.(null);
    tour.onFade?.(true);
    return;
  }
  if (tour.phase === "finalFade") {
    if (tour.elapsed < ENDING_TOUR.finalFadeDuration) return;
    game.endingTour = null;
    tour.onComplete?.();
    return;
  }
  if (tour.phase === "reveal") {
    if (tour.elapsed < ENDING_TOUR.revealDuration) return;
    tour.phase = "hold";
    tour.elapsed = 0;
    tour.onBeat?.(tour.sceneIndex);
    return;
  }
  if (tour.elapsed < ENDING_TOUR.transitionFadeDuration) return;
  tour.sceneIndex += 1;
  const nextScene = tour.scenes[tour.sceneIndex];
  game.camera.position.copy(nextScene.start);
  game.camera.quaternion.copy(nextScene.quaternion);
  tour.phase = "reveal";
  tour.elapsed = 0;
  tour.onFade?.(false);
};

export { startEndingHouseTour, updateEndingTour };
