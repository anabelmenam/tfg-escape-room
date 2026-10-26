import assert from "node:assert/strict";
import test from "node:test";
import { Inventory } from "../../src/game/Inventory.js";

const item = (id) => ({ id });

test("Inventory gestiona altas, duplicados, selección y bajas", () => {
  const inventory = new Inventory(3);
  let changes = 0;
  inventory.onChange = () => { changes += 1; };

  assert.equal(inventory.add(item("key")), true);
  assert.equal(inventory.add(item("key")), false);
  assert.equal(inventory.add(null), false);
  assert.equal(inventory.add(item("paper")), true);
  inventory.select(1);

  assert.equal(inventory.has("key"), true);
  assert.equal(inventory.get("key").id, "key");
  assert.equal(inventory.getSelectedItem().id, "paper");
  assert.equal(inventory.hasSelected("paper"), true);
  assert.equal(inventory.remove("paper").id, "paper");
  assert.equal(inventory.remove("missing"), null);
  assert.equal(changes, 4);
});

test("Inventory respeta su capacidad y restaura una copia acotada", () => {
  const inventory = new Inventory(2);
  assert.equal(inventory.add(item("one")), true);
  assert.equal(inventory.add(item("two")), true);
  assert.equal(inventory.add(item("three")), false);

  inventory.restore([item("a"), null, item("b"), item("c")]);
  assert.deepEqual(inventory.getAll().map((entry) => entry?.id), ["a", "b"]);

  const snapshot = inventory.getAll();
  snapshot[0] = null;
  assert.equal(inventory.get("a").id, "a");

  inventory.clear();
  assert.deepEqual(inventory.getAll(), [null, null]);
});
