import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { installBrowserMocks } from "../helpers/browserMocks.js";
import { Inventory } from "../../src/game/Inventory.js";

installBrowserMocks();
const { Game } = await import("../../src/game/Game.js");

const makeGame = () => {
  const calls = [];
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    ready: true, paused: false, character: "mum", applyingSharedState: false,
    container: { clientWidth: 800, clientHeight: 400, removeChild() {} },
    camera: new THREE.PerspectiveCamera(), scene: new THREE.Scene(),
    renderer: { setSize: (...args) => calls.push(["size", ...args]), setPixelRatio: (value) => calls.push(["ratio", value]), render() {}, domElement: {} },
    player: {
      inventory: new Inventory(), orbitControls: { enabled: false }, fpControls: { isLocked: true, unlock: () => calls.push(["unlock"]), enabled: true },
      requestPointerLock: () => calls.push(["lock"]), isFirstPerson: true, isFocused: false, isCrouching: false, isGrounded: true,
      setLookAt: () => calls.push(["look"]), update: () => calls.push(["playerUpdate"]), focusedObject: null,
    },
    collisionManager: { previousPosition: new THREE.Vector3() },
    normalPixelRatio: 2, backgroundPixelRatio: .8, backgroundPerformanceMode: false, lastRenderedAt: 0,
    roomData: null, pendingCheckpoint: null,
    multiplayer: { updateRemote: (v) => calls.push(["remote", v]), setConnected: (v) => calls.push(["connected", v]), setIdentity: (v) => calls.push(["identity", v]), update() {}, dispose() {} },
    inventoryController: { updateUI: () => calls.push(["ui"]), inspectSelected: (v) => calls.push(["inspect", v]), closeInspection: () => calls.push(["closeInspection"]), dispose() {} },
    flashlightController: { active: true, light: {}, target: {}, toggle: () => calls.push(["flash"]), update: () => calls.push(["flashUpdate"]) },
    input: { isPressed: () => false, dispose() {} }, interactionManager: { update() {}, dispose() {} },
    interactableManager: { dispose() {} }, entityManager: { update() {}, dispose() {} },
    gameAudio: { updateFootsteps() {}, dispose() {} }, ownsGameAudio: false,
    inputController: { dispose() {} },
    timer: { update() {}, getDelta: () => .016, disconnect() {} },
    loadingProgress: { loaded: 0, total: 0 }, loadingManagerHandlers: {},
    environmentTexture: null, endingCinematic: null, endingTour: null,
    onDiaryEntriesChanged: (v) => calls.push(["diary", v]), onEndingChange: (v) => calls.push(["ending", v]),
  });
  return { game, calls };
};

test("Game aplica estado compartido, inventario y checkpoint", () => {
  const { game, calls } = makeGame();
  const worldItem = { id: "key", object3D: { visible: true }, setEnabled(value) { this.enabled = value; } };
  const note = { id: "note", setCollected(value) { this.collected = value; } };
  const switchEntity = { id: "switch", active: false, setActive(value) { this.active = value; }, onPress() { calls.push(["press"]); } };
  const doorEntity = { id: "cabinet", isOpen: false, open() { this.isOpen = true; }, close() { this.isOpen = false; } };
  const apply = () => calls.push(["apply"]);
  game.roomData = {
    hallway: { applyHallwayState: apply }, bedroom: { applyBedroomState: apply }, childrenRoom: { applyChildrenRoomState: apply },
    kitchen: { applyKitchenState: apply }, livingRoom: { applyLivingRoomState: apply }, bathroom: { applyBathroomState: apply },
    entities: [worldItem, switchEntity, doorEntity], storyNotes: [note],
    door: { unlock: () => calls.push(["doorUnlock"]), open: () => calls.push(["doorOpen"]) },
  };
  const state = {
    inventories: { mum: ["key", "bedroom-radio-note", "children-photo-order-note"] }, journalEntries: ["note"], ending: { phase: "choice" },
    characters: {
      mum: { puzzles: { "children-globe": { solved: true }, "bedroom-radio": { solved: true } }, objects: { "bedroom-exit-door": { locked: false, open: true }, switch: { active: true }, cabinet: { open: true } } },
      dad: { puzzles: { "kitchen-recipe": { solved: true }, "bedroom-electrical-panel": { solved: true } }, objects: {} },
    },
  };
  game.applySharedState(null);
  game.roomData = null; game.applySharedState(state);
  game.roomData = { ...game.roomData, hallway: null };
  game.roomData = {
    hallway: { applyHallwayState: apply }, bedroom: { applyBedroomState: apply }, childrenRoom: { applyChildrenRoomState: apply }, kitchen: { applyKitchenState: apply }, livingRoom: { applyLivingRoomState: apply }, bathroom: { applyBathroomState: apply },
    entities: [worldItem, switchEntity, doorEntity], storyNotes: [note], door: { unlock: () => calls.push(["doorUnlock"]), open: () => calls.push(["doorOpen"]) },
  };
  game.applySharedState(state);
  assert.equal(worldItem.object3D.visible, false);
  assert.equal(note.collected, true);
  assert.equal(switchEntity.active, true);
  assert.equal(doorEntity.isOpen, true);

  game.applyCheckpoint(null);
  game.applyCheckpoint({ position: { x: 1, y: 2, z: 3 }, rotationY: .5 });
  assert.deepEqual(game.camera.position.toArray(), [1, 2, 3]);
  game.ready = false; game.applyCheckpoint({ position: { x: 4, y: 5, z: 6 } });
  game.ready = true; game.applyCheckpoint({ position: { x: NaN, y: 1, z: 2 } });
  assert.ok(calls.some(([name]) => name === "look"));
});

test("Game controla pausa, tamaño, rendimiento y delegaciones", async () => {
  const { game, calls } = makeGame();
  assert.equal(game.flashlightOn, true);
  assert.ok(game.flashlight);
  assert.ok(game.flashlightTarget);
  game.multiplayer.remoteEcho = { id: 1 }; game.multiplayer.previewEchoes = [1, 2];
  assert.ok(game.remoteEcho); assert.equal(game.previewEchoes.length, 2);
  game.pause(); game.pause();
  game.resume({ lockPointer: true }); game.resume();
  game.paused = true; game.player.isFirstPerson = false; game.resume();
  game.updateRemotePlayer({ x: 1 }); game.setRemotePlayerConnected(true); game.setRemotePlayerIdentity({ name: "A" });
  game.updateInventoryUI(); game.inspectSelectedInventoryItem("KeyI"); game.closeInventoryInspection(); game.toggleFlashlight(); game.updateFlashlight();
  game.resize(); game.container.clientWidth = 0; game.resize(); game.container.clientWidth = 800;
  game.setBackgroundPerformanceMode(true); game.setBackgroundPerformanceMode(true); game.setBackgroundPerformanceMode(false);
  game.loadingProgress = { loaded: 1, total: 1 };
  await game.waitForAssets();
  assert.ok(calls.length > 8);
});
