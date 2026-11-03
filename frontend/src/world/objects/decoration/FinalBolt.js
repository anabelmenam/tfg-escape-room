import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";
import { createSymbolTexture } from "./FinalKey.js";

class FinalBolt extends Entity {
  constructor({ id, keyId, symbol, color, onUnlock } = {}) {
    super(id);
    this.keyId = keyId;
    this.onUnlock = onUnlock;
    this.unlocked = false;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    const metal = new THREE.MeshStandardMaterial({ color, metalness: 0.86, roughness: 0.26 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x292520, metalness: 0.72, roughness: 0.42 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.72, 0.16), dark);
    this.bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.2), metal);
    this.bar.position.set(-1, 0, 0.13);
    [-0.5, 0.5].forEach((x) => {
      const guide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.25), metal);
      guide.position.set(x, 0, 0.12);
      this.object3D.add(guide);
    });
    const { texture } = createSymbolTexture(symbol, "#f7e6ad", "#292520");
    this.symbolTexture = texture;
    const emblem = new THREE.Mesh(
      new THREE.PlaneGeometry(0.43, 0.43),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.52 }),
    );
    emblem.position.set(0, 0, 0.235);
    this.object3D.add(plate, this.bar, emblem);
    this.object3D.traverse((part) => {
      if (part.isMesh) part.castShadow = true;
    });
  }
  interact(player) {
    if (this.unlocked || !player?.hasSelected(this.keyId)) return;
    player.removeItemFromInventory(this.keyId);
    this.unlock();
    this.onUnlock?.();
  }
  unlock() {
    this.unlocked = true;
    this.setEnabled(false);
  }
  update(delta) {
    this.bar.position.x = THREE.MathUtils.damp(this.bar.position.x, this.unlocked ? 0.35 : -1, 5, delta);
  }
  getInteractionText(player) {
    if (this.unlocked) return null;
    return player?.hasSelected(this.keyId)
      ? tInteraction("insert", tItem(this.keyId))
      : tInteraction("needItem", tItem(this.keyId));
  }
  dispose() {
    this.symbolTexture?.dispose();
  }
}

export { FinalBolt };
