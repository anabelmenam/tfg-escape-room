import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";
import { createNapkinLabelTexture, shadows } from "./KitchenPuzzleBase.js";
import { createKitchenFoodModel } from "./createKitchenFoodModel.js";
import { createTile } from "./createTile.js";

const createNapkinFabricTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ddd8cd";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.lineWidth = 1;
  for (let position = 3; position < canvas.width; position += 6) {
    context.strokeStyle = position % 12 === 3 ? "rgba(255,255,255,.34)" : "rgba(74,63,52,.13)";
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }

  context.lineWidth = 3;
  context.strokeStyle = "rgba(78,66,55,.1)";
  context.beginPath();
  context.moveTo(-10, 126);
  context.bezierCurveTo(42, 104, 104, 148, 202, 112);
  context.stroke();
  context.strokeStyle = "rgba(255,255,255,.18)";
  context.beginPath();
  context.moveTo(-10, 130);
  context.bezierCurveTo(42, 108, 104, 152, 202, 116);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 2.4);
  return texture;
};

class KitchenIngredient extends Entity {
  constructor({ id, kind, onCollect }) {
    super(id); this.itemName = id; this.onCollect = onCollect; this.object3D = createKitchenFoodModel(kind);
    this.inventoryIcon = {
      "kitchen-tomatoes": "/images/icons/kitchen/tomatoes.png",
      "kitchen-carrots": "/images/icons/kitchen/carrots.png",
      "kitchen-cheese": "/images/icons/kitchen/cheese.png",
    }[id];
    this.object3D.name = id; shadows(this.object3D);
  }
  interact(player) { if (!player?.inventory.add(this)) return; this.object3D.visible = false; this.setEnabled(false); this.onCollect?.(); }
  getInteractionText() { return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null; }
}

class KitchenNapkin extends Entity {
  constructor({ id, color, name, onCollect }) {
    super(id); this.itemName = id; this.onCollect = onCollect; this.object3D = new THREE.Group(); this.object3D.name = id;
    this.inventoryIcon = {
      "kitchen-napkin-red": "/images/icons/kitchen/mum-napkin.png",
      "kitchen-napkin-blue": "/images/icons/kitchen/dad-napkin.png",
      "kitchen-napkin-green": "/images/icons/kitchen/daughter-napkin.png",
      "kitchen-napkin-ochre": "/images/icons/kitchen/son-napkin.png",
    }[id];
    this.fabricTexture = createNapkinFabricTexture();
    const cloth = new THREE.MeshStandardMaterial({
      color,
      map: this.fabricTexture,
      bumpMap: this.fabricTexture,
      bumpScale: .018,
      roughness: .98,
    });
    const folded = new THREE.Mesh(new THREE.BoxGeometry(.58, .075, .42), cloth);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(.31, .045, .34), cloth.clone()); flap.position.set(.11, .06, -.015); flap.rotation.y = -.16;
    this.labelTexture = createNapkinLabelTexture(name);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.28, .09), new THREE.MeshStandardMaterial({ map: this.labelTexture, transparent: true, roughness: .9 })); label.rotation.x = -Math.PI / 2; label.position.set(-.055, .09, -.095);
    this.object3D.add(folded, flap, label); shadows(this.object3D);
  }
  interact(player) { if (!player?.inventory.add(this)) return; this.object3D.visible = false; this.setEnabled(false); this.onCollect?.(); }
  getInteractionText() { return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null; }
  dispose() { this.labelTexture.dispose(); this.fabricTexture.dispose(); }
}

class MosaicTile extends Entity {
  constructor({ onCollect }) {
    super("bathroom-mosaic-tile"); this.onCollect = onCollect; this.itemName = this.id; this.object3D = new THREE.Group(); this.object3D.name = this.id;
    this.inventoryIcon = "/images/icons/kitchen/tile.png";
    const tile = createTile({ tileId: 5, size: 1.16, depth: .12 });
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
