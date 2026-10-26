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
