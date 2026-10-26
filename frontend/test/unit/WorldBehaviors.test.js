import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();

const { Box } = await import("../../src/world/objects/decoration/Box.js");
const { TemporalEcho } = await import("../../src/game/TemporalEcho.js");

test("Box gestiona apertura, llave, contenido, transformaciones y liberación", () => {
  const events = [];
  const box = new Box({
    id: "test-box",
    locked: true,
    requiredKey: "key",
    capacity: 2,
    texture: "/texture.jpg",
    scale: new THREE.Vector3(1, 1, 1),
    onOpenChange: ({ isOpen }) => events.push(["open", isOpen]),
    onItemAdded: ({ itemId }) => events.push(["added", itemId]),
    onItemRemoved: ({ itemId }) => events.push(["removed", itemId]),
  });
  const missingInventory = { hasSelected: () => false, remove() {} };
  assert.deepEqual(box.open({ inventory: missingInventory }), { success: false, reason: "locked", requiredKey: "key" });

  let removedKey = false;
  const inventory = { hasSelected: (id) => id === "key", remove: () => { removedKey = true; } };
  assert.equal(box.interact({ inventory }).success, true);
  assert.equal(removedKey, true);
  box.update(10);
  assert.equal(box.isOpen, true);
  assert.equal(box.open().reason, "already-open");
  assert.equal(box.toggle().action, "closing");
  box.update(10);
  assert.equal(box.isOpen, false);
  assert.equal(box.close().reason, "already-closed");
  box.lock("second-key");
  box.unlock();

  assert.equal(box.addItem(null).reason, "invalid-item");
  assert.equal(box.addItem({ id: "bad" }).reason, "invalid-object3D");
  assert.equal(box.addItem({ isObject3D: true, id: null, name: "" }).reason, "missing-id");
  const first = { id: "first", object3D: new THREE.Group() };
  const second = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  second.name = "second";
  assert.equal(box.addItem(first, { position: new THREE.Vector3(1, 2, 3), rotation: new THREE.Euler(.1, .2, .3), scale: .5 }).success, true);
  assert.equal(box.addItem(first).reason, "already-stored");
  assert.equal(box.addItem({ id: "second", object3D: second }, { scale: new THREE.Vector3(.5, .6, .7), visibleInside: false }).success, true);
  assert.equal(box.addItem({ id: "third", object3D: new THREE.Group() }).reason, "full");
  assert.equal(box.getItem("first"), first);
  assert.equal(box.hasItem("second"), true);
  assert.equal(box.getItems().length, 2);
  assert.deepEqual(box.getItemIds(), ["first", "second"]);
  assert.equal(box.getItemCount(), 2);
  assert.equal(box.isFull(), true);
  assert.equal(box.removeItem("unknown").reason, "not-found");
  const target = new THREE.Group();
  assert.equal(box.removeItem("first", target).success, true);
  assert.equal(target.children.includes(first.object3D), true);
  assert.equal(box.clearItems().length, 1);

  box.setPosition(new THREE.Vector3(2, 0, 3));
  box.setRotation({ x: .1, y: .2, z: .3 });
  box.setRotationY(.8);
  box.setScale(1.2);
  box.setScale(new THREE.Vector3(1, 2, 1));
  assert.ok(box.getCollider() instanceof THREE.Box3);
  assert.ok(events.length >= 4);
  box.dispose();
  assert.equal(box.contents.size, 0);

  const colliderless = new Box({ createCollider: false, initiallyOpen: true });
  assert.equal(colliderless.getCollider(), null);
  colliderless.refreshCollider();
  colliderless.dispose();
});

for (const role of ["mama", "papa"]) {
  test(`TemporalEcho representa y anima a ${role}`, () => {
    const echo = new TemporalEcho({ role, name: "Jugador" });
    assert.equal(echo.object3D.visible, false);
    echo.setConnected(true);
    assert.equal(echo.object3D.visible, false);
    echo.setName("");
    echo.setName("Jugador");
    echo.setName("Compañero");
    echo.setTarget({ position: { x: 1, y: 5.25, z: 2 }, rotationY: Math.PI });
    assert.equal(echo.object3D.visible, true);
    echo.setTarget({ position: { x: 4, y: 5.25, z: 5 }, rotationY: -Math.PI / 2 });
    echo.update(.016);
    echo.update(.5);
    echo.setConnected(false);
    assert.equal(echo.object3D.visible, false);
    echo.update(.1);
    echo.dispose();
  });
}
