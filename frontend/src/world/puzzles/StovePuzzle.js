import * as THREE from "three";
import { tInteraction, tItem } from "../../translations/index.js";
import { FocusPuzzle, mark, shadows } from "./KitchenPuzzleBase.js";

class StovePuzzle extends FocusPuzzle {
  constructor({ character, onFocus, onSolved, canSolve = null }) {
    super("kitchen-stove", { onFocus });
    this.character = character;
    this.onSolved = onSolved;
    this.canSolve = canSolve;
    this.values = [0, 0, 0, 0];
    this.solution = [3, 1, 4, 2];
    this.dials = [];
    this.flames = [];
    this.clueRevealed = false;
    if (character === "dad") this.createControls();
    else this.createFlameClue();
    shadows(this.object3D);
  }

  createControls() {
    // Reuse the four knobs already modelled on CooktopCounter. The puzzle only
    // adds a rotating indicator and a generous invisible interaction area.
    [-.92, -.3, .32, .94].forEach((x, index) => {
      const dial = new THREE.Group();
      dial.position.set(x, 2.32, 1.25);
      const interactionVolume = new THREE.Mesh(
        new THREE.BoxGeometry(.38, .38, .3),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
      );
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(.04, .15, .035),
        new THREE.MeshStandardMaterial({ color: 0x292724, roughness: .7 }),
      );
      marker.position.set(0, .1, .075);
      dial.add(interactionVolume, marker);
      mark(dial, { kind: "stove-dial", value: index });
      this.dials.push(dial);
      this.object3D.add(dial);
    });
    [[-.68, -.58], [.68, -.58], [-.68, .58], [.68, .58]].forEach(([x, z]) => {
      this.createFlame(x, z, 0, false);
    });
  }

  createFlameClue() {
    // The four flames form the clue that the other player must describe.
    const burnerPositions = [[-.68, -.58], [.68, -.58], [-.68, .58], [.68, .58]];
    burnerPositions.forEach(([x, z], index) => {
      this.createFlame(x, z, this.solution[index], false);
    });
  }

  createFlame(x, z, level, visible) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(.12, 1, 18),
      new THREE.MeshStandardMaterial({ color: 0x69b8ff, emissive: 0x1769dd, emissiveIntensity: 2.4 }),
    );
    flame.position.set(x, 2.91, z);
    this.flames.push(flame);
    this.object3D.add(flame);
    this.setFlameLevel(this.flames.length - 1, level, visible);
  }

  setFlameLevel(index, level, visible = level > 0) {
    const flame = this.flames[index];
    if (!flame) return;
    const height = .12 + level * .105;
    const width = .72 + level * .13;
    flame.scale.set(width, height, width);
    flame.position.y = 2.91 + height / 2;
    flame.visible = visible && level > 0;
  }

  revealClue() {
    if (this.character !== "mum" || this.clueRevealed) return;
    this.clueRevealed = true;
    this.flames.forEach((flame) => { flame.visible = true; });
  }

  interact() {
    if (this.character === "dad" && this.available && !this.isSolved) this.onFocus?.(this);
  }

  handleControl(control) {
    if (this.character !== "dad" || !this.available || this.isSolved || control?.kind !== "stove-dial") return;
    const index = control.value;
    this.values[index] = (this.values[index] + 1) % 5;
    this.dials[index].rotation.z = -this.values[index] * Math.PI * 2 / 5;
    this.setFlameLevel(index, this.values[index]);
    this.trySolve();
  }

  trySolve() {
    if (!this.isSolved && this.values.every((value, position) => value === this.solution[position]) && (this.canSolve?.() ?? true)) this.solve();
  }

  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.isSolved = true;
    this.values = [...this.solution];
    this.dials.forEach((dial, index) => {
      dial.rotation.z = -this.solution[index] * Math.PI * 2 / 5;
      this.setFlameLevel(index, this.solution[index]);
    });
    if (notify) this.onSolved?.();
  }

  getInteractionText() {
    if (this.character !== "dad" || !this.available || this.isSolved) return null;
    return tInteraction("examine", tItem("stove-controls"));
  }
}

export { StovePuzzle };
