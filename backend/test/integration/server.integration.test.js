import assert from "node:assert/strict";
import test, { after, before } from "node:test";

process.env.FRONTEND_ORIGIN = "https://frontend.example";
const { httpServer } = await import("../../src/server.js");

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

const request = (path, options = {}) => fetch(`${baseUrl}${path}`, {
  headers: { Origin: "https://frontend.example", "Content-Type": "application/json", ...options.headers },
  ...options,
});

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

test("registro e inicio de sesión validan los datos antes de consultar la base de datos", async () => {
  for (const path of ["/api/auth/register", "/api/auth/login"]) {
    const response = await request(path, { method: "POST", body: JSON.stringify({ email: "incorrecto", password: "123" }) });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(typeof body.error, "string");
  }
});

test("recuperación y cambio de contraseña rechazan cargas inválidas", async () => {
  const forgot = await request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: "no-es-email" }) });
  assert.equal(forgot.status, 400);
  const reset = await request("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token: "corto", password: "123" }) });
  assert.equal(reset.status, 400);
});

test("logout sin sesión limpia la cookie y finaliza sin contenido", async () => {
  const response = await request("/api/auth/logout", { method: "POST", body: "{}" });
  assert.equal(response.status, 204);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});
