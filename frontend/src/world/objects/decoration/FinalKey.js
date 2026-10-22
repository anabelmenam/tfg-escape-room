import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const SYMBOLS = { moon: "☾", flame: "♨", star: "✦", wave: "≋" };

const createSymbolTexture = (symbol, foreground = "#f5df9b", background = "#332417") => {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 256;
  const context = canvas.getContext("2d"); context.fillStyle = background; context.fillRect(0, 0, 256, 256);
  context.strokeStyle = foreground; context.lineWidth = 14; context.strokeRect(12, 12, 232, 232);
  context.fillStyle = foreground; context.textAlign = "center"; context.textBaseline = "middle"; context.font = "bold 150px Georgia";
  context.fillText(SYMBOLS[symbol] ?? symbol, 128, 137);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, icon: canvas.toDataURL("image/png") };
};

class FinalKey extends Entity {
  constructor({ id, symbol, color = 0xc49a45, onCollect = null } = {}) {
    super(id); this.itemName = id; this.symbol = symbol; this.onCollect = onCollect;
    this.object3D = new THREE.Group(); this.object3D.name = id;
    const metal = new THREE.MeshStandardMaterial({ color, metalness: .88, roughness: .22 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x352b24, metalness: .82, roughness: .34 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.38, .09, 16, 40), metal);
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .08, 32), darkMetal); medallion.rotation.x = Math.PI / 2;
    const { texture, icon } = createSymbolTexture(symbol); this.symbolTexture = texture; this.inventoryIcon = icon;
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(.2, 32), new THREE.MeshStandardMaterial({ map: texture, roughness: .55 })); emblem.position.z = .046;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(.14, .92, .12), metal); shaft.position.y = -.78;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(.32, .16, .16), darkMetal); collar.position.y = -.39;
    const bit = new THREE.Mesh(new THREE.BoxGeometry(.48, .22, .14), metal); bit.position.set(.16, -1.24, 0);
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(.18, .22, .14), metal); tooth.position.set(.32, -1.08, 0);
    this.object3D.add(ring, medallion, emblem, shaft, collar, bit, tooth);
    this.object3D.rotation.set(Math.PI / 2, 0, Math.PI / 2); this.object3D.scale.setScalar(.72);
    this.object3D.traverse((part) => { if (part.isMesh) part.castShadow = true; });
  }
  interact(player) { if (!this.enabled || !player?.inventory.add(this)) return; this.object3D.visible = false; this.setEnabled(false); this.onCollect?.(); }
  reveal() { this.object3D.visible = true; this.setEnabled(true); }
  getInteractionText() { return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null; }
  dispose() { this.symbolTexture?.dispose(); }
}

export { FinalKey, createSymbolTexture };
