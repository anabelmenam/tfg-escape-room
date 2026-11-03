import assert from "node:assert/strict";
import test from "node:test";
import { sequelize } from "../../src/db.js";
import { GameEvent, GameRoom, GameState, PlayerCheckpoint, RoomPlayer } from "../../src/models/index.js";
import {
  applyAction,
  createRoom,
  ensureFreeSlot,
  getLobbyState,
  getPlayerFromToken,
  getSnapshot,
  joinRoom,
  saveCheckpoint,
  selectCharacter,
  startGame,
  syncRoomPlayTimer,
  updateCheckpoint,
} from "../../src/server.js";
import { createInitialState } from "../../src/state.js";

const originals = new Map();
const stub = (object, key, value) => {
  if (!originals.has(object)) originals.set(object, new Map());
  if (!originals.get(object).has(key)) originals.get(object).set(key, object[key]);
  object[key] = value;
};
const restore = () => {
  for (const [object, entries] of originals) for (const [key, value] of entries) object[key] = value;
  originals.clear();
};
const transaction = { LOCK: { UPDATE: "UPDATE" } };
const stubTransactions = () => stub(sequelize, "transaction", async (work) => work(transaction));

test("timer starts, stops and handles a missing room", async (t) => {
  t.after(restore);
  stub(GameRoom, "findByPk", async () => null);
  assert.equal((await syncRoomPlayTimer("missing")).running, false);
  const updates = [];
  const room = { status: "playing", playTimeSeconds: 3, playStartedAt: null, update: async (patch) => { updates.push(patch); Object.assign(room, patch); } };
  stub(GameRoom, "findByPk", async () => room);
  stub(RoomPlayer, "count", async () => 2);
  assert.equal((await syncRoomPlayTimer("room")).running, true);
  room.playStartedAt = new Date(Date.now() - 2_100);
  stub(RoomPlayer, "count", async () => 1);
  const stopped = await syncRoomPlayTimer("room");
  assert.equal(stopped.running, false);
  assert.ok(updates.length >= 2);
});

test("checkpoint updates, creates, retries and throttles writes", async (t) => {
  t.after(restore);
  let updates = 0;
  stub(PlayerCheckpoint, "update", async () => [updates++ ? 1 : 0]);
  stub(PlayerCheckpoint, "create", async () => { throw new Error("race"); });
  await updateCheckpoint("p1", "r1", { roomKey: "hall" });
  stub(PlayerCheckpoint, "update", async () => [0]);
  stub(PlayerCheckpoint, "create", async () => ({}));
  await updateCheckpoint("p2", "r1", { roomKey: "bedroom" });
  let roomUpdates = 0;
  stub(GameRoom, "update", async () => { roomUpdates += 1; });
  stub(PlayerCheckpoint, "update", async () => [1]);
  const movement = { position: { x: 0, y: 0, z: 0 }, rotationY: 0 };
  await saveCheckpoint("r1", "p3", movement);
  await saveCheckpoint("r1", "p3", movement);
  await saveCheckpoint("r1", "p3", movement, true);
  assert.equal(roomUpdates, 2);
});

test("slot, player, snapshot and lobby helpers cover found and missing data", async (t) => {
  t.after(restore);
  stub(RoomPlayer, "findOne", async () => ({ id: "occupied" }));
  await assert.rejects(ensureFreeSlot("u", 1, transaction), /SAVE_SLOT_OCCUPIED/);
  stub(RoomPlayer, "findOne", async () => null);
  await ensureFreeSlot("u", 1, transaction);
  assert.equal(await getPlayerFromToken("r", "bad"), null);
  stub(RoomPlayer, "findOne", async () => ({ id: "p", roomId: "r", userId: "u", character: "mum", user: { displayName: "Ana" } }));
  assert.equal((await getPlayerFromToken("r", "token")).displayName, "Ana");
  stub(GameState, "findByPk", async () => null);
  await assert.rejects(getSnapshot("r"), /no existe/);
  stub(GameState, "findByPk", async () => ({ revision: 1, state: {} }));
  assert.equal((await getSnapshot("r")).revision, 1);
  stub(RoomPlayer, "findAll", async () => [{ id: "p", character: "mum", connected: true, user: { displayName: "Ana" } }]);
  assert.deepEqual(await getLobbyState("r"), { players: [{ id: "p", character: "mum", connected: true, displayName: "Ana" }] });
});

test("applyAction is idempotent and persists a new valid action", async (t) => {
  t.after(restore);
  stubTransactions();
  const row = { revision: 2, state: createInitialState(), update: async (patch) => Object.assign(row, patch) };
  stub(GameState, "findByPk", async () => row);
  stub(GameEvent, "findOne", async () => ({ id: "already" }));
  const player = { id: "p", character: "mum" };
  let result = await applyAction("r", player, { actionId: "a", type: "item.pickup", targetId: "item", payload: {} });
  assert.equal(result.revision, 2);
  stub(GameEvent, "findOne", async () => null);
  stub(GameEvent, "create", async () => ({}));
  stub(GameRoom, "update", async () => ({}));
  result = await applyAction("r", player, { actionId: "b", type: "item.pickup", targetId: "item", payload: {} });
  assert.equal(result.revision, 3);
  assert.deepEqual(result.state.inventories.mum, ["item"]);
  stub(GameState, "findByPk", async () => null);
  await assert.rejects(applyAction("r", player, { actionId: "c", type: "item.pickup", targetId: "x", payload: {} }), /no existe/);
});

test("createRoom persists its room, player and initial state", async (t) => {
  t.after(restore);
  stubTransactions();
  stub(RoomPlayer, "findOne", async () => null);
  const room = { update: async (patch) => Object.assign(room, patch) };
  stub(GameRoom, "create", async () => room);
  stub(RoomPlayer, "create", async () => ({}));
  stub(GameState, "create", async () => ({}));
  const created = await createRoom({ id: "u" }, { slotNumber: 1, name: "Partida" });
  assert.equal(created.isCreator, true);
  assert.equal(created.joinCode.length, 6);
});

test("joinRoom covers missing, closed, duplicate, full and successful rooms", async (t) => {
  t.after(restore);
  stubTransactions();
  const user = { id: "u" };
  stub(GameRoom, "findOne", async () => null);
  await assert.rejects(joinRoom("ABCDEF", user, { slotNumber: 1 }), /ROOM_NOT_FOUND/);
  stub(GameRoom, "findOne", async () => ({ id: "r", status: "playing" }));
  await assert.rejects(joinRoom("ABCDEF", user, { slotNumber: 1 }), /ROOM_NOT_JOINABLE/);
  const room = { id: "r", joinCode: "ABCDEF", status: "waiting" };
  stub(GameRoom, "findOne", async () => room);
  let calls = 0;
  stub(RoomPlayer, "findOne", async () => (++calls === 1 ? null : { id: "existing" }));
  await assert.rejects(joinRoom("ABCDEF", user, { slotNumber: 1 }), /ALREADY_IN_ROOM/);
  stub(RoomPlayer, "findOne", async () => null);
  stub(RoomPlayer, "count", async () => 2);
  await assert.rejects(joinRoom("ABCDEF", user, { slotNumber: 1 }), /ROOM_FULL/);
  stub(RoomPlayer, "count", async () => 1);
  stub(RoomPlayer, "create", async () => ({}));
  assert.equal((await joinRoom("abcdef", user, { slotNumber: 1 })).isCreator, false);
});

test("character selection and game start enforce lobby rules", async (t) => {
  t.after(restore);
  stubTransactions();
  stub(RoomPlayer, "findAll", async () => [{ id: "other", character: "mum", connected: true, user: { displayName: "B" } }]);
  await assert.rejects(selectCharacter("r", "me", "mum"), /elegido/);
  stub(RoomPlayer, "update", async () => ({}));
  stub(RoomPlayer, "findAll", async () => [{ id: "me", character: "dad", connected: true, user: { displayName: "A" } }]);
  assert.equal((await selectCharacter("r", "me", "dad")).players.length, 1);
  stub(GameRoom, "findByPk", async () => null);
  await assert.rejects(startGame("r", "me"), /no existe/);
  const room = { creatorPlayerId: "creator", status: "waiting", playStartedAt: null, update: async (patch) => Object.assign(room, patch) };
  stub(GameRoom, "findByPk", async () => room);
  await assert.rejects(startGame("r", "other"), /Solo quien/);
  stub(RoomPlayer, "findAll", async () => [{ id: "creator", character: "mum", connected: true, user: { displayName: "A" } }]);
  await assert.rejects(startGame("r", "creator"), /elegir/);
  stub(RoomPlayer, "findAll", async () => [
    { id: "creator", character: "mum", connected: true, user: { displayName: "A" } },
    { id: "other", character: "dad", connected: false, user: { displayName: "B" } },
  ]);
  await assert.rejects(startGame("r", "creator"), /conectados/);
  stub(RoomPlayer, "findAll", async () => [
    { id: "creator", character: "mum", connected: true, user: { displayName: "A" } },
    { id: "other", character: "dad", connected: true, user: { displayName: "B" } },
  ]);
  stub(RoomPlayer, "count", async () => 2);
  const lobby = await startGame("r", "creator");
  assert.equal(lobby.players.length, 2);
  assert.equal(room.status, "playing");
});
