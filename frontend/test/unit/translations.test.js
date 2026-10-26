import assert from "node:assert/strict";
import test from "node:test";

const values = new Map();
globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
globalThis.window = new EventTarget();
const translations = await import("../../src/translations/index.js");

test("las traducciones cambian de idioma y notifican a la interfaz", () => {
  let notified = null;
  window.addEventListener("escape-room-language-change", (event) => { notified = event.detail; }, { once: true });
  translations.setLanguage("en");
  assert.equal(translations.getLanguage(), "en");
  assert.equal(values.get("escape-room-language"), "en");
  assert.equal(notified, "en");
  assert.equal(translations.tItem("flashlight"), "flashlight");
});

test("un idioma inválido se ignora y una clave desconocida usa fallback", () => {
  translations.setLanguage("invalid");
  assert.equal(translations.getLanguage(), "en");
  assert.equal(translations.t("missing.path"), "missing.path");
  assert.equal(translations.tItem("unknown-item"), "unknown-item");
  assert.equal(translations.tInteraction("unknown-interaction"), "unknown-interaction");
  translations.setLanguage("es");
});
