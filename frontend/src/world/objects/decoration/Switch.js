import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction } from "../../../translations/index.js";

class Switch extends Entity {
  constructor({ id, onPress, position, scale = 1, powerAvailable = true } = {}) {
    super(id);
    this.object3D = new THREE.Group();

    this.onPress = onPress;
    this.powerAvailable = powerAvailable;

    this.createPlate();
    this.createLever();

    this.offRotation = Math.PI / 8;
    this.onRotation = -Math.PI / 8;

    this.object3D.position.copy(position);
    this.object3D.scale.setScalar(scale);
    this.setActive(false);
  }

  createPlate() {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0xf2f2f2,
        metalness: 0.15,
        roughness: 0.5,
      }),
    );

    this.object3D.add(plate);
  }

  createLever() {
    this.lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.175, 0.45, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.3,
        roughness: 0.45,
      }),
    );

    this.lever.position.z = 0.1;

    this.object3D.add(this.lever);
  }

  setActive(active) {
    this.active = active;

    this.lever.rotation.x = active ? this.onRotation : this.offRotation;
  }

  press() {
    if (!this.powerAvailable) {
      return;
    }

    this.setActive(!this.active);

    if (this.onPress) {
      this.onPress(this);
    }
  }

  interact() {
    this.press();
  }

  setPowerAvailable(available) {
    this.powerAvailable = available;

    if (!available) {
      this.setActive(false);
    }
  }

  getInteractionText() {
    return this.powerAvailable ? tInteraction("pressSwitch") : tInteraction("noPower");
  }
}

export { Switch };
