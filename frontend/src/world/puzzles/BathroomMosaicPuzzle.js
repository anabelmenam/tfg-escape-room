import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";
import { finishBathroomObject, markBathroomControl } from "./BathroomPuzzleUtils.js";
import { createTile } from "./TileModels.js";

const CORRECT_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const SCRAMBLED_ORDER = [4, 0, 7, 2, null, 8, 1, 6, 3];
const MISSING_TILE_ID = 5;

class BathroomMosaicPuzzle extends Entity {
  constructor({ timeline, onFocus, onSolved, onInsert }) {
    super("bathroom-mosaic");
    this.timeline = timeline; this.onFocus = onFocus; this.onSolved = onSolved; this.onInsert = onInsert;
    this.available = true; this.isSolved = false; this.tileInserted = timeline === "past";
    this.selectedTile = null; this.animations = [];
    this.order = timeline === "past" ? [...CORRECT_ORDER] : [...SCRAMBLED_ORDER];
    this.tiles = new Map(); this.object3D = new THREE.Group(); this.object3D.name = this.id;
    this.slotPositions = CORRECT_ORDER.map((index) => new THREE.Vector3((index % 3 - 1) * 1.22, (1 - Math.floor(index / 3)) * 1.22, .1));

    CORRECT_ORDER.forEach((tileId) => {
      const tile = new THREE.Group(); tile.name = `bathroom-tile-${tileId}`; tile.userData.tileId = tileId;
      tile.add(createTile({ tileId, size: 1.13, depth: .1 }));
      markBathroomControl(tile, { kind: "mosaic-tile", value: tileId });
      this.tiles.set(tileId, tile); this.object3D.add(tile);
    });
    this.applyOrder(this.order);
    if (timeline === "present") this.tiles.get(MISSING_TILE_ID).visible = false;

    this.compartment = new THREE.Group();
    const recess = new THREE.Mesh(new THREE.BoxGeometry(.95, .95, .42), new THREE.MeshStandardMaterial({ color: 0x27231e, roughness: .92 }));
    const lining = new THREE.Mesh(new THREE.BoxGeometry(.7, .68, .05), new THREE.MeshStandardMaterial({ color: 0x8d744d, roughness: .8 })); lining.position.z = .23;
    const brass = new THREE.Mesh(new THREE.TorusGeometry(.16, .035, 10, 22), new THREE.MeshStandardMaterial({ color: 0xb2873e, metalness: .72, roughness: .3 })); brass.position.z = .28;
    this.compartment.add(recess, lining, brass); this.compartment.position.set(0, 0, -.02); this.compartment.visible = false; this.object3D.add(this.compartment);
    finishBathroomObject(this.object3D);
  }

  setAvailable(value = true) { this.available = value; }
  interact(player) {
    if (this.timeline !== "present" || !this.available || this.isSolved) return;
    if (this.timeline === "present" && !this.tileInserted) {
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
    if (this.timeline !== "present" || !this.tileInserted || this.isSolved || this.animations.length || control?.kind !== "mosaic-tile") return;
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
    if (!this.animations.length) return;
    this.animations.forEach((animation) => {
      animation.elapsed += deltaTime; const progress = Math.min(animation.elapsed / animation.duration, 1); const eased = progress * progress * (3 - 2 * progress);
      animation.tile.position.lerpVectors(animation.from, animation.to, eased); animation.tile.position.z += Math.sin(progress * Math.PI) * .22;
    });
    this.animations = this.animations.filter((animation) => animation.elapsed < animation.duration);
    if (!this.animations.length && this.order.every((tileId, index) => tileId === CORRECT_ORDER[index])) this.solve();
  }
  applyOrder(order) {
    order.forEach((tileId, slot) => { if (tileId !== null) this.tiles.get(tileId).position.copy(this.slotPositions[slot]); });
  }
  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.isSolved = true; this.tileInserted = true; this.order = [...CORRECT_ORDER];
    this.tiles.forEach((tile, tileId) => { tile.visible = true; tile.position.copy(this.slotPositions[tileId]); });
    if (this.timeline === "past") this.revealCompartment();
    if (notify) this.onSolved?.();
  }
  revealCompartment() {
    if (this.compartment.visible) return;
    const center = this.tiles.get(4);
    center.position.copy(this.slotPositions[4]);
    center.position.x -= 1.02;
    center.position.z += .26;
    this.compartment.visible = true;
  }
  setFocused() {}
  getInteractionText(player) {
    if (this.timeline !== "present" || !this.available || this.isSolved) return null;
    if (this.timeline === "present" && !this.tileInserted) return player?.hasSelected("bathroom-mosaic-tile")
      ? tInteraction("insert", tItem("bathroom-mosaic-tile")) : tInteraction("needItem", tItem("bathroom-mosaic-tile"));
    return tInteraction("examine", "el mosaico");
  }
  getFocusPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 0, 4.8)); }
  getLookAtPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3()); }
}

export { BathroomMosaicPuzzle };
