import assert from "node:assert/strict";
import test from "node:test";
import { getPlayerHint } from "../../src/game/hints/getPlayerHint.js";

const blankState = () => ({
  characters: { mum: { objects: {}, puzzles: {} }, dad: { objects: {}, puzzles: {} } },
  inventories: { mum: [], dad: [] },
});
const solve = (state, character, id) => { state.characters[character].puzzles[id] = { solved: true }; };
const setObject = (state, character, id, patch) => { state.characters[character].objects[id] = patch; };

test("las pistas rechazan estado o personaje inválidos", () => {
  assert.equal(getPlayerHint({ state: null, character: "mum" }), "explore");
  assert.equal(getPlayerHint({ state: blankState(), character: "other" }), "explore");
});

test("la pista de Mamá avanza según el progreso y combina el inventario local", () => {
  const state = blankState();
  assert.equal(getPlayerHint({ state, character: "mum" }), "mumBedroomSearch");

  solve(state, "dad", "bedroom-family-photo");
  assert.equal(getPlayerHint({ state, character: "mum" }), "mumSewing");
  solve(state, "mum", "bedroom-sewing-box");
  assert.equal(getPlayerHint({ state, character: "mum" }), "mumElectricalPlan");
  assert.equal(getPlayerHint({ state, character: "mum", inventoryIds: ["bedroom-electrical-plan"] }), "mumWaitSymbols");
  solve(state, "dad", "bedroom-light-reveal-puzzle");
  assert.equal(getPlayerHint({ state, character: "mum", inventoryIds: ["bedroom-electrical-plan"] }), "mumSafe");
});

test("la pista de Papá distingue entre esperar y actuar con la herramienta", () => {
  const state = blankState();
  solve(state, "dad", "bedroom-family-photo");
  solve(state, "dad", "bedroom-electrical-panel");
  solve(state, "dad", "bedroom-light-reveal-puzzle");
  setObject(state, "dad", "bedroom-exit-door", { locked: false });
  solve(state, "mum", "bathroom-hot-water");
  solve(state, "dad", "bathroom-sequence");

  assert.equal(getPlayerHint({ state, character: "dad" }), "dadBathroomDrawer");
  state.inventories.dad.push("screwdriver");
  assert.equal(getPlayerHint({ state, character: "dad" }), "dadMirror");
});

test("las pistas no retroceden si un paso posterior ya demuestra el progreso", () => {
  const state = blankState();
  solve(state, "dad", "bedroom-electrical-panel");
  solve(state, "dad", "bedroom-light-reveal-puzzle");
  setObject(state, "mum", "bedroom-exit-door", { locked: false });
  setObject(state, "dad", "bedroom-exit-door", { locked: false });
  solve(state, "dad", "bathroom-sequence");
  setObject(state, "dad", "hallway-maze-mirror", { released: true, open: true });
  solve(state, "dad", "hallway-maze");
  setObject(state, "dad", "hallway-living-room-door", { locked: false });

  assert.equal(getPlayerHint({ state, character: "mum" }), "mumWaitBooks");
  assert.equal(getPlayerHint({ state, character: "dad" }), "dadBooks");
});

test("los cerrojos finales se reconocen aunque su estado esté guardado en personajes distintos", () => {
  const state = blankState();
  for (const [character, room] of [["mum", "bedroom"], ["dad", "living-room"], ["mum", "children"], ["dad", "bathroom"]]) {
    setObject(state, character, `final-bolt-${room}`, { unlocked: true });
  }
  assert.equal(getPlayerHint({ state, character: "mum" }), "finalDoor");
  assert.equal(getPlayerHint({ state, character: "dad" }), "finalDoor");
});
