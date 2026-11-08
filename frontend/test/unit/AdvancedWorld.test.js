import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();
const { BlockConstructionPuzzle } = await import("../../src/world/puzzles/childrenRoom/BlockConstructionPuzzle.js");
const { CASTLE_PIECES } = await import("../../src/world/puzzles/childrenRoom/ChildrenPuzzleBase.js");
const { initializeGameLevel } = await import("../../src/game/initializeGameLevel.js");
const { EventManager } = await import("../../src/game/managers/EventManager.js");

test("puzzle de bloques cubre selección, apilado, devolución, solución y alfombra", () => {
  const calls = [];
  const puzzle = new BlockConstructionPuzzle({ character: "mum", onFocus: () => calls.push("focus"), onSolved: () => calls.push("solved"), onMatLifted: () => calls.push("mat") });
  puzzle.interact();
  puzzle.selectBlock(0);
  puzzle.handleControl({ kind: "block-return" });
  puzzle.selectBlock(1);
  puzzle.handleControl({ kind: "block-surface" }, null, { point: puzzle.object3D.localToWorld(new THREE.Vector3(-.9, puzzle.surfaceTop, .35)) });
  assert.ok(puzzle.placed.includes(1));
  puzzle.handleControl({ kind: "block", value: 1 });
  puzzle.selectBlock(2);
  puzzle.handleControl({ kind: "block", value: 1 });
  assert.equal(puzzle.selectedBlock, null);
  CASTLE_PIECES[6].kind = "bridge";
  CASTLE_PIECES[3].kind = "roof";
  assert.deepEqual(puzzle.getPieceSize(6), { width: 3.45, height: .2, depth: .68 });
  assert.deepEqual(puzzle.getPieceSize(3), { width: .88, height: .64, depth: .88 });
  assert.equal(typeof puzzle.hasBlockAbove(1), "boolean");
  puzzle.selectedBlock = 6;
  assert.ok(puzzle.getStackPosition(1));
  puzzle.selectedBlock = 3;
  assert.ok(puzzle.getStackPosition(6));
  puzzle.returnSelectedBlock();
  puzzle.resetBlocks();
  assert.equal(puzzle.checkSolution(), false);
  puzzle.solve();
  puzzle.interact();
  puzzle.update(.4);
  puzzle.update(2);
  assert.ok(calls.includes("solved") && calls.includes("mat"));
  assert.ok(puzzle.getFocusPosition().isVector3);
  assert.ok(puzzle.getLookAtPosition().isVector3);
  assert.equal(puzzle.resolveFocusedIntersection([{ object: puzzle.blocks[0].children[0] }]).object, puzzle.blocks[0].children[0]);
  assert.equal(puzzle.getInteractionText(), null);

  const dad = new BlockConstructionPuzzle({ character: "dad" });
  dad.handleControl({ kind: "block", value: 0 });
  dad.interact();
  assert.equal(dad.placed.length, 0);
  assert.equal(typeof dad.getInteractionText(), "string");
});

test("inicialización del nivel conecta entidades, colisiones, audio y checkpoint", async () => {
  const calls = [];
  const camera = new THREE.PerspectiveCamera();
  const collisionManager = {
    previousPosition: new THREE.Vector3(), isOutsideRoom: false,
    setDoorOpen: (v) => calls.push(["door", v]), setObjectColliders: (v) => calls.push(["objects", v.length]),
    setWallColliders: (v) => calls.push(["walls", v.length]), setRoomBounds: () => {}, setDoorPassage: () => {}, setExteriorBounds: () => {},
  };
  const game = {
    playerRole: "A", character: "mum", testArea: "hallway", testMode: true, endingPreview: true,
    scene: new THREE.Scene(), camera, eventManager: new EventManager(), collisionManager,
    gameAudio: { playAction: (type) => calls.push(["audio", type]) },
    player: { focusObject: () => {}, setLookAt: () => calls.push(["look"]) },
    localJournalEntries: [], input: { isPressed: () => true }, flashlightOn: true,
    multiplayer: { initialize: () => calls.push(["multi"]), placePreviewEchoes: () => calls.push(["echoes"]) },
    entityManager: { add: () => {} }, interactionManager: { add: () => {}, setOccluders: () => {} },
    sharedState: {}, applyingSharedState: false, applySharedState: (state) => calls.push(["state", state.ending?.phase]),
    onDiaryEntriesChanged: (entries) => calls.push(["diary", entries.length]), onHallwayAction: (...args) => calls.push(args),
  };
  await initializeGameLevel(game);
  assert.ok(game.roomData && game.roomRegions.length >= 5);
  assert.equal(game.sharedState.ending.phase, "threshold");
  assert.ok(calls.some(([type]) => type === "multi"));
  const switchEntity = game.roomData.entities.find((entity) => typeof entity.press === "function" && typeof entity.setActive === "function");
  switchEntity?.onPress?.(switchEntity);
  const openable = game.roomData.entities.find((entity) => typeof entity.open === "function" && "isOpen" in entity);
  openable?.onOpenChange?.(true);
});
