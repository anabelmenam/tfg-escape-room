import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState } from "../../src/state.js";

test("createInitialState crea la estructura completa de una partida", () => {
  assert.deepEqual(createInitialState(), {
    characters: {
      mum: { objects: {}, puzzles: {} },
      dad: { objects: {}, puzzles: {} },
    },
    inventories: { mum: [], dad: [] },
    journalEntries: [],
    ending: {
      phase: "locked",
      holding: { mum: false, dad: false },
      choice: null,
      sacrificeCharacter: null,
    },
  });
});

test("cada estado inicial es independiente y no comparte referencias", () => {
  const first = createInitialState();
  const second = createInitialState();
  first.inventories.mum.push("key");
  first.characters.dad.puzzles.maze = { solved: true };
  first.ending.holding.mum = true;

  assert.deepEqual(second.inventories.mum, []);
  assert.deepEqual(second.characters.dad.puzzles, {});
  assert.equal(second.ending.holding.mum, false);
});
