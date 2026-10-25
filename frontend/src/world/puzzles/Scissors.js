import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class Scissors extends Entity {
  constructor({ id = "living-room-scissors", onCollect = null } = {}) {
    super(id);
    this.inventoryIcon = "/images/icons/living-room/scissors.png";
    this.onCollect = onCollect;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    const metal = new THREE.MeshStandardMaterial({ color: 0x9ba0a2, metalness: 0.9, roughness: 0.24 });
    const handle = new THREE.MeshStandardMaterial({ color: 0x5b352d, roughness: 0.7 });
    for (const angle of [-0.22, 0.22]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.72, 0.035), metal);
      blade.position.y = 0.36;
      blade.rotation.z = angle;
      this.object3D.add(blade);
    }
    for (const x of [-0.12, 0.12]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), handle);
      loop.position.set(x, -0.14, 0);
      this.object3D.add(loop);
    }
    this.setEnabled(false);
  }

  interact(player) {
    if (!player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem("scissors")) : null;
  }
}

export { Scissors };
