import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();
const { Shelf } = await import("../../src/world/objects/furniture/Shelf.js");
const { Chest } = await import("../../src/world/objects/decoration/Chest.js");
const { Safe } = await import("../../src/world/objects/furniture/Safe.js");
const { Lock } = await import("../../src/world/objects/decoration/Lock.js");
const { Cobweb } = await import("../../src/world/objects/decoration/Cobweb.js");
const { Book } = await import("../../src/world/objects/decoration/Book.js");
const { KitchenCounter } = await import("../../src/world/objects/furniture/KitchenCounter.js");

test("el fregadero de cocina abre el grifo y llena la cubeta", () => {
  const counter = new KitchenCounter({ id: "sink", width: 6, hasSink: true });
  const faucet = counter.getInteractables().find(({ id }) => id === "sink-faucet");
  assert.ok(faucet);
  assert.equal(counter.waterSurface.visible, false);
  faucet.interact();
  counter.update(10);
  assert.equal(counter.waterStream.visible, true);
  assert.equal(counter.waterSurface.visible, true);
  assert.ok(counter.waterFill > 0.9);
  faucet.interact();
  counter.update(10);
  assert.equal(counter.waterStream.visible, false);
  assert.ok(counter.waterFill < 0.01);
  counter.dispose();
});

test("Shelf gestiona objetos, baldas, transformaciones y mecanismo secreto", () => {
  assert.throws(() => new Shelf({ width: 0 }));
  assert.throws(() => new Shelf({ shelves: 0 }));
  const shelf = new Shelf({ id: "s", shelves: 3, backWall: true });
  const object = new THREE.Mesh(new THREE.BoxGeometry(.3, .4, .2), new THREE.MeshBasicMaterial());
  object.name = "object";
  assert.equal(shelf.addToShelf({}, { shelf: 0 }), null);
  assert.equal(shelf.addToShelf(object, { shelf: 10 }), null);
  assert.equal(shelf.addToShelf(object, { shelf: 0, x: 99, z: -99 }), object);
  assert.equal(shelf.getShelfObjects(0).length, 1);
  assert.ok(shelf.getShelfHeight(0) !== null);
  assert.equal(shelf.getShelfHeight(99), null);
  assert.equal(shelf.moveObjectToShelf(object, { shelf: 1, placeOnSurface: false }), object);
  assert.equal(shelf.getShelfObjects(1).length, 1);
  assert.equal(shelf.removeObject({}), false);
  shelf.clearShelf(1);
  shelf.clearShelf(99);
  shelf.addToShelf(object, { shelf: 2 });
  shelf.openMechanism({ angle: .5, duration: .1, side: "right" });
  shelf.openMechanism();
  shelf.update(.05);
  shelf.update(1);
  shelf.setPosition(new THREE.Vector3(1, 0, 0));
  shelf.setRotationY(.2);
  shelf.setScale(1.2);
  shelf.setScale(new THREE.Vector3(1, 1, 1));
  shelf.setVisible(false);
  assert.ok(shelf.getCollider().isBox3);
  assert.deepEqual([shelf.getWidth(), shelf.getHeight(), shelf.getDepth(), shelf.getShelfCount()], [2.5, 2.2, .4, 3]);
  shelf.dispose();
});

test("Chest exige llave, abre, anima y administra su contenido", () => {
  const changes = [];
  const chest = new Chest({ id: "c", locked: true, requiredKey: "key", onOpenChange: (value) => changes.push(value) });
  assert.equal(chest.open().success, false);
  const inventory = { hasSelected: (id) => id === "key", remove: () => changes.push("removed") };
  assert.equal(chest.interact({ inventory }).success, true);
  chest.update(10);
  assert.equal(chest.isOpen, true);
  assert.match(chest.getInteractionText(), /Cerrar|Close|Fermer/i);
  assert.equal(chest.toggle().action, "closing");
  chest.update(10);
  chest.lock("password");
  assert.equal(typeof chest.getInteractionText(), "string");
  chest.unlock();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); mesh.name = "item";
  const chestItem = { id: "item", object3D: mesh };
  assert.equal(chest.addItem(null), false);
  assert.equal(chest.addItem(chestItem, { scale: 2, rotation: new THREE.Euler(.1, .2, .3) }), true);
  assert.equal(chest.hasItem("item"), true);
  assert.equal(chest.getItems().length, 1);
  assert.equal(chest.removeItem("missing"), null);
  assert.equal(chest.removeItem("item", new THREE.Group()), chestItem);
  chest.setPosition(new THREE.Vector3(1, 2, 3)); chest.setRotationY(.4); chest.setScale(new THREE.Vector3(1, 2, 1));
  assert.ok(chest.getCollider().isBox3);
  chest.dispose();
});

test("Safe valida clave, foco, puerta y objetos guardados", () => {
  assert.throws(() => new Safe({ password: [] }));
  assert.throws(() => new Safe({ symbols: ["x"] }));
  const calls = [];
  const safe = new Safe({ id: "safe", password: ["B"], symbols: ["A", "B"], onFocus: () => calls.push("focus"), onUnlock: () => calls.push("unlock") });
  safe.interact();
  safe.changeDigit(-1);
  safe.changeDigit(0);
  assert.equal(safe.isLocked, false);
  safe.interact();
  safe.update(2);
  safe.toggleDoor(); safe.update(2);
  safe.setFocused(true);
  assert.ok(safe.getFocusPosition().isVector3 && safe.getLookAtPosition().isVector3);
  const item = { id: "paper", object3D: new THREE.Group() };
  assert.equal(safe.addItem(item, { scale: new THREE.Vector3(1, 1, 1), rotation: new THREE.Euler() }), true);
  assert.equal(safe.addItem(item), false);
  assert.equal(safe.hasItem("paper"), true);
  assert.equal(safe.getItem("missing"), null);
  assert.equal(safe.removeItem("paper", new THREE.Group()), item);
  assert.equal(safe.removeItem("paper"), null);
  assert.ok(calls.includes("focus") && calls.includes("unlock"));
});

test("Lock maneja ruedas, combinación, apertura y estados deshabilitados", () => {
  assert.throws(() => new Lock({ digits: 0 }));
  assert.throws(() => new Lock({ digits: 2, password: "123" }));
  const calls = [];
  const lock = new Lock({ id: "lock", digits: 1, password: "1", onFocus: () => calls.push("focus"), onUnlock: () => calls.push("unlock") });
  lock.incrementDigit(0);
  lock.setFocused(true);
  lock.incrementDigit(-1);
  lock.decrementDigit(0);
  lock.incrementDigit(0);
  lock.incrementDigit(0);
  assert.equal(lock.locked, false);
  lock.update(.2); lock.update(1);
  lock.interact();
  assert.ok(lock.getFocusPosition().isVector3 && lock.getLookAtPosition().isVector3);
  assert.equal(lock.getDigitMeshes().length, 1);
  lock.enabled = false;
  assert.equal(lock.getInteractionText(), null);
  lock.setUnlocked();
  lock.dispose();
});

test("Cobweb y Book cubren variantes visuales, interacción y animación", () => {
  for (const options of [{ corner: false }, { corner: true }, { cornerCeiling: true }]) {
    const web = new Cobweb({ id: "web", ...options, spokes: 5, rings: 2 });
    web.setOpacity(.2);
    assert.equal(web.material.opacity, .2);
    web.dispose();
  }
  const calls = [];
  const book = new Book({ id: "book", symbol: "△", onInteract: () => calls.push("read") });
  book.interact();
  book.setEnabled(false); book.interact();
  assert.equal(book.getInteractionText(), null);
  book.setEnabled(true); book.setOnInteract(() => calls.push("again"));
  book.setSelected(true); book.update(.1); book.update(1);
  book.setSelected(false); book.animateTo(new THREE.Vector3(1, 2, 3), .1); book.update(1);
  assert.equal(book.object3D.position.x, 1);
  book.dispose();
  assert.deepEqual(calls, ["read"]);
});
