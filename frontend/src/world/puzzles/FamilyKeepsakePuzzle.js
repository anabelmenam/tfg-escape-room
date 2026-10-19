import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class FamilyKeepsake extends Entity {
  constructor({ id, position = new THREE.Vector3(), kind = "locket", onCollect = null } = {}) {
    super(id);
    this.onCollect = onCollect;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);

    const brass = new THREE.MeshStandardMaterial({ color: 0xa87835, metalness: 0.72, roughness: 0.28 });
    const darkBrass = new THREE.MeshStandardMaterial({ color: 0x68421f, metalness: 0.55, roughness: 0.42 });
    if (kind === "watch") {
      const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 24), brass);
      caseMesh.rotation.x = Math.PI / 2;
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshStandardMaterial({ color: 0xe4d3a3, roughness: 0.85 }));
      face.position.z = 0.04;
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.1, 0.015), darkBrass);
      hand.position.set(0.035, 0.035, 0.05);
      hand.rotation.z = -0.7;
      this.object3D.add(caseMesh, face, hand);
    } else if (kind === "figure") {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.1, 16), darkBrass);
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 12), brass);
      body.position.y = 0.22;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), brass);
      head.position.y = 0.47;
      this.object3D.add(base, body, head);
    } else {
      const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 24), brass);
      pendant.rotation.x = Math.PI / 2;
      const inset = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), darkBrass);
      inset.position.z = 0.04;
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 16), brass);
      loop.position.y = 0.2;
      this.object3D.add(pendant, inset, loop);
    }
    this.object3D.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.object3D.visible = false;
    this.setEnabled(false);
  }

  reveal() {
    this.object3D.visible = true;
    this.setEnabled(true);
  }

  collect(player) {
    if (!player?.inventory.add(this)) return false;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
    return true;
  }

  interact(player) {
    this.collect(player);
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem("family-keepsake")) : null;
  }
}

export { FamilyKeepsake };
