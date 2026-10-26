import assert from "node:assert/strict";
import test from "node:test";

const browserWindow = new EventTarget();
globalThis.window = browserWindow;
const { Input } = await import("../../src/game/Input.js");

test("Input registra pulsaciones, liberaciones y pérdida de foco", () => {
  const input = new Input();
  browserWindow.dispatchEvent(Object.assign(new Event("keydown"), { code: "KeyW" }));
  assert.equal(input.isPressed("KeyW"), true);

  browserWindow.dispatchEvent(Object.assign(new Event("keyup"), { code: "KeyW" }));
  assert.equal(input.isPressed("KeyW"), false);

  browserWindow.dispatchEvent(Object.assign(new Event("keydown"), { code: "KeyE" }));
  browserWindow.dispatchEvent(new Event("blur"));
  assert.equal(input.isPressed("KeyE"), false);
  input.dispose();
});

test("Input elimina sus listeners al destruirse", () => {
  const input = new Input();
  input.dispose();
  browserWindow.dispatchEvent(Object.assign(new Event("keydown"), { code: "KeyF" }));
  assert.equal(input.isPressed("KeyF"), false);
});
