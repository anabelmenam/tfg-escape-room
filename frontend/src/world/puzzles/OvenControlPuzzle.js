import * as THREE from "three";
import { tInteraction, tItem } from "../../translations/index.js";
import { FocusPuzzle, mark, shadows } from "./KitchenPuzzleBase.js";

class OvenControlPuzzle extends FocusPuzzle {
  constructor({ character, onFocus, onSolved, canSolve = null }) {
    super("kitchen-oven", { onFocus }); this.character = character; this.onSolved = onSolved; this.canSolve = canSolve; this.values = [0, 0]; this.solution = [3, 2]; this.dials = [];
    this.clueRevealed = false;
    if (character === "mum") this.createPresentControls();
    else {
      this.createPastClue();
      this.object3D.visible = false;
    }
    shadows(this.object3D);
  }
  createPastClue() {
    const metal = new THREE.MeshStandardMaterial({ color: 0x514b45, metalness: .68, roughness: .48 });
    this.object3D.add(new THREE.Mesh(new THREE.BoxGeometry(2.46, .49, .1), metal));
    const valueCanvas = document.createElement("canvas"); valueCanvas.width = 768; valueCanvas.height = 256;
    const valueContext = valueCanvas.getContext("2d");
    valueContext.fillStyle = "#101714"; valueContext.fillRect(0, 0, 768, 256);
    valueContext.strokeStyle = "#65716b"; valueContext.lineWidth = 10; valueContext.strokeRect(10, 10, 748, 236);
    valueContext.textAlign = "center"; valueContext.fillStyle = "#e5ffe8";
    valueContext.font = "bold 78px sans-serif"; valueContext.fillText("180 °C", 205, 153); valueContext.fillText("35 min", 570, 153);
    this.valueTexture = new THREE.CanvasTexture(valueCanvas); this.valueTexture.colorSpace = THREE.SRGBColorSpace;
    this.valueMaterial = new THREE.MeshStandardMaterial({
      map: this.valueTexture,
      emissive: 0xb8ffc3,
      emissiveMap: this.valueTexture,
      emissiveIntensity: 0,
      roughness: .38,
    });
    const illuminatedValues = new THREE.Mesh(new THREE.PlaneGeometry(1.82, .34), this.valueMaterial);
    illuminatedValues.position.set(0, 0, .061);
    this.object3D.add(illuminatedValues);
  }
  createPresentControls() {
    this.object3D.add(new THREE.Mesh(new THREE.BoxGeometry(2.46, .49, .1), new THREE.MeshStandardMaterial({ color: 0x454b4b, metalness: .55, roughness: .4 })));
    [-.88, .88].forEach((x, index) => {
      const dial = new THREE.Group(); dial.position.set(x, 0, .1);
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 28), new THREE.MeshStandardMaterial({ color: 0xb8b4aa, metalness: .78, roughness: .24 })); knob.rotation.x = Math.PI / 2;
      const marker = new THREE.Mesh(new THREE.BoxGeometry(.035, .09, .025), new THREE.MeshStandardMaterial({ color: 0x292b29, roughness: .55 })); marker.position.set(0, .09, .075);
      dial.add(knob, marker); mark(dial, { kind: "oven-dial", value: index }); this.dials.push(dial); this.object3D.add(dial);
    });
    this.displayCanvas = document.createElement("canvas"); this.displayCanvas.width = 768; this.displayCanvas.height = 256;
    this.texture = new THREE.CanvasTexture(this.displayCanvas); this.texture.colorSpace = THREE.SRGBColorSpace;
    const display = new THREE.Mesh(new THREE.PlaneGeometry(1.02, .34), new THREE.MeshStandardMaterial({ map: this.texture, roughness: .55 })); display.position.z = .06; this.object3D.add(display); this.updateDisplay();
  }
  updateDisplay() {
    if (!this.displayCanvas) return; const context = this.displayCanvas.getContext("2d");
    context.fillStyle = "#162520"; context.fillRect(0, 0, 768, 256); context.textAlign = "center"; context.fillStyle = "#a5c5ae"; context.font = "36px sans-serif"; context.fillText("TEMPERATURA", 190, 62); context.fillText("TEMPORIZADOR", 570, 62); context.fillStyle = "#e1efdf"; context.font = "bold 68px sans-serif"; context.fillText(`${[120, 140, 160, 180, 200][this.values[0]]} °C`, 190, 164); context.fillText(`${[15, 25, 35, 45, 55][this.values[1]]} min`, 570, 164); this.texture.needsUpdate = true;
  }
  revealClue() { if (this.character !== "dad" || this.clueRevealed) return; this.clueRevealed = true; this.object3D.visible = true; this.valueMaterial.emissiveIntensity = 1.35; this.setAvailable(true); }
  interact() { if (this.available && !this.isSolved) this.onFocus?.(this); }
  handleControl(control) { if (this.character !== "mum" || !this.available || this.isSolved || control?.kind !== "oven-dial") return; const index = control.value; this.values[index] = (this.values[index] + 1) % 5; this.dials[index].rotation.z = -this.values[index] * Math.PI * .4; this.updateDisplay(); this.trySolve(); }
  trySolve() { if (!this.isSolved && this.values.every((value, position) => value === this.solution[position]) && (this.canSolve?.() ?? true)) this.solve(); }
  solve({ notify = true } = {}) { if (this.isSolved) return; this.isSolved = true; this.values = [...this.solution]; this.dials.forEach((dial, index) => { dial.rotation.z = -this.solution[index] * Math.PI * .4; }); this.updateDisplay(); if (notify) this.onSolved?.(); }
  getInteractionText() { if (!this.available || this.isSolved) return null; return tInteraction("examine", tItem(this.character === "dad" ? "oven-indicator" : "oven-controls")); }
  getFocusPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(this.character === "dad" ? new THREE.Vector3(0, 1.8, 3.5) : new THREE.Vector3(0, .3, 3)); }
  getLookAtPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3()); }
  dispose() { this.texture?.dispose(); this.valueTexture?.dispose(); this.valueMaterial?.dispose(); }
}

export { OvenControlPuzzle };
