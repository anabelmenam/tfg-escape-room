import assert from "node:assert/strict";
import test from "node:test";
import { EventManager } from "../../src/game/managers/EventManager.js";

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { MAZE_ROUTE, MAZE_SIZE, canMove } = await import("../../src/world/puzzles/hallway/mazeLayout.js");

test("EventManager notifica a todos los oyentes", () => {
  const events = new EventManager();
  const received = [];
  events.on("solved", (data) => received.push(["first", data]));
  events.on("solved", (data) => received.push(["second", data]));
  events.emit("solved", { id: "maze" });

  assert.deepEqual(received, [
    ["first", { id: "maze" }],
    ["second", { id: "maze" }],
  ]);
});

test("la ruta oficial del laberinto es continua y queda dentro del tablero", () => {
  assert.deepEqual(MAZE_ROUTE[0], [0, 0]);
  assert.deepEqual(MAZE_ROUTE.at(-1), [8, 8]);
  for (let index = 1; index < MAZE_ROUTE.length; index += 1) {
    const [x, y] = MAZE_ROUTE[index];
    assert.ok(x >= 0 && x < MAZE_SIZE && y >= 0 && y < MAZE_SIZE);
    assert.equal(canMove(MAZE_ROUTE[index - 1], MAZE_ROUTE[index]), true);
    assert.equal(canMove(MAZE_ROUTE[index], MAZE_ROUTE[index - 1]), true);
  }
  assert.equal(canMove([0, 0], [0, 1]), false);
  assert.equal(canMove([0, 0], [8, 8]), false);
});
