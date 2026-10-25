import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";
import { finishBathroomObject, markBathroomControl } from "./bathroomPuzzleHelpers.js";
import { createTile } from "./createTile.js";

const CORRECT_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const SCRAMBLED_ORDER = [4, 0, 7, 2, null, 8, 1, 6, 3];
const MISSING_TILE_ID = 5;

class BathroomMosaicPuzzle extends Entity {
  constructor({ character, onFocus, onSolved, onInsert }) {
    super("bathroom-mosaic");
    this.character = character; this.onFocus = onFocus; this.onSolved = onSolved; this.onInsert = onInsert;
    this.available = true; this.isSolved = false; this.tileInserted = character === "mum";
    this.selectedTile = null; this.animations = []; this.tileTurnAnimation = null;
    this.order = character === "mum" ? [...CORRECT_ORDER] : [...SCRAMBLED_ORDER];
    this.tiles = new Map(); this.object3D = new THREE.Group(); this.object3D.name = this.id;
    this.panel = new THREE.Group(); this.panel.name = "bathroom-mosaic-panel"; this.object3D.add(this.panel);
    this.centerTileHinge = new THREE.Group(); this.centerTileHinge.name = "bathroom-mosaic-center-hinge"; this.panel.add(this.centerTileHinge);
    this.slotPositions = CORRECT_ORDER.map((index) => new THREE.Vector3((index % 3 - 1) * 1.22, (1 - Math.floor(index / 3)) * 1.22, .1));

    CORRECT_ORDER.forEach((tileId) => {
      const tile = new THREE.Group(); tile.name = `bathroom-tile-${tileId}`; tile.userData.tileId = tileId;
      tile.add(createTile({ tileId, size: 1.13, depth: .1 }));
      markBathroomControl(tile, { kind: "mosaic-tile", value: tileId });
      this.tiles.set(tileId, tile); this.panel.add(tile);
    });
    this.applyOrder(this.order);
    if (character === "dad") this.tiles.get(MISSING_TILE_ID).visible = false;
    this.rearMount = new THREE.Group(); this.rearMount.name = "bathroom-mosaic-center-rear"; this.rearMount.position.z = -.075; this.tiles.get(4).add(this.rearMount);

    finishBathroomObject(this.object3D);
  }

  setAvailable(value = true) { this.available = value; }
  interact(player) {
    if (this.character !== "dad" || !this.available || this.isSolved) return;
    if (this.character === "dad" && !this.tileInserted) {
      if (!player?.hasSelected("bathroom-mosaic-tile")) return;
      player.removeItemFromInventory("bathroom-mosaic-tile"); this.insertMissingTile(); this.onInsert?.(); return;
    }
    this.onFocus?.(this);
  }
  insertMissingTile() {
    if (this.tileInserted) return;
    this.tileInserted = true; this.order[4] = MISSING_TILE_ID;
    const tile = this.tiles.get(MISSING_TILE_ID); tile.visible = true; tile.position.copy(this.slotPositions[4]);
  }
  handleControl(control) {
    if (this.character !== "dad" || !this.tileInserted || this.isSolved || this.animations.length || control?.kind !== "mosaic-tile") return;
    const tile = this.tiles.get(control.value); if (!tile?.visible) return;
    if (!this.selectedTile) { this.selectedTile = tile; tile.position.z = .34; return; }
    if (this.selectedTile === tile) { tile.position.z = .1; this.selectedTile = null; return; }
    const firstTile = this.selectedTile; const firstId = firstTile.userData.tileId; const secondId = tile.userData.tileId;
    const firstSlot = this.order.indexOf(firstId); const secondSlot = this.order.indexOf(secondId);
    [this.order[firstSlot], this.order[secondSlot]] = [this.order[secondSlot], this.order[firstSlot]];
    this.animateTile(firstTile, this.slotPositions[secondSlot]); this.animateTile(tile, this.slotPositions[firstSlot]); this.selectedTile = null;
  }
  animateTile(tile, target) { this.animations.push({ tile, from: tile.position.clone(), to: target.clone(), elapsed: 0, duration: .42 }); }
  update(deltaTime) {
    if (this.animations.length) {
      this.animations.forEach((animation) => {
        animation.elapsed += deltaTime; const progress = Math.min(animation.elapsed / animation.duration, 1); const eased = progress * progress * (3 - 2 * progress);
        animation.tile.position.lerpVectors(animation.from, animation.to, eased); animation.tile.position.z += Math.sin(progress * Math.PI) * .22;
      });
      this.animations = this.animations.filter((animation) => animation.elapsed < animation.duration);
      if (!this.animations.length && this.order.every((tileId, index) => tileId === CORRECT_ORDER[index])) this.solve();
    }
    if (this.tileTurnAnimation) {
      this.tileTurnAnimation.elapsed += deltaTime;
      const progress = Math.min(this.tileTurnAnimation.elapsed / this.tileTurnAnimation.duration, 1);
      const eased = progress * progress * (3 - 2 * progress);
      this.centerTileHinge.rotation.y = THREE.MathUtils.lerp(this.tileTurnAnimation.from, -Math.PI / 2, eased);
      if (progress >= 1) this.tileTurnAnimation = null;
    }
  }
  applyOrder(order) {
    order.forEach((tileId, slot) => { if (tileId !== null) this.tiles.get(tileId).position.copy(this.slotPositions[slot]); });
  }
  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.isSolved = true; this.tileInserted = true; this.order = [...CORRECT_ORDER];
    this.tiles.forEach((tile, tileId) => { tile.visible = true; tile.position.copy(this.slotPositions[tileId]); });
    if (this.character === "dad") this.turnCenterTile({ animate: notify });
    if (notify) this.onSolved?.();
  }
  turnCenterTile({ animate = false } = {}) {
    const centerTile = this.tiles.get(4);
    if (centerTile.parent !== this.centerTileHinge) {
      const centerPosition = this.slotPositions[4];
      this.centerTileHinge.position.set(centerPosition.x - .565, centerPosition.y, centerPosition.z);
      centerTile.removeFromParent(); centerTile.position.set(.565, 0, 0); this.centerTileHinge.add(centerTile);
    }
    if (this.centerTileHinge.rotation.y === -Math.PI / 2 && !animate) return;
    if (animate) this.tileTurnAnimation = { from: this.centerTileHinge.rotation.y, elapsed: 0, duration: .9 };
    else { this.tileTurnAnimation = null; this.centerTileHinge.rotation.y = -Math.PI / 2; }
  }
  setFocused() {}
  getInteractionText(player) {
    if (this.character !== "dad" || !this.available || this.isSolved) return null;
    if (this.character === "dad" && !this.tileInserted) return player?.hasSelected("bathroom-mosaic-tile")
      ? tInteraction("insert", tItem("bathroom-mosaic-tile")) : tInteraction("needItem", tItem("bathroom-mosaic-tile"));
    return tInteraction("examine", "el mosaico");
  }
  getFocusPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 0, 4.8)); }
  getLookAtPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3()); }
}

export { BathroomMosaicPuzzle };
