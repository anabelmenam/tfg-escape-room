import * as THREE from "three";
import { WallClock } from "../objects/decoration/WallClock.js";

const CLOCK_SOLUTION = Object.freeze({ hour: 8, minute: 20 });

class ClockPuzzle extends WallClock {
  constructor({ timeline = "present", onFocus = null, onSolved = null, ...options } = {}) {
    const isPast = timeline === "past";
    const solutionSlot = CLOCK_SOLUTION.hour * 12 + CLOCK_SOLUTION.minute / 5;
    const randomSlot = isPast ? Math.floor(Math.random() * 143) : solutionSlot;
    const initialSlot = isPast && randomSlot >= solutionSlot ? randomSlot + 1 : randomSlot;
    super({ ...options, hour: Math.floor(initialSlot / 12), minute: (initialSlot % 12) * 5 });
    this.isPast = isPast;
    this.onFocus = onFocus;
    this.onSolved = onSolved;
    this.isSolved = false;
  }

  advanceHand(hand) {
    if (!this.isPast || this.isSolved || !["hour", "minute"].includes(hand)) return;
    this.setTime(this.hour + (hand === "hour" ? 1 : 0), this.minute + (hand === "minute" ? 5 : 0));
    if (this.hour === CLOCK_SOLUTION.hour && this.minute === CLOCK_SOLUTION.minute) {
      this.isSolved = true;
      this.hub.material = new THREE.MeshStandardMaterial({ color: 0x4cba74, emissive: 0x164523 });
      this.onSolved?.(this);
    }
    this.updateFocusHint();
  }

  interact() {
    this.onFocus?.(this);
  }

  getInteractionText() {
    return this.isSolved ? "[E] Examinar reloj · Puzle resuelto" : "[E] Examinar reloj de pared";
  }

  setFocused(focused) {
    this.focused = focused;
    const hint = globalThis.document?.getElementById("focus-exit-hint");
    if (!hint) return;
    if (focused) {
      this.previousHint = hint.textContent;
      this.updateFocusHint();
    } else {
      hint.textContent = this.previousHint;
    }
  }

  updateFocusHint() {
    if (!this.focused) return;
    const hint = globalThis.document?.getElementById("focus-exit-hint");
    if (!hint) return;
    hint.textContent = this.isSolved ? "¡Hora correcta! Puzle resuelto. · [E] Salir" : "[E] Salir";
  }
}

export { ClockPuzzle, CLOCK_SOLUTION };
