import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();
const { Decoration } = await import("../../src/world/objects/decoration/Decoration.js");
const { BlockConstructionPuzzle } = await import("../../src/world/puzzles/BlockConstructionPuzzle.js");
const { CASTLE_PIECES } = await import("../../src/world/puzzles/ChildrenPuzzleBase.js");
const { initializeGameLevel } = await import("../../src/game/initializeGameLevel.js");
const { EventManager } = await import("../../src/game/EventManager.js");
const { GameState } = await import("../../src/game/GameState.js");

test("Decoration configura materiales, transformaciones, visibilidad y colisión", async () => {
  const decoration = Object.create(Decoration.prototype);
  Object.assign(decoration, {
    id: "test-decoration", color: 0xff0000, roughness: .3, metalness: .7,
    castShadow: false, receiveShadow: true, texture: null, textureRepeat: { x: 1, y: 1 },
    createColliderEnabled: true, loaded: true, object3D: new THREE.Group(),
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 3), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  const ignored = new THREE.Group();
  decoration.object3D.add(mesh, ignored);
  decoration.configureModel(decoration.object3D);
  assert.equal(mesh.castShadow, false);
  assert.equal(mesh.material.roughness, .3);
  assert.ok(decoration.configureMaterials([mesh.material], null)[0]);
  assert.ok(decoration.configureMaterial(null, null).isMaterial);
  assert.ok(decoration.updateCollider().isBox3);
  assert.ok(decoration.getCollider().isBox3);
  decoration.setVisible(false);
  decoration.setPosition(new THREE.Vector3(1, 2, 3));
  decoration.setRotation({ y: 1 });
  decoration.setScale(2);
  decoration.setScale(new THREE.Vector3(1, 2, 3));
  assert.equal(decoration.object3D.visible, false);
  decoration.createColliderEnabled = false;
  assert.equal(decoration.getCollider(), null);
  decoration.loadPromise = Promise.resolve(decoration);
  assert.equal(await decoration.load(), decoration);
  assert.equal(decoration.isLoaded(), true);

  decoration.getModel = async () => new THREE.Group();
  decoration.createColliderEnabled = true;
  decoration.loaded = false;
  assert.equal(await decoration.loadModel(), decoration);
  assert.equal(decoration.loaded, true);
});

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
    scene: new THREE.Scene(), camera, gameState: new GameState(), eventManager: new EventManager(), collisionManager,
    gameAudio: { playAction: (type) => calls.push(["audio", type]) },
    player: { focusObject: () => {}, setLookAt: () => calls.push(["look"]) },
    localJournalEntries: [], input: { isPressed: () => true }, flashlightOn: true,
    multiplayer: { initialize: () => calls.push(["multi"]), placePreviewEchoes: () => calls.push(["echoes"]) },
    entityManager: { add: () => {} }, interactionManager: { setOccluders: () => {} }, interactableManager: { add: () => {} },
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
