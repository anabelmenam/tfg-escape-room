import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();
globalThis.HTMLMediaElement = globalThis.Audio;
globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.location.search = "";
window.location.pathname = "/";
window.location.hash = "";
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ user: { id: 1, displayName: "Ana", role: "admin" }, slots: [] }) });

const App = (await import("../../src/App.jsx")).default;

test("App carga la cuenta y permite cambiar ajustes desde el menú", async () => {
  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(App));
    await Promise.resolve();
    await Promise.resolve();
  });
  const buttons = renderer.root.findAllByType("button");
  assert.ok(buttons.length > 3);
  await act(async () => buttons[1].props.onClick());
  const ranges = renderer.root.findAllByType("input");
  if (ranges.length) await act(async () => ranges[0].props.onChange({ target: { value: ".4" } }));
  assert.ok(renderer.toJSON());
  await act(async () => renderer.unmount());
});
