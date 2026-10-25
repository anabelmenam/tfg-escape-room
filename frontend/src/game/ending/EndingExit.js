import * as THREE from "three";
import { ENDING_EXIT } from "./endingConfig.js";

const hidePlayers = (game) => {
  if (game.remoteEcho?.object3D) game.remoteEcho.object3D.visible = false;
  game.previewEchoes.forEach((echo) => {
    echo.object3D.visible = false;
  });
};

const getExitPath = (game, streetDoor) => {
  const doorParent = streetDoor.object3D.parent;
  const parentQuaternion = new THREE.Quaternion();
  doorParent.getWorldQuaternion(parentQuaternion);
  const closedDoorQuaternion = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 1, 0), streetDoor.closedRotation);
  const doorwayQuaternion = parentQuaternion.clone().multiply(closedDoorQuaternion);
  const doorwayCenter = streetDoor.object3D.position.clone().add(
    new THREE.Vector3(2.5, 0, 0).applyQuaternion(closedDoorQuaternion),
  );
  doorParent.localToWorld(doorwayCenter);

  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(doorwayQuaternion).setY(0).normalize();
  const cameraSide = Math.sign(game.camera.position.clone().sub(doorwayCenter).dot(normal)) || 1;
  const exitDirection = normal.multiplyScalar(-cameraSide);
  const start = game.camera.position.clone();
  const pointAt = (distance) => doorwayCenter.clone().addScaledVector(exitDirection, distance).setY(start.y);
  const approach = pointAt(ENDING_EXIT.approachDistance);
  const threshold = pointAt(ENDING_EXIT.thresholdDistance);
  const end = pointAt(ENDING_EXIT.endDistance);
  const orientationGuide = game.camera.clone();
  orientationGuide.position.copy(start);
  orientationGuide.lookAt(end.clone().addScaledVector(exitDirection, 5).setY(start.y - .35));

  return {
    start,
    approach,
    threshold,
    end,
    startQuaternion: game.camera.quaternion.clone(),
    endQuaternion: orientationGuide.quaternion.clone(),
  };
};

const startEndingExit = (game, onComplete, onMoveStart = null) => {
  const streetDoor = game.roomData?.hallway?.hallwayDoors?.find((door) => door.id === "hallway-street-door");
  if (!streetDoor || game.endingCinematic) return;
  game.player.fpControls.enabled = false;
  hidePlayers(game);

  game.endingCinematic = {
    elapsed: 0,
    delay: ENDING_EXIT.delay,
    duration: ENDING_EXIT.duration,
    ...getExitPath(game, streetDoor),
    movementStarted: false,
    onMoveStart,
    onComplete,
  };
};

const updateEndingExit = (game, delta) => {
  const cinematic = game.endingCinematic;
  if (!cinematic) return;
  cinematic.elapsed += delta;
  if (!cinematic.movementStarted && cinematic.elapsed >= cinematic.delay) {
    cinematic.movementStarted = true;
    cinematic.onMoveStart?.();
  }

  const rawProgress = THREE.MathUtils.clamp((cinematic.elapsed - cinematic.delay) / cinematic.duration, 0, 1);
  const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
  if (progress < .44) {
    const approachProgress = THREE.MathUtils.smoothstep(progress / .44, 0, 1);
    game.camera.position.lerpVectors(cinematic.start, cinematic.approach, approachProgress);
  } else if (progress < .66) {
    const crossingProgress = THREE.MathUtils.smoothstep((progress - .44) / .22, 0, 1);
    game.camera.position.lerpVectors(cinematic.approach, cinematic.threshold, crossingProgress);
  } else {
    const exitProgress = THREE.MathUtils.smoothstep((progress - .66) / .34, 0, 1);
    game.camera.position.lerpVectors(cinematic.threshold, cinematic.end, exitProgress);
  }

  const rotationProgress = THREE.MathUtils.smoothstep(Math.min(progress / .5, 1), 0, 1);
  game.camera.quaternion.slerpQuaternions(cinematic.startQuaternion, cinematic.endQuaternion, rotationProgress);
  game.collisionManager.previousPosition.copy(game.camera.position);

  if (rawProgress < 1) return;
  game.endingCinematic = null;
  cinematic.onComplete?.();
};

export { startEndingExit, updateEndingExit };
