import * as THREE from "three";
import { tInteraction, tItem } from "../../translations/index.js";
import { FocusPuzzle, mark, shadows } from "./KitchenPuzzleBase.js";

class OvenControlPuzzle extends FocusPuzzle {
  constructor({ character, onFocus, onSolved, canSolve = null }) {
    super("kitchen-oven", { onFocus });
    this.character = character;
    this.onSolved = onSolved;
    this.canSolve = canSolve;
    this.values = [0, 0];
    this.solution = [3, 2];
    this.dials = [];
    this.clueRevealed = false;
    this.createControls();
    shadows(this.object3D);
  }
  createControls() {
    this.object3D.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(2.46, 0.49, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x454b4b, metalness: 0.55, roughness: 0.4 }),
      ),
    );
    [-0.88, 0.88].forEach((x, index) => {
      const dial = new THREE.Group();
      dial.position.set(x, 0, 0.1);
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.12, 28),
        new THREE.MeshStandardMaterial({ color: 0xb8b4aa, metalness: 0.78, roughness: 0.24 }),
      );
      knob.rotation.x = Math.PI / 2;
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.09, 0.025),
        new THREE.MeshStandardMaterial({ color: 0x292b29, roughness: 0.55 }),
      );
      marker.position.set(0, 0.09, 0.075);
      dial.add(knob, marker);
      mark(dial, { kind: "oven-dial", value: index });
      this.dials.push(dial);
      this.object3D.add(dial);
    });
    this.displayCanvas = document.createElement("canvas");
    this.displayCanvas.width = 768;
    this.displayCanvas.height = 256;
    this.texture = new THREE.CanvasTexture(this.displayCanvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.displayMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.55,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const display = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.34), this.displayMaterial);
    display.position.z = 0.06;
    this.object3D.add(display);
    this.updateDisplay();
  }
  updateDisplay() {
    if (!this.displayCanvas) return;
    const context = this.displayCanvas.getContext("2d");
    context.fillStyle = "#162520";
    context.fillRect(0, 0, 768, 256);
    context.textAlign = "center";
    context.fillStyle = "#a5c5ae";
    context.font = "36px sans-serif";
    context.fillText("TEMPERATURA", 190, 62);
    context.fillText("TEMPORIZADOR", 570, 62);
    if (this.character === "mum" || this.clueRevealed) {
      const values = this.character === "dad" ? this.solution : this.values;
      context.fillStyle = "#e1efdf";
      context.font = "bold 68px sans-serif";
      context.fillText(`${[120, 140, 160, 180, 200][values[0]]} °C`, 190, 164);
      context.fillText(`${[15, 25, 35, 45, 55][values[1]]} min`, 570, 164);
    }
    this.texture.needsUpdate = true;
  }
  revealClue() {
    if (this.character !== "dad" || this.clueRevealed) return;
    this.clueRevealed = true;
    this.displayMaterial.emissive.setHex(0x78b98d);
    this.displayMaterial.emissiveIntensity = 0.7;
    this.dials.forEach((dial, index) => {
      dial.rotation.z = -this.solution[index] * Math.PI * 0.4;
    });
    this.updateDisplay();
    this.setAvailable(true);
  }
  interact() {
    if (this.available && !this.isSolved) this.onFocus?.(this);
  }
  handleControl(control) {
    if (this.character !== "mum" || !this.available || this.isSolved || control?.kind !== "oven-dial") return;
    const index = control.value;
    this.values[index] = (this.values[index] + 1) % 5;
    this.dials[index].rotation.z = -this.values[index] * Math.PI * 0.4;
    this.updateDisplay();
    this.trySolve();
  }
  trySolve() {
    if (
      !this.isSolved &&
      this.values.every((value, position) => value === this.solution[position]) &&
      (this.canSolve?.() ?? true)
    )
      this.solve();
  }
  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.isSolved = true;
    this.values = [...this.solution];
    this.dials.forEach((dial, index) => {
      dial.rotation.z = -this.solution[index] * Math.PI * 0.4;
    });
    this.updateDisplay();
    if (notify) this.onSolved?.();
  }
  getInteractionText() {
    if (!this.available || this.isSolved) return null;
    return tInteraction("examine", tItem(this.character === "dad" ? "oven-indicator" : "oven-controls"));
  }
  getFocusPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(
      this.character === "dad" ? new THREE.Vector3(0, 1.8, 3.5) : new THREE.Vector3(0, 0.3, 3),
    );
  }
  getLookAtPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3());
  }
  dispose() {
    this.texture?.dispose();
  }
}

export { OvenControlPuzzle };
