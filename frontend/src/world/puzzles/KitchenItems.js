import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";
import { createNapkinLabelTexture, shadows } from "./KitchenPuzzleBase.js";
import { createKitchenFoodModel } from "./KitchenFoodModels.js";
import { createAzulejo } from "./AzulejoModels.js";

class KitchenIngredient extends Entity {
  constructor({ id, kind, onCollect }) {
    super(id); this.itemName = id; this.onCollect = onCollect; this.object3D = createKitchenFoodModel(kind);
    this.object3D.name = id; shadows(this.object3D);
  }
  interact(player) { if (!player?.inventory.add(this)) return; this.object3D.visible = false; this.setEnabled(false); this.onCollect?.(); }
  getInteractionText() { return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null; }
}

class KitchenNapkin extends Entity {
  constructor({ id, color, name, onCollect }) {
    super(id); this.itemName = id; this.onCollect = onCollect; this.object3D = new THREE.Group(); this.object3D.name = id;
    const cloth = new THREE.MeshStandardMaterial({ color, roughness: .94 });
    const folded = new THREE.Mesh(new THREE.BoxGeometry(.58, .075, .42), cloth);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(.31, .045, .34), cloth.clone()); flap.position.set(.11, .06, -.015); flap.rotation.y = -.16;
    this.labelTexture = createNapkinLabelTexture(name);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.28, .09), new THREE.MeshStandardMaterial({ map: this.labelTexture, transparent: true, roughness: .9 })); label.rotation.x = -Math.PI / 2; label.position.set(-.055, .09, -.095);
    this.object3D.add(folded, flap, label); shadows(this.object3D);
  }
  interact(player) { if (!player?.inventory.add(this)) return; this.object3D.visible = false; this.setEnabled(false); this.onCollect?.(); }
  getInteractionText() { return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null; }
  dispose() { this.labelTexture.dispose(); }
}

class MosaicTile extends Entity {
  constructor({ onCollect }) {
    super("bathroom-mosaic-tile"); this.onCollect = onCollect; this.itemName = this.id; this.object3D = new THREE.Group(); this.object3D.name = this.id;
    const tile = createAzulejo({ tileId: 5, size: 1.16, depth: .12 });
    const backing = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.22, .08), new THREE.MeshStandardMaterial({ color: 0xb8aa91, roughness: .9 }));
    backing.position.z = -.09;
    this.object3D.add(backing, tile); shadows(this.object3D);
    this.object3D.visible = false; this.setEnabled(false);
  }
  reveal() { this.object3D.visible = true; this.setEnabled(true); }
  interact(player) { if (!player?.inventory.add(this)) return; this.object3D.visible = false; this.setEnabled(false); this.onCollect?.(); }
  getInteractionText() { return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null; }
}

export { KitchenIngredient, KitchenNapkin, MosaicTile };
