import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { FakeElement, installBrowserMocks } from "../helpers/browserMocks.js";
import { Inventory } from "../../src/game/Inventory.js";

installBrowserMocks();

const { Player } = await import("../../src/game/Player.js");
const { InteractionManager } = await import("../../src/game/InteractionManager.js");
const { InventoryController } = await import("../../src/game/controllers/InventoryController.js");
const { GameInputController } = await import("../../src/game/controllers/GameInputController.js");
const { setLanguage } = await import("../../src/translations/index.js");

const registerElement = (id, element = new FakeElement()) => {
  element.id = id;
  element.ownerDocument = document;
  document.__elements.set(id, element);
  return element;
};

test("Player cambia de vista, foco, movimiento, salto e inventario", () => {
  registerElement("crosshair");
  registerElement("interaction-text");
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 100);
  camera.position.set(0, 5.25, 0);
  const domElement = new FakeElement("canvas");
  domElement.ownerDocument = document;
  const pressed = new Set();
  const input = { isPressed: (code) => pressed.has(code) };
  const collisionManager = { resolvePlayerCollision: () => ({ isGrounded: true }) };
  const player = new Player(camera, domElement, input, collisionManager);

  player.setLookAt(new THREE.Vector3(1, 2, 3));
  player.setMouseSensitivity(8);
  assert.equal(player.fpControls.pointerSpeed, 2);
  player.setMode(false);
  player.update(.016);
  player.toggleMode();
  player.toggleCrouch();
  assert.equal(player.isCrouching, true);
  player.requestPointerLock();

  const focused = {
    setFocused(value) { this.focused = value; },
    getFocusHint: () => "Pista",
    getFocusPosition: () => new THREE.Vector3(2, 3, 4),
    getFocusUp: () => new THREE.Vector3(0, 1, 0),
    getLookAtPosition: () => new THREE.Vector3(),
  };
  player.focusObject(focused);
  player.focusObject(focused);
  player.toggleCrouch();
  player.update(.016);
  player.exitFocus();
  player.exitFocus();

  const item = { id: "key" };
  player.inventory.add(item);
  assert.equal(player.hasSelected("key"), true);
  player.selectInventorySlot(0);
  assert.equal(player.removeItemFromInventory("key"), item);

  pressed.add("KeyW"); pressed.add("KeyS"); pressed.add("KeyA"); pressed.add("KeyD"); pressed.add("Space"); pressed.add("ControlLeft");
  player.update(.05);
  pressed.clear();
  player.isGrounded = false;
  player.verticalVelocity = -1;
  player.update(.05);
  assert.equal(player.isGrounded, true);
});

test("InteractionManager detecta controles, oclusiones y ejecuta interacciones", () => {
  const label = registerElement("interaction-text");
  const root = new THREE.Group();
  const child = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  child.userData.roomPuzzleControl = { index: 2 };
  root.add(child);
  const calls = [];
  const entity = {
    object3D: root,
    enabled: true,
    getInteractionText: (_player, control) => control ? "Usar control" : "Usar",
    interact: (_player, control) => calls.push(control),
  };
  const manager = new InteractionManager({
    camera: new THREE.PerspectiveCamera(),
    interactableManager: { getAll: () => [entity] },
    player: { isFocused: false },
  });
  manager.raycaster = {
    setFromCamera() {},
    intersectObjects: (objects) => objects === manager.occluders ? [] : [{ object: child, distance: 2 }],
  };
  manager.setOccluders([]);
  manager.update();
  assert.equal(label.textContent, "Usar control");
  manager.use();
  assert.equal(calls.length, 1);
  assert.equal(manager.findEntityFromObject(child), entity);
  assert.equal(manager.findEntityFromObject(new THREE.Group()), null);
  assert.equal(manager.findControlFromObject(child, null), null);

  manager.raycaster.intersectObjects = () => [];
  manager.update();
  manager.raycaster.intersectObjects = (objects) => objects === manager.occluders ? [] : [{ object: child, distance: 20 }];
  manager.update();
  manager.raycaster.intersectObjects = (objects) => objects === manager.occluders ? [{ distance: 1 }] : [{ object: child, distance: 2 }];
  manager.update();
  manager.player.isFocused = true;
  manager.update();
  manager.use();
  manager.dispose();
});

test("InventoryController actualiza iconos e inspección sin mostrar pistas narrativas", () => {
  const ids = ["inventory-selected-name", "inventory-inspection", "inventory-inspection-image", "inventory-inspection-title", "inventory-inspection-hint", "inventory-inspection-translation", "inventory-inspection-close"];
  ids.forEach((id) => registerElement(id));
  for (let index = 0; index < 8; index += 1) {
    registerElement(`inventory-slot-${index}`);
    registerElement(`inventory-item-${index}`);
  }
  const inventory = new Inventory(8);
  const calls = [];
  const game = {
    player: { inventory, fpControls: { isLocked: true, unlock: () => calls.push("unlock") }, isFirstPerson: true, isFocused: false, requestPointerLock: () => calls.push("lock") },
    ready: true,
    gameAudio: { playPickup: () => calls.push("pickup") },
  };
  const controller = new InventoryController(game);
  inventory.add({ id: "paper", itemName: "mazeNote", inventoryIcon: "/icon.png", inspectionImage: "/paper.png", hideInspectionCaption: true, inspectionTranslationKey: "papers.kitchen-recipe-note" });
  assert.ok(calls.includes("pickup"));
  controller.inspectSelected("KeyR");
  assert.equal(game.inventoryInspectionOpen, false);
  setLanguage("en");
  controller.inspectSelected("KeyI");
  assert.equal(game.inventoryInspectionOpen, true);
  assert.equal(document.getElementById("inventory-inspection-title").textContent, "");
  assert.match(document.getElementById("inventory-inspection-translation").textContent, /HOUSE STEW/);
  controller.closeInspection();
  setLanguage("es");
  controller.inspectSelected("KeyI");
  assert.equal(document.getElementById("inventory-inspection-translation").textContent, "");
  controller.closeInspection();
  controller.closeInspection();
  controller.dispose();
});

test("GameInputController cubre teclado, rueda, foco y clic", () => {
  const calls = [];
  const inventory = new Inventory(2);
  inventory.add({ id: "a" }); inventory.add({ id: "b" });
  const fpControls = { isLocked: false, addEventListener() {}, removeEventListener() {}, unlock: () => calls.push("unlock") };
  const domElement = new FakeElement("canvas");
  const focused = { object3D: new THREE.Group(), handleKey: () => false, closePanel: () => calls.push("closePanel") };
  const game = {
    ready: true, paused: false, endingCinematic: null, endingTour: null, inventoryInspectionOpen: false, isAdmin: true,
    gameAudio: { unlock: () => calls.push("audio") },
    onPauseRequest: () => calls.push("pause"), closeInventoryInspection: () => calls.push("closeInspection"),
    inspectSelectedInventoryItem: (code) => calls.push(code), toggleFlashlight: () => calls.push("flashlight"),
    interactionManager: { use: () => calls.push("use") },
    player: {
      isFocused: false, isFirstPerson: true, fpControls, inventory,
      toggleCrouch: () => calls.push("crouch"), toggleMode: () => calls.push("mode"),
      selectInventorySlot: (index) => inventory.select(index), requestPointerLock: () => calls.push("lock"),
      exitFocus: () => calls.push("exitFocus"), focusedObject: focused,
    },
    renderer: { domElement }, lockMouse: new THREE.Vector2(), camera: new THREE.PerspectiveCamera(),
    lockRaycaster: { setFromCamera() {}, intersectObjects: () => [] },
  };
  const controller = new GameInputController(game);
  const event = (code, extras = {}) => ({ code, repeat: false, preventDefault: () => calls.push("prevent"), ...extras });
  for (const code of ["ShiftLeft", "KeyI", "KeyR", "KeyQ", "KeyF", "KeyE", "Digit2", "Escape"]) controller.handleKeyDown(event(code));
  controller.handleWheel({ deltaY: 1 }); controller.handleWheel({ deltaY: -1 }); controller.handleWheel({ deltaY: 0 });
  controller.handleClick({ clientX: 1, clientY: 1 });
  game.paused = true; controller.handleKeyDown(event("Escape")); game.paused = false;
  game.inventoryInspectionOpen = true; controller.handleKeyDown(event("Escape")); game.inventoryInspectionOpen = false;
  game.player.isFocused = true; controller.handleKeyDown(event("Digit1")); controller.handleKeyDown(event("Escape")); controller.handleClick({ clientX: 1, clientY: 1 });
  game.player.isFocused = false;
  const pausesBeforeEnding = calls.filter((call) => call === "pause").length;
  game.endingCinematic = {};
  controller.handleKeyDown(event("KeyE"));
  controller.handleKeyDown(event("Escape"));
  assert.equal(calls.filter((call) => call === "pause").length, pausesBeforeEnding + 1);
  game.endingCinematic = null;
  game.ready = false; controller.handleKeyDown(event("KeyQ")); controller.handleWheel({ deltaY: 1 }); controller.handleClick({ clientX: 1, clientY: 1 });
  assert.ok(calls.includes("flashlight"));
  assert.ok(calls.includes("use"));
  controller.dispose();
});
