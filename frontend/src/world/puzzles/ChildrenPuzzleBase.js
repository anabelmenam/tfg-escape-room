import * as THREE from "three";
import { Entity } from "../objects/index.js";

const COLORS = [0xd8584f, 0x4c86bb, 0xe1b83e, 0x65a061];
const CASTLE_PIECES = [
  { color: 0xd62828, start: [-3.65, 1.95, -1.05], target: [-.9, 1.95, .35] },
  { color: 0x1565c0, start: [3.65, 1.95, -.25], target: [-.9, 2.67, .35] },
  { color: 0xf2c500, start: [-3.65, 1.95, .55], target: [-.9, 3.39, .35] },
  { color: 0x159447, start: [3.65, 1.95, 1.35], target: [-.9, 4.11, .35] },
  { color: 0x6a1b9a, start: [3.65, 1.95, -1.05], target: [.9, 1.95, .35] },
  { color: 0xef6c00, start: [-3.65, 1.95, -.25], target: [.9, 2.67, .35] },
  { color: 0x008c95, start: [3.65, 1.95, .55], target: [.9, 3.39, .35] },
  { color: 0xc2185b, start: [-3.65, 1.95, 1.35], target: [.9, 4.11, .35] },
];
const MELODY = [2, 0, 3, 1, 3];
const ROUTE = [0, 1, 2, 3];

const createLabel = (lines, { width = 768, height = 384, background = "#ead7a4", ink = "#3b271b" } = {}) => {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d"); context.fillStyle = background; context.fillRect(0, 0, width, height); context.strokeStyle = "#76502e"; context.lineWidth = 16; context.strokeRect(12, 12, width - 24, height - 24); context.fillStyle = ink; context.textAlign = "center"; context.textBaseline = "middle"; context.font = "bold 42px Georgia, serif";
  const lineHeight = 58; const startY = height / 2 - (lines.length - 1) * lineHeight / 2; lines.forEach((line, index) => context.fillText(line, width / 2, startY + index * lineHeight));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return { texture, material: new THREE.MeshStandardMaterial({ map: texture, roughness: .92 }) };
};
const markChildrenControl = (object, control) => object.traverse((child) => { child.userData.childrenPuzzleControl = control; });
const configureChildrenMeshes = (object) => object.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

class ChildrenPuzzle extends Entity {
  constructor(id, { position = new THREE.Vector3(), rotationY = 0, scale = 1, onFocus = null } = {}) { super(id); this.onFocus = onFocus; this.available = false; this.isSolved = false; this.isFocused = false; this.object3D = new THREE.Group(); this.object3D.name = id; this.object3D.position.copy(position); this.object3D.rotation.y = rotationY; this.object3D.scale.setScalar(scale); }
  setAvailable(available = true) { this.available = available; }
  setFocused(focused) { this.isFocused = focused; }
  getFocusPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 2.8, 5.2)); }
  getLookAtPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 1.1, 0)); }
}

export { CASTLE_PIECES, COLORS, ChildrenPuzzle, MELODY, ROUTE, configureChildrenMeshes, createLabel, markChildrenControl };
