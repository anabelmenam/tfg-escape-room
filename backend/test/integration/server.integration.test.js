import assert from "node:assert/strict";
import test, { after, before } from "node:test";

process.env.FRONTEND_ORIGIN = "https://frontend.example";
const { httpServer } = await import("../../src/server.js");
const { User, UserSession, RoomPlayer, GameRoom, GameEvent, PlayerCheckpoint, GameState } = await import("../../src/models/index.js");
const { sequelize } = await import("../../src/db.js");
const { io: createSocketClient } = await import("socket.io-client");

let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

after(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

const request = (path, options = {}) =>
  fetch(`${baseUrl}${path}`, {
    headers: { Origin: "https://frontend.example", "Content-Type": "application/json", ...options.headers },
    ...options,
  });

const originals = new Map();
const stub = (object, key, value) => {
  if (!originals.has(object)) originals.set(object, new Map());
  const entries = originals.get(object);
  if (!entries.has(key)) entries.set(key, object[key]);
  object[key] = value;
};
const restoreStubs = () => {
  for (const [object, entries] of originals) for (const [key, value] of entries) object[key] = value;
  originals.clear();
};
const authenticated = (role = "user") => {
  const user = { id: "10000000-0000-4000-8000-000000000001", email: "ana@example.com", displayName: "Ana", role };
  stub(UserSession, "findOne", async () => ({ user, expiresAt: new Date(Date.now() + 60_000) }));
  return user;
};
const authHeaders = { Cookie: "escape_room_session=test-token" };

test("health responde y aplica el origen CORS configurado", async () => {
  const response = await request("/health");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://frontend.example");
  assert.deepEqual(await response.json(), { ok: true });
});

test("las rutas privadas rechazan peticiones sin sesión", async () => {
  for (const [path, options] of [
    ["/api/auth/me", {}],
    ["/api/save-slots", {}],
    ["/api/rooms", { method: "POST", body: JSON.stringify({ slotNumber: 1, name: "Partida" }) }],
    ["/api/rooms/example", { method: "DELETE" }],
  ]) {
    const response = await request(path, options);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "AUTH_REQUIRED" });
  }
});

test("una sesión caducada se elimina y no permite acceder a rutas privadas", async (t) => {
  t.after(restoreStubs);
  let destroyed = false;
  stub(UserSession, "findOne", async () => ({
    user: { id: "expired-user", role: "user" },
    expiresAt: new Date(Date.now() - 1_000),
    destroy: async () => { destroyed = true; },
  }));
  const response = await request("/api/auth/me", { headers: authHeaders });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "AUTH_REQUIRED" });
  assert.equal(destroyed, true);
});

test("el servidor rechaza cuerpos JSON que superan el límite configurado", async () => {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "ana@example.com", password: "a".repeat(1_100_000) }),
  });
  assert.equal(response.status, 413);
});

test("registro e inicio de sesión validan los datos antes de consultar la base de datos", async () => {
  for (const path of ["/api/auth/register", "/api/auth/login"]) {
    const response = await request(path, {
      method: "POST",
      body: JSON.stringify({ email: "incorrecto", password: "123" }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(typeof body.error, "string");
  }
});

test("las entradas con patrones de inyección se rechazan antes de acceder al dominio", async () => {
  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "' OR 1=1 --", password: "password123" }),
  });
  assert.equal(login.status, 400);

  const room = await request("/api/rooms/%3Cscript%3Ealert(1)%3C%2Fscript%3E/state", {
    headers: { "X-Player-Token": "not-a-uuid" },
  });
  assert.equal(room.status, 400);
});

test("recuperación y cambio de contraseña rechazan cargas inválidas", async () => {
  const forgot = await request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "no-es-email" }),
  });
  assert.equal(forgot.status, 400);
  const reset = await request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token: "corto", password: "123" }),
  });
  assert.equal(reset.status, 400);
});

test("logout sin sesión limpia la cookie y finaliza sin contenido", async () => {
  const response = await request("/api/auth/logout", { method: "POST", body: "{}" });
  assert.equal(response.status, 204);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});

test("registro cubre correo repetido y creación correcta", async (t) => {
  t.after(restoreStubs);
  stub(User, "findOne", async () => ({ id: "existing" }));
  let response = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ displayName: "Ana", email: "ana@example.com", password: "password123" }) });
  assert.equal(response.status, 409);
  stub(User, "findOne", async () => null);
  const created = { id: "10000000-0000-4000-8000-000000000002", displayName: "Ana", email: "ana@example.com", role: "user" };
  stub(User, "create", async () => created);
  stub(UserSession, "create", async () => ({}));
  response = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ displayName: "Ana", email: "ANA@example.com", password: "password123" }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).user.email, "ana@example.com");
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /escape_room_session=/);
  assert.match(cookie, /HttpOnly/i);
  if (process.env.NODE_ENV === "production") {
    assert.match(cookie, /SameSite=None/i);
    assert.match(cookie, /Secure/i);
  } else {
    assert.match(cookie, /SameSite=Lax/i);
  }
  assert.match(cookie, /Path=\//i);
  assert.equal(cookie.includes("password123"), false);
});

test("login rechaza credenciales incorrectas y crea sesión con las válidas", async (t) => {
  t.after(restoreStubs);
  stub(User, "findOne", async () => null);
  let response = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "ana@example.com", password: "password123" }) });
  assert.equal(response.status, 401);
  const { hashPassword } = await import("../../src/auth.js");
  const user = { id: "10000000-0000-4000-8000-000000000003", email: "ana@example.com", displayName: "Ana", role: "user", passwordHash: await hashPassword("password123") };
  stub(User, "findOne", async () => user);
  stub(UserSession, "create", async () => ({}));
  response = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "ana@example.com", password: "password123" }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.id, user.id);
});

test("sesión autenticada permite consultar perfil, usuarios y partidas guardadas", async (t) => {
  t.after(restoreStubs);
  const user = authenticated("admin");
  stub(User, "findAll", async () => [user]);
  stub(RoomPlayer, "findAll", async () => [{
    id: "p1", roomId: "r1", reconnectToken: "token", character: "mum", slotNumber: 1,
    room: { creatorPlayerId: "p1", joinCode: "ABCDEF", name: "Partida", status: "playing", playTimeSeconds: 20, playStartedAt: null, lastActivityAt: new Date() },
    checkpoint: { position: { x: 1, y: 2, z: 3 }, rotationY: 1, roomKey: "hall", diaryEntries: [], hintHistory: [] },
  }]);
  let response = await request("/api/auth/me", { headers: authHeaders });
  assert.equal(response.status, 200);
  response = await request("/api/admin/users", { headers: authHeaders });
  assert.equal((await response.json()).users.length, 1);
  response = await request("/api/save-slots", { headers: authHeaders });
  const slots = (await response.json()).slots;
  assert.equal(slots[0].isCreator, true);
  assert.equal(slots[0].checkpoint.roomKey, "hall");
});

test("un usuario normal no puede consultar la administración", async (t) => {
  t.after(restoreStubs);
  authenticated("user");
  const response = await request("/api/admin/users", { headers: authHeaders });
  assert.equal(response.status, 403);
});

test("un usuario autenticado no puede eliminar una partida ajena", async (t) => {
  t.after(restoreStubs);
  authenticated("user");
  stub(RoomPlayer, "findOne", async () => null);
  const response = await request("/api/rooms/90000000-0000-4000-8000-000000000001", {
    method: "DELETE",
    headers: authHeaders,
  });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "ROOM_NOT_FOUND" });
});

test("estado de sala valida el jugador y devuelve la instantánea", async (t) => {
  t.after(restoreStubs);
  const roomId = "20000000-0000-4000-8000-000000000001";
  const token = "30000000-0000-4000-8000-000000000001";
  stub(RoomPlayer, "findOne", async () => null);
  let response = await request(`/api/rooms/${roomId}/state`, { headers: { "X-Player-Token": token } });
  assert.equal(response.status, 401);
  stub(RoomPlayer, "findOne", async () => ({ id: "p1", roomId, userId: "u1", character: "mum", user: { displayName: "Ana" } }));
  stub(GameState, "findByPk", async () => ({ revision: 3, state: { ready: true } }));
  response = await request(`/api/rooms/${roomId}/state`, { headers: { "X-Player-Token": token } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).revision, 3);
});

test("una ruta inexistente responde 404", async () => {
  const response = await request("/api/no-existe");
  assert.equal(response.status, 404);
});

test("socket autentica al jugador y procesa lobby, acciones, movimiento y metadatos", async (t) => {
  t.after(restoreStubs);
  const roomId = "40000000-0000-4000-8000-000000000001";
  const playerToken = "50000000-0000-4000-8000-000000000001";
  const playerRecord = { id: "p1", roomId, userId: "u1", character: "mum", connected: true, user: { displayName: "Ana" } };
  const players = [
    { ...playerRecord, user: { displayName: "Ana" } },
    { id: "p2", roomId, userId: "u2", character: "dad", connected: true, user: { displayName: "Luis" } },
  ];
  const room = {
    id: roomId, creatorPlayerId: "p1", status: "playing", playTimeSeconds: 0, playStartedAt: new Date(),
    update: async (patch) => Object.assign(room, patch),
  };
  const stateRow = {
    revision: 0,
    state: { characters: { mum: { objects: {}, puzzles: {} }, dad: { objects: {}, puzzles: {} } }, inventories: { mum: [], dad: [] }, journalEntries: [], ending: { phase: "locked", holding: { mum: false, dad: false }, choice: null, sacrificeCharacter: null } },
    update: async (patch) => Object.assign(stateRow, patch),
  };
  stub(RoomPlayer, "findOne", async () => playerRecord);
  stub(RoomPlayer, "findAll", async () => players);
  stub(RoomPlayer, "count", async () => 2);
  stub(RoomPlayer, "update", async () => [1]);
  stub(GameRoom, "findByPk", async () => room);
  stub(GameRoom, "update", async () => [1]);
  stub(GameState, "findByPk", async () => stateRow);
  stub(GameEvent, "findOne", async () => null);
  stub(GameEvent, "create", async () => ({}));
  stub(PlayerCheckpoint, "findByPk", async () => null);
  stub(PlayerCheckpoint, "update", async () => [1]);
  stub(sequelize, "transaction", async (work) => work({ LOCK: { UPDATE: "UPDATE" } }));

  const socket = createSocketClient(baseUrl, { transports: ["websocket"], forceNew: true, auth: { roomId, playerToken } });
  t.after(() => socket.disconnect());
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  const emitAck = (event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));
  let answer = await emitAck("lobby:select-character", { character: "mum" });
  assert.equal(answer.ok, true);
  answer = await new Promise((resolve) => socket.emit("lobby:start", resolve));
  assert.equal(answer.ok, true);
  answer = await emitAck("game:action", {
    actionId: "60000000-0000-4000-8000-000000000001", type: "item.pickup", targetId: "test-item", payload: {},
  });
  assert.equal(answer.ok, true);
  answer = await emitAck("game:action", {
    actionId: "no-es-un-uuid", type: "accion.inventada", targetId: "x".repeat(101), payload: {},
  });
  assert.equal(answer.ok, false);
  assert.match(answer.error, /Invalid uuid|invalid_string/i);
  socket.emit("player:movement", { position: { x: 1, y: 2, z: 3 }, rotationY: 0, roomKey: "hallway" });
  socket.emit("player:checkpoint-meta", { diaryEntries: ["entry"], hintHistory: [{ id: "hint", text: "Pista" }] });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(stateRow.state.inventories.mum.includes("test-item"), true);
  socket.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 850));
});

test("socket rechaza credenciales sin jugador", async (t) => {
  t.after(restoreStubs);
  stub(RoomPlayer, "findOne", async () => null);
  const socket = createSocketClient(baseUrl, {
    transports: ["websocket"], forceNew: true,
    auth: { roomId: "70000000-0000-4000-8000-000000000001", playerToken: "80000000-0000-4000-8000-000000000001" },
  });
  t.after(() => socket.disconnect());
  const error = await new Promise((resolve) => socket.once("connect_error", resolve));
  assert.match(error.message, /no válida/);
});
