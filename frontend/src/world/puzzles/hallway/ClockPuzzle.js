import * as THREE from "three";
import { WallClock } from "../../objects/index.js";
import { tInteraction, tItem } from "../../../translations/index.js";
const CLOCK_SOLUTION = Object.freeze({ hour: 8, minute: 20 });

class ClockPuzzle extends WallClock {
  constructor({ character = "dad", onFocus = null, onSolved = null, ...options } = {}) {
    const isMum = character === "mum";
    const solutionSlot = CLOCK_SOLUTION.hour * 12 + CLOCK_SOLUTION.minute / 5;
    const randomSlot = isMum ? Math.floor(Math.random() * 143) : solutionSlot;
    const initialSlot = isMum && randomSlot >= solutionSlot ? randomSlot + 1 : randomSlot;

    super({ ...options, hour: Math.floor(initialSlot / 12), minute: (initialSlot % 12) * 5 });
    this.isMum = isMum;
    this.hasMinuteHand = !isMum;
    this.minutePivot.visible = this.hasMinuteHand;
    this.onFocus = onFocus;
    this.onSolved = onSolved;
    this.isSolved = false;
    this.hinge = new THREE.Group();
    this.hinge.position.set(0.62, 0, 0.08);

    const face = new THREE.Group();
    face.add(...this.object3D.children.slice());

    const backing = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 48),
      new THREE.MeshStandardMaterial({ color: 0x4a2a17, side: THREE.BackSide }),
    );
    backing.position.z = -0.01;
    face.add(backing);
    face.position.set(-0.62, 0, -0.08);
    this.hinge.add(face);
    this.object3D.add(this.hinge);
  }

  advanceHand(hand) {
    if (!this.isMum || !this.hasMinuteHand || this.isSolved || !["hour", "minute"].includes(hand)) return;

    this.setTime(this.hour + (hand === "hour" ? 1 : 0), this.minute + (hand === "minute" ? 5 : 0));

    if (this.hour === CLOCK_SOLUTION.hour && this.minute === CLOCK_SOLUTION.minute) {
      this.solve();
    }
  }

  solve({ notify = true } = {}) {
    if (this.isSolved || !this.isMum) return;

    this.hasMinuteHand = true;
    this.minutePivot.visible = true;
    this.isSolved = true;
    this.setTime(CLOCK_SOLUTION.hour, CLOCK_SOLUTION.minute);
    this.setEnabled(false);

    this.object3D.traverse((object) => {
      if (object.isMesh) {
        object.raycast = () => {};
      }
    });

    if (notify) {
      this.onSolved?.(this);
    }
  }

  update(delta) {
    this.hinge.rotation.y = THREE.MathUtils.damp(this.hinge.rotation.y, this.isSolved ? Math.PI * 0.7 : 0, 3, delta);
  }

  interact(player) {
    if (!this.hasMinuteHand) {
      if (!player?.hasSelected("clock-hand")) return;
      if (!player.inventory.remove("clock-hand")) return;

      this.hasMinuteHand = true;
      this.minutePivot.visible = true;
    }
    this.onFocus?.(this);
  }

  getInteractionText(player) {
    if (!this.hasMinuteHand) {
      return player?.hasSelected("clock-hand")
        ? tInteraction("insert", tItem("clock-hand"))
        : tInteraction("needItem", tItem("clock-hand"));
    }

    return this.isSolved ? "" : tInteraction("examine", tItem("clock"));
  }

  setFocused(focused) {
    this.focused = focused;
  }
}

export { ClockPuzzle, CLOCK_SOLUTION };
