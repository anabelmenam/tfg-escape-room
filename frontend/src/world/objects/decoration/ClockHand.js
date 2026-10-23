import * as THREE from "three";
import { Entity } from "../Entity.js";

class ClockHand extends Entity {
  constructor() {
    super("clock-hand");
    this.inventoryIcon = "/images/icons/bedroom/clock-hand.png";
    this.object3D = new THREE.Group();
    this.object3D.name = this.id;
    const metal = new THREE.MeshStandardMaterial({ color: 0x211b1a, metalness: 0.6, roughness: 0.35 });
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.41, 0.025), metal);
    hand.position.y = 0.205;
    const hub = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 20), metal);
    this.object3D.add(hand, hub);
    this.object3D.scale.setScalar(1.6);
  }

  getInteractionText() {
    return this.object3D.visible ? "[E] Recoger aguja del reloj" : null;
  }

  interact(player) {
    if (!this.enabled || !player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
  }
}

export { ClockHand };
