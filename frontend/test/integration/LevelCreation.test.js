import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();

const { createGameWorld } = await import("../../src/world/createGameWorld.js");
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
    const level = await createGameWorld({ playerRole, ...createCallbacks() });

    assert.equal(level.character, character);
    assert.equal(level.room.name, `GameWorld-${character}`);
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

    if (character === "dad") {
      const bathroomLock = level.entities.find(({ id }) => id === "bathroom-sequence-lock");
      const chestLock = level.entities.find(({ id }) => id === "living-room-chest-lock");
      const stove = level.entities.find(({ id }) => id === "kitchen-stove");
      const dadNapkin = level.entities.find(({ id }) => id === "kitchen-napkin-blue");
      const ingredientIds = level.entities.map(({ id }) => id);
      assert.equal(bathroomLock?.password, "5274");
      assert.equal(chestLock?.password, "3816");
      assert.notEqual(bathroomLock.password, chestLock.password);
      const stoveFocus = stove.object3D.worldToLocal(stove.getFocusPosition());
      const stoveLookAt = stove.object3D.worldToLocal(stove.getLookAtPosition());
      assert.ok(stoveFocus.y > 3.5);
      assert.ok(stoveLookAt.y > 2);
      assert.ok(ingredientIds.includes("kitchen-tomatoes-2"));
      assert.ok(ingredientIds.includes("kitchen-carrots-3"));
      assert.ok(ingredientIds.includes("kitchen-cheese-2"));
      assert.equal(dadNapkin?.object3D.parent?.name, "kitchen-dad-tall-cabinet-2");
    }

    if (character === "mum") {
      const kitchenNote = level.storyNotes.find(({ id }) => id === "family-note-09");
      assert.equal(kitchenNote?.object3D.parent?.name, "kitchen-mum-tall-cabinet-1");
      assert.equal(kitchenNote.object3D.visible, true);

      const shelf = level.entities.find(({ id }) => id === "living-room-shelf-1");
      emptyState.characters.dad.puzzles["living-room-rainbow-books"] = { solved: true };
      level.livingRoom.applyLivingRoomState(emptyState);
      shelf.update(3);
      shelf.interact();
      shelf.update(3);
      const closedRotation = shelf.object3D.rotation.y;
      level.livingRoom.applyLivingRoomState(emptyState);
      assert.equal(shelf.isMechanismMoving, false);
      assert.equal(shelf.object3D.rotation.y, closedRotation);
    }

    for (const interactable of level.interactables) {
      assert.ok(interactable.object3D);
      interactable.getInteractionText?.();
    }
  });
}

test("crea la sala auxiliar y rechaza roles desconocidos", async () => {
  const livingRoom = await createGameWorld({ playerRole: "D", ...createCallbacks() });
  assert.ok(livingRoom.room);

  const iconsRoom = await createGameWorld({ playerRole: "C", ...createCallbacks() });
  assert.equal(iconsRoom.room.name, "Icon Studio");
  assert.ok(iconsRoom.room.getObjectByName("icon-studio-clock-hand"));

  await assert.rejects(() => createGameWorld({ playerRole: "X" }), /Rol de jugador no válido/);
});

test("recorre la casa resuelta y ejecuta la salida final", async () => {
  const level = await createGameWorld({ playerRole: "A", ...createCallbacks() });
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
