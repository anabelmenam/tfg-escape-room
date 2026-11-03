import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const SYMBOLS = { moon: "☾", flame: "♨", star: "✦", wave: "≋" };
const FINAL_KEY_ICONS = {
  moon: "/images/icons/bedroom/moon-key.png",
  flame: "/images/icons/living-room/flame-key.png",
  star: "/images/icons/children-room/star-key.png",
  wave: "/images/icons/bathroom/wave-key.png",
};

const createSymbolTexture = (symbol, foreground = "#f5df9b", background = "#332417") => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = background;
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = foreground;
  context.lineWidth = 14;
  context.strokeRect(12, 12, 232, 232);
  context.fillStyle = foreground;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 150px Georgia";
  context.fillText(SYMBOLS[symbol] ?? symbol, 128, 137);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, icon: canvas.toDataURL("image/png") };
};

class FinalKey extends Entity {
  constructor({ id, symbol, color = 0xc49a45, onCollect = null } = {}) {
    super(id);
    this.itemName = id;
    this.symbol = symbol;
    this.onCollect = onCollect;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    const metal = new THREE.MeshStandardMaterial({ color, metalness: 0.88, roughness: 0.22 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x352b24, metalness: 0.82, roughness: 0.34 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.09, 16, 40), metal);
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 32), darkMetal);
    medallion.rotation.x = Math.PI / 2;
    const { texture } = createSymbolTexture(symbol);
    this.symbolTexture = texture;
    this.inventoryIcon = FINAL_KEY_ICONS[symbol];
    const emblem = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 32),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55 }),
    );
    emblem.position.z = 0.046;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.92, 0.12), metal);
    shaft.position.y = -0.78;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.16), darkMetal);
    collar.position.y = -0.39;
    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.14), metal);
    bit.position.set(0.16, -1.24, 0);
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.14), metal);
    tooth.position.set(0.32, -1.08, 0);
    this.object3D.add(ring, medallion, emblem, shaft, collar, bit, tooth);
    this.object3D.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    this.object3D.scale.setScalar(0.48);
    this.object3D.traverse((part) => {
      if (part.isMesh) part.castShadow = true;
    });
  }
  interact(player) {
    if (!this.enabled || !player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }
  reveal() {
    this.object3D.visible = true;
    this.setEnabled(true);
  }
  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null;
  }
  dispose() {
    this.symbolTexture?.dispose();
  }
}

export { FinalKey, createSymbolTexture };
