import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();

const { createLevel1 } = await import("../../src/world/levels/createLevel1.js");
const { EventManager } = await import("../../src/game/EventManager.js");
const { startEndingHouseTour, updateEndingTour } = await import("../../src/game/ending/EndingTour.js");
const { startEndingExit, updateEndingExit } = await import("../../src/game/ending/EndingExit.js");

const createCallbacks = () => ({
  onSwitchPress() {},
  eventManager: new EventManager(),
  onDoorOpenChange() {},
  onDoorUnlocked() {},
  onObjectFocus() {},
  isFlashlightOn: () => true,
  isInteractHeld: () => false,
  onHallwayAction() {},
  onBedroomAction() {},
  onChildrenRoomAction() {},
  onKitchenAction() {},
  onLivingRoomAction() {},
  onBathroomAction() {},
  onStoryNoteCollected() {},
  testMode: true,
});

for (const [playerRole, character] of [["A", "mum"], ["B", "dad"]]) {
  test(`construye la casa completa para ${character}`, async () => {
    const level = await createLevel1({ playerRole, ...createCallbacks() });

    assert.equal(level.character, character);
    assert.equal(level.room.name, `Level 1-${character}`);
    assert.ok(level.room.children.length >= 6);
    assert.ok(level.entities.length > 30);
    assert.ok(level.interactables.length > 20);
    assert.ok(level.roomColliders.length > 20);
    assert.ok(level.objectColliders.length > 10);
    assert.ok(level.wallColliders.length > 10);

    const emptyState = {
      characters: { mum: { objects: {}, puzzles: {} }, dad: { objects: {}, puzzles: {} } },
      inventories: { mum: [], dad: [] },
      ending: { phase: null, holding: { mum: false, dad: false } },
    };
    level.bedroom.applyBedroomState(emptyState);
    level.hallway.applyHallwayState(emptyState);
    level.livingRoom.applyLivingRoomState(emptyState);
    level.childrenRoom.applyChildrenRoomState(emptyState);
    level.bathroom.applyBathroomState(emptyState);
    level.kitchen.applyKitchenState(emptyState);

    for (const interactable of level.interactables) {
      assert.ok(interactable.object3D);
      interactable.getInteractionText?.();
    }
  });
}

test("crea la sala auxiliar y rechaza roles desconocidos", async () => {
  const livingRoom = await createLevel1({ playerRole: "D", ...createCallbacks() });
  assert.ok(livingRoom.room);

  const iconsRoom = await createLevel1({ playerRole: "C", ...createCallbacks() });
  assert.equal(iconsRoom.room.name, "Icon Studio");
  assert.ok(iconsRoom.room.getObjectByName("icon-studio-clock-hand"));

  await assert.rejects(() => createLevel1({ playerRole: "X" }), /Rol de jugador no válido/);
});

test("recorre la casa resuelta y ejecuta la salida final", async () => {
  const level = await createLevel1({ playerRole: "A", ...createCallbacks() });
  const hiddenStates = [];
  const beats = [];
  const fades = [];
  let tourComplete = false;
  let exitStarted = false;
  let exitComplete = false;
  const game = {
    roomData: level,
    sharedState: {
      characters: { mum: { objects: {}, puzzles: {} }, dad: { objects: {}, puzzles: {} } },
      inventories: { mum: [], dad: [] },
      ending: {},
    },
    camera: new THREE.PerspectiveCamera(60, 1, .1, 100),
    multiplayer: { setCharactersHidden: (hidden) => hiddenStates.push(hidden) },
    player: { fpControls: { enabled: true } },
    collisionManager: { previousPosition: new THREE.Vector3() },
    paused: true,
    endingTour: null,
    endingCinematic: null,
  };
  game.camera.position.set(0, 5.2, 0);

  startEndingHouseTour(game, {
    onBeat: (beat) => beats.push(beat),
    onFade: (fade) => fades.push(fade),
    onComplete: () => { tourComplete = true; },
  });
  startEndingHouseTour(game);
  assert.ok(game.endingTour);
  for (let index = 0; index < 30 && game.endingTour; index += 1) updateEndingTour(game, 20);
  assert.equal(tourComplete, true);
  assert.ok(beats.length > 3);
  assert.ok(fades.includes(true));

  startEndingExit(game, () => { exitComplete = true; }, () => { exitStarted = true; });
  startEndingExit(game, () => {});
  assert.ok(game.endingCinematic);
  updateEndingExit(game, .1);
  updateEndingExit(game, 2);
  updateEndingExit(game, 2);
  updateEndingExit(game, 20);
  assert.equal(exitStarted, true);
  assert.equal(exitComplete, true);
  assert.equal(game.endingCinematic, null);
  assert.ok(hiddenStates.every(Boolean));
  updateEndingExit(game, 1);
  updateEndingTour(game, 1);
});
