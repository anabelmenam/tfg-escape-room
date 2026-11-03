import assert from "node:assert/strict";
import test from "node:test";
import {
  normaliseCode,
  passwordResetTokenHash,
  playTimerSnapshot,
  socketRoom,
} from "../../src/server.js";
import { reduceAction, setObjectState } from "../../src/gameLogic.js";
import { createInitialState } from "../../src/state.js";

const player = (character) => ({ id: `${character}-player`, character });
const action = (type, targetId, payload = {}) => ({ type, targetId, payload });
const interact = (state, character, targetId, payload = {}) =>
  reduceAction(state, player(character), action("object.interact", targetId, payload));
const solve = (state, character, targetId, payload = {}) =>
  reduceAction(state, player(character), action("puzzle.solved", targetId, payload));
const pickup = (state, character, targetId) =>
  reduceAction(state, player(character), action("item.pickup", targetId));

test("server helpers normalise identifiers, hash tokens and calculate timers", () => {
  assert.equal(socketRoom("abc"), "game:abc");
  assert.equal(normaliseCode(" ab12cd "), "AB12CD");
  assert.equal(passwordResetTokenHash("token"), "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0");
  assert.deepEqual(playTimerSnapshot({ playTimeSeconds: 7, playStartedAt: null, status: "waiting" }, 10_000), {
    elapsedSeconds: 7,
    running: false,
    serverNow: 10_000,
  });
  assert.deepEqual(
    playTimerSnapshot({ playTimeSeconds: 7, playStartedAt: new Date(5_000), status: "playing" }, 10_900),
    { elapsedSeconds: 12, running: true, serverNow: 10_900 },
  );
});

test("generic object interactions update only the selected world", () => {
  const state = createInitialState();
  setObjectState(state, "mum", "drawer", { locked: true });
  interact(state, "mum", "drawer", { operation: "set-open", open: true });
  interact(state, "mum", "lamp", { operation: "set-active", active: true });
  interact(state, "dad", "cabinet");
  assert.deepEqual(state.characters.mum.objects.drawer, { locked: true, open: true });
  assert.equal(state.characters.mum.objects.lamp.active, true);
  assert.equal(state.characters.dad.objects.cabinet.open, true);
});

test("final locks, threshold, crossing and both endings form a complete sequence", () => {
  for (const choice of ["together", "sacrifice"]) {
    const state = createInitialState();
    const locks = [
      ["mum", "final-key-bedroom", "final-bolt-bedroom"],
      ["dad", "final-key-living-room", "final-bolt-living-room"],
      ["mum", "final-key-children", "final-bolt-children"],
      ["dad", "final-key-bathroom", "final-bolt-bathroom"],
    ];
    for (const [character, key, lock] of locks) {
      state.inventories[character].push(key);
      interact(state, character, lock);
    }
    assert.equal(state.ending.phase, "threshold");
    interact(state, "mum", "hallway-final-threshold", { operation: "hold-start" });
    interact(state, "dad", "hallway-final-threshold", { operation: "hold-start" });
    assert.equal(state.ending.phase, "opening");
    interact(state, "mum", "hallway-final-crossed");
    interact(state, "dad", "hallway-final-crossed");
    interact(state, choice === "sacrifice" ? "mum" : "dad", "hallway-final-choice", { choice });
    assert.equal(state.ending.phase, "complete");
    assert.equal(state.ending.choice, choice);
    assert.equal(state.ending.sacrificeCharacter, choice === "sacrifice" ? "mum" : null);
  }
});

test("final sequence rejects missing keys, locked threshold and invalid choice", () => {
  const state = createInitialState();
  assert.throws(() => interact(state, "mum", "final-bolt-bedroom"), /Necesitas/);
  assert.throws(() => interact(state, "mum", "hallway-final-threshold"), /cuatro cerrojos/);
  assert.throws(() => interact(state, "mum", "hallway-final-choice", { choice: "escape" }), /todavía/);
  state.ending.phase = "choice";
  assert.throws(() => interact(state, "mum", "hallway-final-choice", { choice: "escape" }), /no es válido/);
});

test("kitchen recipe supports placing, removing and solving ingredients", () => {
  const state = createInitialState();
  state.inventories.dad.push("kitchen-tomatoes-2", "kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese");
  state.inventories.mum.push("kitchen-recipe-note");
  interact(state, "dad", "kitchen-recipe", { operation: "place", slotIndex: 0, ingredientId: "kitchen-tomatoes-2" });
  interact(state, "dad", "kitchen-recipe", { operation: "remove", slotIndex: 0 });
  for (const [slotIndex, ingredientId] of ["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"].entries()) {
    interact(state, "dad", "kitchen-recipe", { operation: "place", slotIndex, ingredientId });
  }
  assert.equal(state.characters.dad.puzzles["kitchen-recipe"].solved, true);
  assert.equal(state.inventories.mum.includes("kitchen-recipe-note"), false);
  assert.throws(() => interact(createInitialState(), "mum", "kitchen-recipe", { slotIndex: 0 }), /Papá/);
  assert.throws(() => interact(createInitialState(), "dad", "kitchen-recipe", { slotIndex: 9 }), /posición/);
});

test("family table supports placing, removing and solving napkins", () => {
  const state = createInitialState();
  const napkins = ["kitchen-napkin-red", "kitchen-napkin-green", "kitchen-napkin-blue", "kitchen-napkin-ochre"];
  state.inventories.dad.push(...napkins);
  interact(state, "dad", "kitchen-family-table", { operation: "place", seatIndex: 0, napkinId: napkins[0] });
  interact(state, "dad", "kitchen-family-table", { operation: "remove", seatIndex: 0 });
  napkins.forEach((napkinId, seatIndex) => interact(state, "dad", "kitchen-family-table", { operation: "place", seatIndex, napkinId }));
  assert.equal(state.characters.dad.puzzles["kitchen-family-table"].solved, true);
  assert.throws(() => interact(createInitialState(), "mum", "kitchen-family-table", { seatIndex: 0 }), /Papá/);
  assert.throws(() => interact(createInitialState(), "dad", "kitchen-family-table", { seatIndex: -1 }), /puesto/);
});

test("room objects consume their tools and synchronise shared doors", () => {
  const state = createInitialState();
  state.inventories.dad.push("living-room-scissors");
  interact(state, "dad", "living-room-sofa-cushion");
  interact(state, "dad", "living-room-sofa-cushion");
  interact(state, "dad", "living-room-fireplace");
  state.inventories.dad.push("living-room-key", "study-key", "screwdriver", "fuse");
  interact(state, "dad", "hallway-living-room-door");
  interact(state, "dad", "hallway-children-room-door");
  state.inventories.mum.push("crowbar", "radio-dial", "bedroom-key");
  interact(state, "mum", "hallway-kitchen-door");
  state.characters.dad.puzzles["bathroom-sequence"] = { solved: true };
  interact(state, "dad", "hallway-maze-mirror");
  interact(state, "dad", "hallway-maze-mirror");
  interact(state, "dad", "bedroom-electrical-panel", { operation: "insert-fuse" });
  interact(state, "mum", "bedroom-radio", { operation: "insert-dial" });
  interact(state, "mum", "bedroom-exit-door");
  assert.equal(state.characters.mum.objects["hallway-living-room-door"].locked, false);
  assert.equal(state.characters.dad.objects["living-room-kitchen-door"].locked, false);
  assert.equal(state.characters.dad.objects["hallway-maze-mirror"].open, false);
  assert.equal(state.characters.dad.objects["bedroom-electrical-panel"].hasFuse, true);
});

test("painting, safe, chest and mosaic enforce cross-world prerequisites", () => {
  const state = createInitialState();
  state.characters.dad.puzzles["bedroom-light-reveal-puzzle"] = { solved: true };
  interact(state, "mum", "bedroom-symbol-safe");
  state.characters.dad.puzzles["living-room-rainbow-books"] = { solved: true };
  state.inventories.mum.push("living-room-fallen-painting", "painting-piece-1", "painting-piece-2", "living-room-vitrine-letter");
  interact(state, "mum", "living-room-painting-slot");
  interact(state, "mum", "living-room-painting-piece-0");
  interact(state, "mum", "living-room-painting-piece-4");
  interact(state, "dad", "living-room-chest");
  state.inventories.dad.push("bathroom-mosaic-tile");
  interact(state, "dad", "bathroom-mosaic", { operation: "insert-tile" });
  assert.equal(state.characters.mum.puzzles["living-room-painting"].solved, true);
  assert.equal(state.characters.dad.objects["living-room-chest"].locked, false);
  assert.equal(state.characters.dad.puzzles["bathroom-mosaic"].tileInserted, true);
});

test("puzzles solve in their intended dependency order", () => {
  const state = createInitialState();
  state.inventories.mum.push("clock-hand");
  solve(state, "mum", "hallway-clock");
  state.characters.dad.objects["hallway-maze-mirror"] = { open: true };
  solve(state, "dad", "hallway-maze");
  solve(state, "mum", "bathroom-hot-water");
  solve(state, "dad", "bathroom-sequence");
  state.inventories.dad.push("bedroom-radio-note");
  state.inventories.mum.push("radio-dial", "bedroom-electrical-plan");
  solve(state, "mum", "bedroom-radio");
  solve(state, "dad", "bedroom-electrical-panel");
  solve(state, "dad", "living-room-rainbow-books");
  state.characters.dad.objects["living-room-fireplace"] = { open: true };
  solve(state, "mum", "living-room-embers");
  state.characters.dad.puzzles["bedroom-family-photo"] = { solved: true };
  solve(state, "mum", "bedroom-sewing-box");
  assert.equal(state.characters.mum.puzzles["bedroom-sewing-box"].solved, true);
  assert.equal(state.inventories.mum.includes("bedroom-electrical-plan"), false);
});

test("children puzzles consume their clues and collected photographs", () => {
  const state = createInitialState();
  solve(state, "mum", "children-blocks");
  state.inventories.mum.push("globe-pushpin");
  solve(state, "mum", "children-globe-pin");
  const photos = ["children-memory-photo-home", "children-memory-photo-school", "children-memory-photo-park", "children-memory-photo-station"];
  state.inventories.mum.push(...photos);
  state.inventories.dad.push("children-photo-order-note");
  solve(state, "mum", "children-globe");
  state.inventories.mum.push("music-box-key");
  solve(state, "mum", "children-music-key");
  solve(state, "dad", "children-music");
  state.inventories.mum.push("bolt-cutters");
  solve(state, "mum", "children-wardrobe-chains");
  assert.equal(photos.some((id) => state.inventories.mum.includes(id)), false);
  assert.equal(state.characters.mum.puzzles["children-wardrobe-chains"].solved, true);
});

test("kitchen and bathroom puzzles require the complete cooperative chain", () => {
  const state = createInitialState();
  state.characters.dad.puzzles["kitchen-recipe"] = { solved: true, placements: ["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"] };
  solve(state, "dad", "kitchen-recipe");
  state.characters.dad.puzzles["kitchen-family-table"] = { placements: ["kitchen-napkin-red", "kitchen-napkin-green", "kitchen-napkin-blue", "kitchen-napkin-ochre"] };
  solve(state, "dad", "kitchen-family-table");
  solve(state, "dad", "kitchen-stove");
  solve(state, "mum", "kitchen-oven");
  state.characters.dad.puzzles["bathroom-mosaic"] = { tileInserted: true };
  solve(state, "dad", "bathroom-mosaic");
  assert.equal(state.characters.dad.puzzles["bathroom-mosaic"].solved, true);
});

test("pickups enforce prerequisites, avoid duplicates and migrate the legacy bathroom key", () => {
  const state = createInitialState();
  pickup(state, "mum", "family-note-01");
  pickup(state, "mum", "family-note-01");
  state.characters.mum.puzzles["bedroom-radio"] = { solved: true };
  state.characters.dad.objects["living-room-chest"] = { locked: false };
  state.characters.mum.puzzles["children-wardrobe-chains"] = { solved: true };
  state.characters.dad.puzzles["bathroom-mosaic"] = { solved: true };
  for (const [character, id] of [["mum", "final-key-bedroom"], ["dad", "final-key-living-room"], ["mum", "final-key-children"], ["dad", "final-key-bathroom"]]) pickup(state, character, id);
  pickup(state, "dad", "flashlight");
  pickup(state, "dad", "flashlight");
  assert.equal(state.journalEntries.length, 1);
  assert.equal(state.inventories.dad.filter((id) => id === "flashlight").length, 1);
  state.inventories.mum.push("final-key-bathroom");
  pickup(state, "mum", "ordinary-item");
  assert.equal(state.inventories.mum.includes("final-key-bathroom"), false);
  assert.equal(state.inventories.dad.includes("final-key-bathroom"), true);
});

test("special pickups become available after their related puzzles", () => {
  const state = createInitialState();
  state.characters.mum.puzzles["children-wardrobe-chains"] = { solved: true };
  state.characters.dad.puzzles["children-music"] = { solved: true };
  state.characters.mum.puzzles["children-globe"] = { solved: true };
  state.characters.mum.puzzles["children-blocks"] = { solved: true };
  state.characters.mum.puzzles["kitchen-oven"] = { solved: true };
  state.characters.dad.puzzles["bathroom-sequence"] = { solved: true };
  for (const [character, id] of [
    ["mum", "crowbar"], ["mum", "bolt-cutters"], ["mum", "music-box-key"], ["mum", "globe-pushpin"],
    ["mum", "children-memory-photo-home"], ["dad", "children-photo-order-note"], ["mum", "kitchen-recipe-note"],
    ["dad", "kitchen-tomatoes"], ["dad", "kitchen-napkin-red"], ["dad", "bathroom-mosaic-tile"], ["dad", "screwdriver"],
  ]) pickup(state, character, id);
  assert.equal(state.inventories.mum.includes("crowbar"), true);
  assert.equal(state.inventories.dad.includes("screwdriver"), true);
});

test("invalid puzzle and pickup paths return useful errors", () => {
  const cases = [
    () => solve(createInitialState(), "dad", "hallway-clock"),
    () => solve(createInitialState(), "mum", "hallway-maze"),
    () => solve(createInitialState(), "dad", "bathroom-hot-water"),
    () => solve(createInitialState(), "dad", "bedroom-radio"),
    () => solve(createInitialState(), "mum", "bedroom-electrical-panel"),
    () => solve(createInitialState(), "mum", "living-room-rainbow-books"),
    () => solve(createInitialState(), "dad", "living-room-embers"),
    () => solve(createInitialState(), "dad", "children-blocks"),
    () => solve(createInitialState(), "mum", "children-globe"),
    () => solve(createInitialState(), "mum", "kitchen-oven"),
    () => pickup(createInitialState(), "mum", "flashlight"),
    () => pickup(createInitialState(), "dad", "children-memory-photo-home"),
    () => pickup(createInitialState(), "mum", "hallway-maze-note"),
    () => pickup(createInitialState(), "dad", "kitchen-recipe-note"),
    () => pickup(createInitialState(), "mum", "kitchen-tomatoes"),
    () => pickup(createInitialState(), "mum", "kitchen-napkin-red"),
  ];
  cases.forEach((run) => assert.throws(run));
});
