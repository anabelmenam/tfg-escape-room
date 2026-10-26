import assert from "node:assert/strict";
import test from "node:test";

class FakeAudio extends EventTarget {
  constructor(src = "") {
    super(); this.src = src; this.paused = true; this.currentTime = 0; this.volume = 1; this.playbackRate = 1; this.readyState = 4;
  }
  play() { this.paused = false; this.playCount = (this.playCount ?? 0) + 1; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() {}
  removeAttribute(name) { if (name === "src") this.src = ""; }
  cloneNode() { return new FakeAudio(this.src); }
}

globalThis.Audio = FakeAudio;
globalThis.HTMLMediaElement = { HAVE_ENOUGH_DATA: 4 };
const { GameAudio } = await import("../../src/game/GameAudio.js");

test("GameAudio limita volúmenes y reproduce los eventos principales", () => {
  const audio = new GameAudio();
  audio.setMusicVolume(2);
  audio.setEffectsVolume(-1);
  audio.setFootstepsVolume(.5);
  assert.equal(audio.musicVolume, 1);
  assert.equal(audio.effectsVolume, 0);
  assert.equal(audio.footstepsVolume, .5);

  audio.playAction("puzzle.solved");
  audio.playPickup();
  assert.equal(audio.tracks.get("puzzleComplete").audio.playCount, 1);
  assert.equal(audio.tracks.get("itemPickup").audio.playCount, 1);
  audio.dispose();
  assert.equal(audio.tracks.size, 0);
});

test("GameAudio cambia la cadencia de pasos según el movimiento", () => {
  const audio = new GameAudio();
  audio.updateFootsteps(.1, { moving: true, running: false, crouching: false, grounded: true });
  assert.equal(audio.stepIndex, 1);
  assert.equal(audio.stepTimer, .5);
  audio.updateFootsteps(.1, { moving: true, running: false, crouching: false, grounded: true });
  assert.equal(audio.stepIndex, 1);
  audio.updateFootsteps(.1, { moving: false, running: false, crouching: false, grounded: true });
  assert.equal(audio.stepTimer, 0);
  audio.updateFootsteps(.1, { moving: true, running: true, crouching: false, grounded: true });
  assert.equal(audio.stepTimer, .32);
  audio.dispose();
});
