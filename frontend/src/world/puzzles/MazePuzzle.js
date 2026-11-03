import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { MAZE_ROUTE, MAZE_SIZE, canMove, drawMaze } from "./mazeLayout.js";
import { tInteraction, tItem } from "../../translations/index.js";

const CELL_SIZE = (3.1 * 0.76) / MAZE_SIZE;
const CENTER = (MAZE_SIZE - 1) / 2;
const DIRECTIONS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export class MazePuzzle extends Entity {
  constructor({ position, rotationY = 0, onFocus, onSolved, key, canSolve = null }) {
    super("hallway-maze");
    this.onFocus = onFocus;
    this.onSolved = onSolved;
    this.key = key;
    this.canSolve = canSolve;
    this.cell = [...MAZE_ROUTE[0]];
    this.isSolved = false;
    this.available = true;
    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = 1024;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 3.4, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x4a2a17 }),
    );
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 3.1),
      new THREE.MeshStandardMaterial({ map: this.texture, roughness: 0.88 }),
    );
    panel.position.z = 0.1;
    this.object3D.add(frame, panel);

    key.object3D.rotation.set(0, 0, 0);
    key.object3D.scale.setScalar(0.42);
    this.object3D.add(key.object3D);
    this.redraw();
  }

  redraw() {
    drawMaze(this.canvas.getContext("2d"), this.canvas);
    this.texture.needsUpdate = true;
    this.key.object3D.position.set(
      (this.cell[0] - CENTER) * CELL_SIZE,
      (CENTER - this.cell[1]) * CELL_SIZE + 0.07,
      0.16,
    );
  }

  moveTo(next) {
    if (this.isSolved || !this.available) return;
    if (!canMove(this.cell, next)) {
      this.cell = [...MAZE_ROUTE[0]];
      this.redraw();
      return;
    }
    this.cell = [...next];
    this.trySolve();
    this.redraw();
  }

  trySolve() {
    if (!this.isSolved && this.cell.every((value, i) => value === MAZE_ROUTE.at(-1)[i]) && (this.canSolve?.() ?? true))
      this.solve();
  }

  handleKey(code) {
    if (!DIRECTIONS[code]) return false;
    this.moveTo(this.cell.map((value, i) => value + DIRECTIONS[code][i]));
    return true;
  }

  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.isSolved = true;
    this.cell = [...MAZE_ROUTE.at(-1)];
    this.key.setEnabled(true);
    this.redraw();
    if (notify) this.onSolved?.();
  }

  interact(player) {
    if (this.isSolved) {
      if (this.key.enabled) {
        this.key.interact(player);
        if (this.key.enabled) {
          this.onFocus?.(this);
        }
      }
      return;
    }
    this.onFocus?.(this);
  }

  getInteractionText() {
    if (!this.available) return "";
    if (this.isSolved) return this.key.enabled ? tInteraction("pickUp", tItem("living-room-key")) : null;
    return tInteraction("examine", tItem("maze-puzzle"));
  }

  setFocused(focused) {
    this.focused = focused;
  }

  getFocusPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3(0, 0, 4));
  }

  getLookAtPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3());
  }

  dispose() {
    this.texture.dispose();
    this.object3D.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
  }
}
