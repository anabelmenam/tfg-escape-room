import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Crowbar extends Entity {
  constructor({ id = "crowbar", onCollect = null } = {}) {
    super(id);
    this.itemName = "crowbar";
    this.inventoryIcon = "/images/icons/children-room/crowbar.png";
    this.onCollect = onCollect;
    this.object3D = new THREE.Group();
    this.object3D.name = id;

    const paintedSteel = new THREE.MeshStandardMaterial({ color: 0x8c2824, metalness: 0.82, roughness: 0.37 });
    const bareSteel = new THREE.MeshStandardMaterial({ color: 0x55585a, metalness: 0.9, roughness: 0.25 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x2d3031, metalness: 0.82, roughness: 0.44 });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 3.05, 24), paintedSteel);
    const hookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.48, 0),
      new THREE.Vector3(0, 1.72, 0),
      new THREE.Vector3(0.12, 1.93, 0),
      new THREE.Vector3(0.36, 2.01, 0),
      new THREE.Vector3(0.57, 1.89, 0),
      new THREE.Vector3(0.61, 1.66, 0),
    ]);
    const hookedEnd = new THREE.Mesh(new THREE.TubeGeometry(hookCurve, 40, 0.1, 14, false), paintedSteel);
    const hookTip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.16), bareSteel);
    hookTip.position.set(0.59, 1.56, 0);
    hookTip.rotation.z = -0.18;

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.46, 0.18), darkSteel);
    neck.position.set(0, -1.68, 0);
    neck.rotation.z = -0.13;
    const leftProng = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, 0.17), bareSteel);
    leftProng.position.set(-0.15, -1.98, 0);
    leftProng.rotation.z = -0.2;
    const rightProng = leftProng.clone();
    rightProng.position.x = 0.15;
    rightProng.rotation.z = 0.2;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.18, 20), darkSteel);
    collar.position.y = -1.47;

    this.object3D.add(shaft, hookedEnd, hookTip, neck, leftProng, rightProng, collar);
    this.object3D.rotation.z = Math.PI / 2;
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

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null;
  }
}

export { Crowbar };
