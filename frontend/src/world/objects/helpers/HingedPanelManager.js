import * as THREE from "three";
import { tInteraction, tItem } from "../../../translations/index.js";
import { MechanicalAudio } from "./MechanicalAudio.js";

class HingedPanelManager {
  constructor({ ownerId, speed = 7 } = {}) {
    this.ownerId = ownerId;
    this.speed = speed;
    this.panels = [];
    this.states = [];
    this.interactables = [];
    this.audio = new MechanicalAudio({ kind: "cabinetDoor", volume: 0.32 });
  }

  register({ panel, index = this.panels.length, axis = "y", openRotation = Math.PI / 2, item = "door" }) {
    const closedRotation = panel.rotation[axis];
    this.panels[index] = panel;
    this.states[index] = {
      axis,
      closedRotation,
      openRotation,
      targetRotation: closedRotation,
      isOpen: false,
    };
    this.interactables[index] = {
      id: `${this.ownerId}-panel-${index}`,
      object3D: panel,
      enabled: true,
      interact: () => this.toggle(index),
      getInteractionText: () =>
        this.states[index].isOpen
          ? tInteraction("close", tItem(item))
          : tInteraction("open", tItem(item)),
    };
    return panel;
  }

  toggle(index) {
    const state = this.states[index];
    if (!state) return false;
    state.isOpen = !state.isOpen;
    state.targetRotation = state.isOpen ? state.openRotation : state.closedRotation;
    this.audio.play(state.isOpen ? "open" : "close", 4.6 / this.speed);
    return true;
  }

  getInteractables() {
    return this.interactables.filter(Boolean);
  }

  setAudioListener(listener, anchor) {
    this.audio.setAudioListener(listener, anchor);
  }

  dispose() {
    this.audio.dispose();
  }

  update(deltaTime) {
    this.panels.forEach((panel, index) => {
      const state = this.states[index];
      if (!panel || !state) return;
      panel.rotation[state.axis] = THREE.MathUtils.damp(
        panel.rotation[state.axis],
        state.targetRotation,
        this.speed,
        deltaTime,
      );
    });
  }
}

export { HingedPanelManager };
