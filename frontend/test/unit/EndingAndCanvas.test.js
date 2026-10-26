import assert from "node:assert/strict";
import test from "node:test";
import React, { useEffect } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();
globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.crypto ??= { randomUUID: () => "uuid" };

const useEndingSequence = (await import("../../src/components/ending/useEndingSequence.js")).default;
const GameCanvas = (await import("../../src/components/GameCanvas.jsx")).default;

const render = async (Component, props) => {
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Component, props)); });
  return renderer;
};

const makeGame = () => {
  const calls = [];
  const state = {
    characters: { mum: { objects: {} }, dad: { objects: {} } },
    ending: { phase: "threshold", holding: { mum: false, dad: false } },
  };
  return {
    calls, sharedState: state, input: { isPressed: () => true },
    applySharedState(next) { this.sharedState = next; calls.push(["state", next.ending.phase]); },
    startEndingExit(done, light) { calls.push(["exit"]); light(); done(); },
    startEndingHouseTour({ onBeat, onFade, onComplete }) { calls.push(["tour"]); onBeat(1); onFade(true); onComplete(); },
    pause() { calls.push(["pause"]); },
  };
};

test("secuencia final cubre previsualización, repetición, elección y reinicio", async () => {
  const game = makeGame();
  const socketCalls = [];
  const socket = { emit: (...args) => socketCalls.push(args) };
  const api = { current: null };
  const oldTimeout = window.setTimeout;
  window.setTimeout = (callback) => { callback(); return 1; };
  const Harness = ({ session }) => {
    const value = useEndingSequence({ session, gameRef: { current: game }, setIsPaused: (value) => game.calls.push(["paused", value]) });
    useEffect(() => { api.current = value; });
    return React.createElement("div", { active: String(value.active), phase: value.ending?.phase ?? "none" });
  };
  const screen = await render(Harness, { session: { endingPreview: true } });
  await act(async () => api.current.handleHallwayAction(game, socket, "object.interact", "other", {}));
  await act(async () => api.current.handleHallwayAction(game, socket, "object.interact", "hallway-final-threshold", { operation: "cancel" }));
  await act(async () => api.current.handleHallwayAction(game, socket, "object.interact", "hallway-final-threshold", { operation: "hold-start" }));
  api.current.reset();
  await act(async () => api.current.startEndingReplay(game));
  assert.ok(game.calls.some(([name]) => name === "tour"));
  assert.ok(socketCalls.length);
  screen.unmount();

  const normal = await render(Harness, { session: { endingPreview: false } });
  await act(async () => api.current.handleEndingChange(game, socket, { phase: "opening" }));
  api.current.reset();
  await act(async () => api.current.handleEndingChange(game, socket, { phase: "choice" }));
  await act(async () => api.current.handleEndingChange(game, socket, { phase: "complete", choice: "together" }));
  assert.ok(normal.toJSON());
  normal.unmount();
  window.setTimeout = oldTimeout;
});

test("GameCanvas representa carga, modo de prueba y espera multijugador", async () => {
  const common = {
    playerRole: "A", isAdmin: true, audioController: {}, audioSettings: { music: 1, effects: 1, footsteps: 1 },
    onAudioSettingChange() {}, mouseSensitivity: 1, onMouseSensitivityChange() {}, onExit() {}, onLanguageChange() {},
  };
  const testScreen = await render(GameCanvas, { ...common, session: { testMode: true, character: "mum", testArea: "kitchen", showIntroduction: true } });
  assert.ok(testScreen.toJSON());
  const replay = await render(GameCanvas, { ...common, session: { endingReplay: true, endingPreview: true, character: "dad", checkpoint: { hintHistory: [{ id: "h", text: "pista" }] } } });
  assert.ok(replay.toJSON());
  const online = await render(GameCanvas, { ...common, session: { roomId: "r", playerToken: "p", playerId: "one", character: "mum" } });
  assert.ok(online.toJSON());
});
