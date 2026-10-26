import assert from "node:assert/strict";
import test from "node:test";
import { GameRoom, RoomPlayer, User } from "../../src/models/index.js";

test("User valida nombre y rol sin acceder a la base de datos", async () => {
  const valid = User.build({ id: "33333333-3333-4333-8333-333333333333", displayName: "Alba", role: "player" });
  await assert.doesNotReject(() => valid.validate());

  const invalid = User.build({ id: "33333333-3333-4333-8333-333333333333", displayName: "", role: "owner" });
  await assert.rejects(() => invalid.validate(), (error) => {
    const paths = new Set(error.errors.map((entry) => entry.path));
    return paths.has("displayName") && paths.has("role");
  });
});

test("GameRoom solo acepta estados de su ciclo de vida", async () => {
  const room = GameRoom.build({ id: "11111111-1111-4111-8111-111111111111", joinCode: "ABC123", status: "finished", name: "Partida" });
  await assert.doesNotReject(() => room.validate());
  room.status = "deleted";
  await assert.rejects(() => room.validate(), /Validation error/);
});

test("RoomPlayer limita personaje y número de ranura", async () => {
  const player = RoomPlayer.build({
    id: "22222222-2222-4222-8222-222222222222",
    roomId: "11111111-1111-4111-8111-111111111111",
    userId: "33333333-3333-4333-8333-333333333333",
    reconnectToken: "44444444-4444-4444-8444-444444444444",
    character: "mum",
    slotNumber: 2,
  });
  await assert.doesNotReject(() => player.validate());
  player.character = "child";
  player.slotNumber = 4;
  await assert.rejects(() => player.validate(), (error) => error.errors.length >= 2);
});
