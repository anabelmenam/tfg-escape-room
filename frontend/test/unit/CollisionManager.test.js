import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { CollisionManager } from "../../src/game/managers/CollisionManager.js";

const cameraAt = (x, y, z) => ({ position: new THREE.Vector3(x, y, z) });
const configuredManager = () => {
  const manager = new CollisionManager({ playerRadius: 0.5 });
  manager.setRoomBounds({ minX: -5, maxX: 5, minZ: -5, maxZ: 5, floorY: 1, ceilingY: 6 });
  manager.setDoorPassage({ minX: -1, maxX: 1 });
  manager.setExteriorBounds({ minX: -3, maxX: 3, minZ: 4, maxZ: 10 });
  return manager;
};

test("las colisiones limitan suelo, techo y paredes de la habitación", () => {
  const manager = configuredManager();
  const camera = cameraAt(8, 0, -8);
  const result = manager.resolvePlayerCollision(camera);
  assert.equal(result.isGrounded, true);
  assert.deepEqual(camera.position.toArray(), [4.5, 1, -4.5]);

  camera.position.y = 20;
  manager.resolvePlayerCollision(camera);
  assert.equal(camera.position.y, 6);
});

test("un objeto sólido devuelve al jugador a su posición anterior", () => {
  const manager = configuredManager();
  manager.previousPosition = new THREE.Vector3(-2, 2, 0);
  manager.setObjectColliders([new THREE.Box3(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 4, 1))]);
  const camera = cameraAt(0, 2, 0);
  manager.resolvePlayerCollision(camera);
  assert.equal(camera.position.x, -2);
  assert.equal(camera.position.z, 0);
});

test("solo se puede salir por el hueco cuando la puerta está abierta", () => {
  const closed = configuredManager();
  closed.previousPosition = new THREE.Vector3(0, 2, 4);
  const blockedCamera = cameraAt(0, 2, 6);
  closed.resolvePlayerCollision(blockedCamera);
  assert.equal(closed.isOutsideRoom, false);
  assert.equal(blockedCamera.position.z, 4.5);

  const open = configuredManager();
  open.setDoorOpen(true);
  open.previousPosition = new THREE.Vector3(0, 2, 4);
  const exitingCamera = cameraAt(0, 2, 6);
  open.resolvePlayerCollision(exitingCamera);
  assert.equal(open.isOutsideRoom, true);
});
