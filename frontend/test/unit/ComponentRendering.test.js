import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();
globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.location.pathname = "/";
window.location.reload = () => {};

const render = async (Component, props = {}) => {
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Component, props)); });
  return renderer;
};

const AudioSettings = (await import("../../src/components/AudioSettings.jsx")).default;
const MouseSettings = (await import("../../src/components/MouseSettings.jsx")).default;
const LanguageSettings = (await import("../../src/components/LanguageSettings.jsx")).default;
const ControlsPanel = (await import("../../src/components/menu/ControlsPanel.jsx")).default;
const SettingsPanel = (await import("../../src/components/menu/SettingsPanel.jsx")).default;
const GameHud = (await import("../../src/components/game/GameHud.jsx")).default;
const LoadingOverlay = (await import("../../src/components/game/LoadingOverlay.jsx")).default;
const StoryOverlay = (await import("../../src/components/game/StoryOverlay.jsx")).default;
const TestModePanel = (await import("../../src/components/game/TestModePanel.jsx")).default;
const EndingOverlay = (await import("../../src/components/ending/EndingOverlay.jsx")).default;

test("ajustes de audio, ratón e idioma notifican todos los cambios", async () => {
  const calls = [];
  const audio = await render(AudioSettings, { settings: { music: .5, effects: 0, footsteps: 1 }, onChange: (...args) => calls.push(args) });
  const audioButtons = audio.root.findAllByType("button");
  await act(async () => audioButtons[0].props.onClick());
  await act(async () => audioButtons[1].props.onClick());
  const ranges = audio.root.findAllByType("input");
  await act(async () => ranges[0].props.onChange({ target: { value: ".75" } }));
  assert.ok(calls.some(([key, value]) => key === "music" && value === .75));

  const mouse = await render(MouseSettings, { sensitivity: 1, onChange: (value) => calls.push(["mouse", value]) });
  const mouseButtons = mouse.root.findAllByType("button");
  await act(async () => mouseButtons[0].props.onClick());
  await act(async () => mouseButtons[1].props.onClick());
  await act(async () => mouse.root.findByType("input").props.onChange({ target: { value: "1.7" } }));

  const language = await render(LanguageSettings, { onChange: (value) => calls.push(["language", value]) });
  await act(async () => language.root.findByType("select").props.onChange({ target: { value: "en" } }));
  assert.ok(calls.some(([key]) => key === "language"));
});

test("paneles de controles y configuración renderizan todas sus variantes", async () => {
  const normal = await render(ControlsPanel, { isAdmin: false });
  const admin = await render(ControlsPanel, { isAdmin: true });
  assert.ok(admin.root.findAllByType("kbd").length > normal.root.findAllByType("kbd").length);

  const settings = await render(SettingsPanel, {
    audioSettings: { music: .5, effects: .5, footsteps: .5 }, onAudioSettingChange() {},
    mouseSensitivity: 1, onMouseSensitivityChange() {}, onLanguageChange() {},
  });
  const tabs = settings.root.findAllByType("button").slice(0, 3);
  await act(async () => tabs[1].props.onClick());
  assert.equal(settings.root.findAllByType(MouseSettings).length, 1);
  await act(async () => tabs[2].props.onClick());
  assert.equal(settings.root.findAllByType(LanguageSettings).length, 1);
  await act(async () => tabs[0].props.onClick());
  assert.equal(settings.root.findAllByType(AudioSettings).length, 1);
});

test("HUD, carga, historia y panel de pruebas cubren sus estados", async () => {
  assert.ok((await render(GameHud, { showCrosshair: true })).toJSON());
  assert.ok((await render(GameHud, { showCrosshair: false })).toJSON());
  assert.ok((await render(LoadingOverlay)).toJSON());
  let continued = false;
  const mumStory = await render(StoryOverlay, { character: "mum", onContinue: () => { continued = true; } });
  await act(async () => mumStory.root.findByType("button").props.onClick());
  assert.equal(continued, true);
  assert.ok((await render(StoryOverlay, { character: "dad", onContinue() {} })).toJSON());
  assert.ok((await render(TestModePanel, { session: { character: "mum", testArea: "bedroom", endingPreview: false } })).toJSON());
  assert.ok((await render(TestModePanel, { session: { character: "dad", testArea: "icons", endingPreview: false } })).toJSON());
  assert.ok((await render(TestModePanel, { session: { character: "mum", testArea: "hallway", endingPreview: true } })).toJSON());
});

test("pantalla final representa elección, final conjunto y sacrificios", async () => {
  const exits = [];
  const common = { showLight: true, tourBeat: 1, tourFade: true, character: "mum", onExit: () => exits.push(true) };
  const choice = await render(EndingOverlay, { ...common, ending: { phase: "choice" } });
  await act(async () => choice.root.findByType("button").props.onClick());
  const together = await render(EndingOverlay, { ...common, showLight: false, tourBeat: null, tourFade: false, ending: { phase: "complete", choice: "together" } });
  await act(async () => together.root.findByType("button").props.onClick());
  const sacrifice = await render(EndingOverlay, { ...common, endingPreview: true, ending: { phase: "complete", choice: "sacrifice", sacrificeCharacter: "mum" } });
  const buttons = sacrifice.root.findAllByType("button");
  await act(async () => buttons[0].props.onClick());
  await act(async () => buttons[1].props.onClick());
  assert.ok((await render(EndingOverlay, { ...common, character: "dad", ending: { phase: "complete", choice: "sacrifice", sacrificeCharacter: "mum" } })).toJSON());
  assert.equal(exits.length, 3);
});
