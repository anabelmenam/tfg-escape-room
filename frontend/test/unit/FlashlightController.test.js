import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { FlashlightController } from "../../src/game/controllers/FlashlightController.js";

const createGame = (hasFlashlight) => ({
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(),
  player: { inventory: { has: () => hasFlashlight } },
});

test("la linterna no se enciende si no está en el inventario", () => {
  const controller = new FlashlightController(createGame(false));
  controller.toggle();
  assert.equal(controller.active, false);
  assert.equal(controller.light.visible, false);
});

test("la linterna alterna estado y sigue la cámara", () => {
  const game = createGame(true);
  game.camera.position.set(2, 3, 4);
  game.camera.lookAt(2, 3, 0);
  const controller = new FlashlightController(game);

  controller.toggle();
  controller.update();
  assert.equal(controller.active, true);
  assert.equal(controller.light.visible, true);
  assert.ok(controller.light.position.distanceTo(game.camera.position) > 0);
  assert.ok(controller.target.position.distanceTo(controller.light.position) > 17);

  controller.toggle();
  assert.equal(controller.light.visible, false);
});
