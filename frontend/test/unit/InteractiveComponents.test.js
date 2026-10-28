import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();
globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.location.pathname = "/";
window.location.hash = "";
window.location.replace = () => {};
window.history = { replaceState() {} };
Object.defineProperty(globalThis.navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } });

const render = async (Component, props = {}) => {
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Component, props)); });
  return renderer;
};
const click = async (node, event = {}) => act(async () => node.props.onClick?.(event));
const textOf = (node) => node.children.flat(Infinity).filter((part) => typeof part === "string").join("");
const buttonMatching = (renderer, pattern) => renderer.root.findAllByType("button").find((button) => pattern.test(textOf(button)));
const response = (body = {}, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => body });

const AccountAccess = (await import("../../src/components/AccountAccess.jsx")).default;
const Lobby = (await import("../../src/components/Lobby.jsx")).default;
const PauseOverlay = (await import("../../src/components/game/PauseOverlay.jsx")).default;
const RoomLobby = (await import("../../src/components/RoomLobby.jsx")).default;

test("acceso de cuenta recorre registro, recuperación, errores y autenticación", async () => {
  const authenticated = [];
  globalThis.fetch = async (url) => response(url.includes("register") ? { user: { id: 1, displayName: "Ana" } } : { user: { id: 2 } });
  const screen = await render(AccountAccess, { onAuthenticated: (user) => authenticated.push(user) });

  await click(screen.root.findAllByType("button")[1]);
  const registerInputs = screen.root.findAllByType("input");
  await act(async () => registerInputs[0].props.onChange({ target: { value: "Ana" } }));
  await act(async () => registerInputs[1].props.onChange({ target: { value: "ana@example.com" } }));
  await act(async () => registerInputs[2].props.onChange({ target: { value: "password1" } }));
  await act(async () => screen.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.equal(authenticated[0].displayName, "Ana");

  await click(screen.root.findAllByType("button")[0]);
  const forgot = buttonMatching(screen, /olvid|forgot/i);
  await click(forgot);
  await act(async () => screen.root.findByType("input").props.onChange({ target: { value: "ana@example.com" } }));
  await act(async () => screen.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.ok(screen.root.findAllByProps({ role: "status" }).length);

  globalThis.fetch = async () => response({ error: "UNKNOWN_ERROR" }, { ok: false, status: 400 });
  const failing = await render(AccountAccess, { onAuthenticated() {} });
  await act(async () => failing.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.ok(failing.root.findAllByProps({ role: "alert" }).length);
});

test("restablecimiento de contraseña valida coincidencia y completa el proceso", async () => {
  window.location.search = "?resetToken=valid-token";
  globalThis.fetch = async () => response({});
  const screen = await render(AccountAccess, { onAuthenticated() {} });
  const inputs = screen.root.findAllByType("input");
  await act(async () => inputs[0].props.onChange({ target: { value: "password1" } }));
  await act(async () => inputs[1].props.onChange({ target: { value: "different" } }));
  await act(async () => screen.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.ok(screen.root.findAllByProps({ role: "alert" }).length);
  await act(async () => inputs[1].props.onChange({ target: { value: "password1" } }));
  await act(async () => screen.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.equal(screen.root.findAllByType("form").length, 0);
  window.location.search = "";
});

test("menú principal permite abrir ajustes, controles, pruebas y partidas", async () => {
  const entries = [];
  globalThis.fetch = async () => response({ slots: [] });
  const common = {
    account: { role: "admin", displayName: "Admin" }, onLogout() {}, onEnterLobby: (value) => entries.push(value),
    audioSettings: { music: 1, effects: 1, footsteps: 1 }, onAudioSettingChange() {},
    mouseSensitivity: 1, onMouseSensitivityChange() {}, onLanguageChange() {},
  };
  const screen = await render(Lobby, common);
  const initialButtons = screen.root.findAllByType("button");
  await click(initialButtons[1]);
  await click(screen.root.findAllByType("button")[0]);
  await click(screen.root.findAllByType("button")[2]);
  assert.ok(screen.toJSON());
  await click(screen.root.findAllByType("button")[0]);
  await click(screen.root.findAllByType("button")[3]);
  const testButtons = screen.root.findAllByType("button");
  assert.equal(testButtons.length, 5);
  await click(testButtons[1]);
  await click(testButtons.at(-1));
  assert.deepEqual(entries, [
    { testMode: true, adminTour: true, character: "mum", testArea: "bedroom" },
    { testMode: true, character: "dad", testArea: "hallway", endingPreview: true, endingReplay: true },
  ]);
  await click(testButtons[0]);
  await click(screen.root.findAllByType("button")[0]);
  await act(async () => Promise.resolve());
  assert.ok(screen.toJSON());
});

test("pausa cubre diario, pistas, controles, ajustes y acciones", async () => {
  const calls = [];
  const props = {
    setView: (view) => calls.push(view), diaryEntries: ["family-note-01", "family-note-02"],
    hintHistory: [{ id: 1, text: "Busca detrás del cuadro" }], isAdmin: true,
    onRequestHint: () => calls.push("hint"), onResume: () => calls.push("resume"), onExit: () => calls.push("exit"),
    audioSettings: { music: 1, effects: .5, footsteps: .2 }, onAudioSettingChange() {},
    mouseSensitivity: 1, onMouseSensitivityChange() {}, onLanguageChange() {},
  };
  const menu = await render(PauseOverlay, { ...props, view: "menu" });
  for (const button of menu.root.findAllByType("button")) {
    if (button.props.onPointerDown) await act(async () => button.props.onPointerDown());
    else await click(button);
  }
  const diary = await render(PauseOverlay, { ...props, view: "diary" });
  const enabledDiaryButtons = diary.root.findAllByType("button").filter((button) => !button.props.disabled);
  await click(enabledDiaryButtons.at(-1));
  assert.ok((await render(PauseOverlay, { ...props, view: "hints" })).toJSON());
  assert.ok((await render(PauseOverlay, { ...props, view: "controls" })).toJSON());
  assert.ok((await render(PauseOverlay, { ...props, view: "settings" })).toJSON());
  assert.ok(calls.includes("resume") && calls.includes("hint") && calls.includes("exit"));
});

test("sala de espera representa creador e invitado y permite seleccionar", async () => {
  const base = { roomId: "room", playerToken: "token", playerId: "p1", joinCode: "ABC123" };
  const creator = await render(RoomLobby, { session: { ...base, isCreator: true }, onStart() {}, onBack() {} });
  const buttons = creator.root.findAllByType("button");
  await click(buttons[0]);
  await click(buttons[1]);
  await click(buttons[2]);
  await click(buttons.at(-1));
  creator.unmount();
  const guest = await render(RoomLobby, { session: { ...base, isCreator: false }, onStart() {}, onBack() {} });
  assert.ok(guest.toJSON());
  guest.unmount();
});
