import * as THREE from "three";
import { Entity } from "../objects/index.js";

const mark = (object, control) => object.traverse((child) => { child.userData.roomPuzzleControl = control; });
const shadows = (object) => object.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

const paperTexture = (lines, { sepia = false } = {}) => {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 512;
  const context = canvas.getContext("2d");
  context.fillStyle = sepia ? "#c9aa75" : "#e8d9b5"; context.fillRect(0, 0, 768, 512);
  context.strokeStyle = "rgba(92,57,28,.55)"; context.lineWidth = 8; context.strokeRect(22, 22, 724, 468);
  context.fillStyle = "#3f2b1e"; context.textAlign = "center"; context.textBaseline = "middle";
  lines.forEach((line, index) => { context.font = index === 0 ? "bold 52px Georgia" : "38px Georgia"; context.fillText(line, 384, 92 + index * 76); });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
};

const createNapkinLabelTexture = (name) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 384;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 1024, 384); context.textAlign = "left"; context.textBaseline = "top";
  context.font = "bold 190px Georgia"; context.strokeStyle = "rgba(255, 247, 226, .42)"; context.lineWidth = 10;
  context.strokeText(name, 64, 82); context.fillStyle = "rgba(70, 53, 39, .9)"; context.fillText(name, 64, 70);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
};

class FocusPuzzle extends Entity {
  constructor(id, { onFocus = null } = {}) { super(id); this.onFocus = onFocus; this.available = false; this.isSolved = false; this.object3D = new THREE.Group(); this.object3D.name = id; }
  setAvailable(value = true) { this.available = value; }
  setFocused() {}
  getFocusPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 2.8, 4.4)); }
  getLookAtPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, .8, 0)); }
}

export { FocusPuzzle, createNapkinLabelTexture, mark, paperTexture, shadows };
