import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class GlobePushpin extends Entity {
  constructor({ onCollect = null } = {}) {
    super("globe-pushpin");
    this.onCollect = onCollect;
    this.object3D = new THREE.Group();
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: .35 });
    const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: .85, roughness: .22 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 20, 14), headMaterial);
    head.position.y = .12;
    const needle = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .38, 10), metalMaterial);
    needle.position.y = -.12;
    this.object3D.add(head, needle);
  }

  interact(player) {
    if (!this.enabled || !player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() { return this.enabled && this.object3D.visible ? tInteraction("pickUp", tItem(this.id)) : null; }
}

export { GlobePushpin };
