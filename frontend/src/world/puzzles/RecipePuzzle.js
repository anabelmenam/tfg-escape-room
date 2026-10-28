import * as THREE from "three";
import { tInteraction, tItem } from "../../translations/index.js";
import { FocusPuzzle, mark, paperTexture, shadows } from "./KitchenPuzzleBase.js";
import { createKitchenFoodModel } from "./createKitchenFoodModel.js";

class RecipePuzzle extends FocusPuzzle {
  constructor({ character, onFocus, onSolved, onPlacementChange = null, onCollect = null, ingredients = [] }) {
    super("kitchen-recipe", { onFocus }); this.character = character; this.onSolved = onSolved; this.onPlacementChange = onPlacementChange; this.onCollect = onCollect; this.placements = [null, null, null]; this.expected = ["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"]; this.slotPositions = [-1.2, 0, 1.2]; this.ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])); this.modelsById = new Map(); this.slots = []; this.rewardRevealed = false; this.rewardSliding = false; this.rewardTargetZ = null;
    if (character === "mum") {
      this.id = "kitchen-recipe-note"; this.object3D.name = this.id; this.itemName = "recipe-note"; this.inventoryInspectionKey = "KeyR"; this.inspectionTranslationKey = "papers.kitchen-recipe-note";
      this.texture = paperTexture(["GUISO DE LA CASA", "3 tomates maduros", "2 zanahorias", "1 cuña de queso"], { sepia: true });
      const preview = this.texture.image.toDataURL("image/png"); this.inventoryIcon = preview; this.inspectionImage = preview; this.inspectionTitle = "receta del guiso";
      const page = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 2), new THREE.MeshStandardMaterial({ map: this.texture, roughness: .95, side: THREE.DoubleSide })); this.object3D.add(page); this.object3D.rotation.x = -Math.PI / 2;
    } else {
      const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, .16, 2.35), new THREE.MeshStandardMaterial({ color: 0x765033, roughness: .82 }));
      mark(board, { kind: "recipe-board" });
      this.object3D.add(board);
      this.expected.forEach((id, index) => {
        const slot = new THREE.Group(); slot.position.set(this.slotPositions[index], 0, 0);
        const marker = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .025, 28), new THREE.MeshStandardMaterial({ color: 0x8f6844, roughness: .9, transparent: true, opacity: .42 })); marker.position.y = .11;
        const interactionVolume = new THREE.Mesh(
          new THREE.BoxGeometry(1.12, .85, 2.02),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
        );
        interactionVolume.position.y = .53;
        slot.add(marker, interactionVolume); mark(slot, { kind: "recipe-slot", value: index }); this.slots.push(slot); this.object3D.add(slot);
      });
      ingredients.forEach((ingredient) => {
        const model = createKitchenFoodModel(ingredient.kind, ingredient.quantity);
        model.visible = false;
        shadows(model);
        this.modelsById.set(ingredient.id, model);
        this.object3D.add(model);
      });
    }
    shadows(this.object3D);
  }
  setPlacement(index, ingredientId) {
    const previousId = this.placements[index]; if (previousId) this.modelsById.get(previousId).visible = false;
    this.placements[index] = ingredientId ?? null;
    if (!ingredientId) return;
    const model = this.modelsById.get(ingredientId); if (!model) return;
    model.position.set(this.slotPositions[index], .2, 0); model.visible = true; mark(model, { kind: "recipe-slot", value: index });
  }
  applyPlacements(placements = []) { this.modelsById.forEach((model) => { model.visible = false; }); this.placements = [null, null, null]; this.slots.forEach((_, index) => this.setPlacement(index, placements[index] ?? null)); }
  resolveInteractionControl(control, intersection) {
    if (this.character !== "dad" || control?.kind !== "recipe-board" || !intersection?.point) return control;
    this.object3D.updateWorldMatrix(true, false);
    const localPoint = this.object3D.worldToLocal(intersection.point.clone());
    const slotIndex = localPoint.x < -.6 ? 0 : localPoint.x > .6 ? 2 : 1;
    return { kind: "recipe-slot", value: slotIndex };
  }
  interact(player, control = null) {
    if (this.character === "mum") { if (!this.available || !player?.inventory.add(this)) return; this.object3D.visible = false; this.setEnabled(false); this.onCollect?.(); return; }
    if (!this.available || this.isSolved || control?.kind !== "recipe-slot") return;
    const index = control.value; const placedId = this.placements[index];
    if (placedId) { const item = this.ingredientsById.get(placedId); if (!item || !player?.inventory.add(item)) return; this.setPlacement(index, null); this.onPlacementChange?.({ operation: "remove", slotIndex: index, ingredientId: placedId }); return; }
    const selected = player?.inventory.getSelectedItem(); if (!selected || !this.ingredientsById.has(selected.id)) return;
    player.removeItemFromInventory(selected.id); this.setPlacement(index, selected.id); this.onPlacementChange?.({ operation: "place", slotIndex: index, ingredientId: selected.id });
    if (this.placements.every((id, position) => id === this.expected[position])) this.solve();
  }
  revealReward() { if (this.character !== "dad" || this.rewardRevealed) return; this.rewardRevealed = true; this.rewardSliding = true; this.rewardTargetZ = this.object3D.position.z - 0.7; }
  update(deltaTime) {
    if (!this.rewardSliding || this.rewardTargetZ === null) return;
    const remaining = this.rewardTargetZ - this.object3D.position.z;
    const step = Math.min(Math.abs(remaining), deltaTime * .85);
    this.object3D.position.z += Math.sign(remaining) * step;
    if (Math.abs(this.rewardTargetZ - this.object3D.position.z) < .001) { this.object3D.position.z = this.rewardTargetZ; this.rewardSliding = false; }
  }
  solve({ notify = true, placements = this.expected } = {}) { if (this.isSolved) return; this.isSolved = true; this.applyPlacements(placements); this.revealReward(); if (notify) this.onSolved?.(); }
  getInteractionText(player, control = null) { if (!this.available) return null; if (this.character === "mum") return tInteraction("pickUp", tItem(this.itemName)); if (this.isSolved || control?.kind !== "recipe-slot") return null; const placedId = this.placements[control.value]; if (placedId) return tInteraction("pickUp", tItem(placedId)); const selected = player?.inventory.getSelectedItem(); return selected && this.ingredientsById.has(selected.id) ? tInteraction("insert", tItem(selected.id)) : tInteraction("needItem", tItem("ingredient")); }
  getFocusPosition() { if (this.character !== "mum") return super.getFocusPosition(); this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 0, 4.3)); }
  getLookAtPosition() { if (this.character !== "mum") return super.getLookAtPosition(); this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3()); }
  getFocusUp() { this.object3D.updateWorldMatrix(true, false); return new THREE.Vector3(0, 1, 0).transformDirection(this.object3D.matrixWorld); }
  dispose() { this.texture?.dispose(); }
}

export { RecipePuzzle };
