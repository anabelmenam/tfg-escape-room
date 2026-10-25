import * as THREE from "three";
import { tInteraction, tItem } from "../../translations/index.js";
import { FocusPuzzle, createNapkinLabelTexture, mark, shadows } from "./KitchenPuzzleBase.js";

class TableSettingPuzzle extends FocusPuzzle {
  constructor({ timeline, onFocus, onSolved, onPlacementChange = null, napkins = [] }) {
    super("kitchen-family-table", { onFocus });
    this.timeline = timeline; this.onSolved = onSolved; this.onPlacementChange = onPlacementChange; this.settings = []; this.placements = [null, null, null, null];
    this.napkinsById = new Map(napkins.map((napkin) => [napkin.id, napkin]));
    this.expectedNapkins = ["kitchen-napkin-red", "kitchen-napkin-green", "kitchen-napkin-blue", "kitchen-napkin-ochre"];
    this.napkinColors = { "kitchen-napkin-red": 0xcbbd9f, "kitchen-napkin-blue": 0xcbbd9f, "kitchen-napkin-green": 0xcbbd9f, "kitchen-napkin-ochre": 0xcbbd9f };
    this.napkinNames = { "kitchen-napkin-red": "MAMÁ", "kitchen-napkin-blue": "PAPÁ", "kitchen-napkin-green": "ALBA", "kitchen-napkin-ochre": "JAIME" };
    this.napkinLabelTextures = new Map(Object.entries(this.napkinNames).map(([id, name]) => [id, createNapkinLabelTexture(name)]));
    this.labelTextures = [];
    const positions = [[-2.15, -1.02], [-2.15, 1.02], [2.15, -1.02], [2.15, 1.02]];
    const names = ["MAMÁ", "ALBA", "PAPÁ", "JAIME"];
    const porcelain = new THREE.MeshStandardMaterial({ color: 0xf0eadc, roughness: .42 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xcde1df, transparent: true, opacity: .46, roughness: .08, transmission: .25 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9b8b2, metalness: .82, roughness: .2 });
    positions.forEach(([x, z], index) => {
      const setting = new THREE.Group();
      const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256;
      const context = canvas.getContext("2d"); context.fillStyle = "#d8c49d"; context.fillRect(0, 0, 512, 256); context.strokeStyle = "#76583c"; context.lineWidth = 14; context.strokeRect(12, 12, 488, 232); context.fillStyle = "#4a3324"; context.textAlign = "center"; context.textBaseline = "middle"; context.font = "bold 62px Georgia"; context.fillText(names[index], 256, 128);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; this.labelTextures.push(texture);
      const placemat = new THREE.Mesh(new THREE.BoxGeometry(1.38, .035, 1.05), new THREE.MeshStandardMaterial({ map: texture, roughness: .96 }));
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(.43, .43, .055, 32), porcelain); plate.position.y = .06;
      const innerPlate = new THREE.Mesh(new THREE.TorusGeometry(.29, .025, 10, 30), porcelain.clone()); innerPlate.rotation.x = Math.PI / 2; innerPlate.position.y = .105;
      const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(.115, .09, .34, 20, 1, true), glass); tumbler.position.set(.52, .22, -.24);
      const fork = new THREE.Mesh(new THREE.BoxGeometry(.055, .035, .6), steel); fork.position.set(-.58, .075, 0);
      const knife = new THREE.Mesh(new THREE.BoxGeometry(.065, .04, .62), steel); knife.position.set(.58, .075, .08);
      const napkin = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(.4, .055, .31), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .94 }));
      const fold = new THREE.Mesh(new THREE.BoxGeometry(.22, .035, .25), base.material.clone()); fold.position.set(.07, .04, 0); fold.rotation.y = -.16;
      const label = new THREE.Mesh(new THREE.PlaneGeometry(.28, .09), new THREE.MeshStandardMaterial({ transparent: true, roughness: .95 })); label.rotation.x = -Math.PI / 2; label.position.set(-.055, .07, -.095);
      napkin.add(base, fold, label); napkin.userData.label = label; napkin.position.set(0, .15, .02); napkin.visible = false;
      if (timeline === "past") setting.add(placemat); else setting.add(placemat, plate, innerPlate, tumbler, fork, knife, napkin);
      setting.position.set(x, .09, z); if (index === 0 || index === 2) setting.rotation.y = Math.PI;
      setting.userData.parts = { napkin }; mark(setting, { kind: "place-setting", value: index }); this.settings.push(setting); this.object3D.add(setting);
    });
    shadows(this.object3D);
  }
  setPlacement(index, napkinId) {
    const setting = this.settings[index]; if (!setting) return; this.placements[index] = napkinId ?? null;
    const napkin = setting.userData.parts.napkin; napkin.visible = Boolean(napkinId);
    if (napkinId) { napkin.children.slice(0, 2).forEach((part) => part.material.color.setHex(this.napkinColors[napkinId])); napkin.userData.label.material.map = this.napkinLabelTextures.get(napkinId); napkin.userData.label.material.needsUpdate = true; }
  }
  applyPlacements(placements = []) { this.settings.forEach((_, index) => this.setPlacement(index, placements[index] ?? null)); }
  interact(player, control = null) { if (!this.available || this.isSolved) return; this.player = player; if (this.timeline === "past") return; if (control?.kind === "place-setting") this.handleControl(control, player); }
  handleControl(control, player = this.player) {
    if (this.timeline !== "present" || !this.available || this.isSolved || control?.kind !== "place-setting") return;
    const index = control.value; const placedNapkinId = this.placements[index];
    if (placedNapkinId) { const item = this.napkinsById.get(placedNapkinId); if (!item || !player?.inventory.add(item)) return; this.setPlacement(index, null); this.onPlacementChange?.({ operation: "remove", seatIndex: index, napkinId: placedNapkinId }); return; }
    const selected = player?.inventory.getSelectedItem(); if (!selected || !this.napkinsById.has(selected.id)) return;
    player.removeItemFromInventory(selected.id); this.setPlacement(index, selected.id); this.onPlacementChange?.({ operation: "place", seatIndex: index, napkinId: selected.id });
    if (this.placements.every((napkinId, seatIndex) => napkinId === this.expectedNapkins[seatIndex])) this.solve();
  }
  solve({ notify = true, placements = this.expectedNapkins } = {}) { if (this.isSolved) return; this.isSolved = true; this.applyPlacements(placements); if (notify) this.onSolved?.(); }
  getInteractionText(player = this.player, control = null) {
    if (!this.available || this.isSolved || this.timeline === "past" || control?.kind !== "place-setting") return null;
    const placed = this.placements[control.value]; if (placed) return tInteraction("pickUp", tItem(placed));
    const selected = player?.inventory.getSelectedItem(); return selected && this.napkinsById.has(selected.id) ? tInteraction("insert", tItem(selected.id)) : tInteraction("needItem", tItem("napkin"));
  }
  getFocusHint() { return tInteraction("exit"); }
  dispose() { this.labelTextures.forEach((texture) => texture.dispose()); this.napkinLabelTextures.forEach((texture) => texture.dispose()); }
}

export { TableSettingPuzzle };
