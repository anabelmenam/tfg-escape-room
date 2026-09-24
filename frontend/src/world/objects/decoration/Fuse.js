import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Fuse extends Entity {
  constructor({ id = "fuse", position = new THREE.Vector3(), scale = 1 } = {}) {
    super(id);
    this.inventoryIcon = "/images/icons/fuse.png";
    this.object3D = this.createObject();
    this.object3D.position.copy(position);
    this.object3D.scale.setScalar(scale);
  }

  createObject() {
    const group = new THREE.Group();
    const ceramic = new THREE.MeshStandardMaterial({ color: 0xe9ded0, roughness: 0.5 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xc79a45, metalness: 0.85, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.65, 16), ceramic);
    const leftCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.11, 16), metal);
    const rightCap = leftCap.clone();
    body.rotation.z = Math.PI / 2;
    leftCap.rotation.z = Math.PI / 2;
    rightCap.rotation.z = Math.PI / 2;
    leftCap.position.x = -0.38;
    rightCap.position.x = 0.38;
    body.castShadow = true;
    leftCap.castShadow = true;
    rightCap.castShadow = true;
    group.add(body, leftCap, rightCap);

    return group;
  }

  interact(player) {
    if (!player?.inventory.add(this)) {
      return;
    }

    this.object3D.visible = false;
    this.setEnabled(false);
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null;
  }
}

export { Fuse };
