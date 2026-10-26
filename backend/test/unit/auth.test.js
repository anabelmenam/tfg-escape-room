import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, publicUser, verifyPassword } from "../../src/auth.js";

test("las contraseñas se almacenan con sal y se verifican de forma segura", async () => {
  const firstHash = await hashPassword("correct horse battery staple");
  const secondHash = await hashPassword("correct horse battery staple");

  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPassword("correct horse battery staple", firstHash), true);
  assert.equal(await verifyPassword("wrong password", firstHash), false);
  assert.equal(await verifyPassword("anything", "malformed"), false);
});

test("publicUser no expone credenciales ni campos internos", () => {
  const result = publicUser({
    id: "user-1",
    email: "player@example.com",
    displayName: "Player",
    role: "player",
    passwordHash: "secret",
    createdAt: new Date(),
  });

  assert.deepEqual(result, {
    id: "user-1",
    email: "player@example.com",
    displayName: "Player",
    role: "player",
  });
  assert.equal("passwordHash" in result, false);
});
