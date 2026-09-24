import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction } from "../../../translations/index.js";

class Button extends Entity {
  constructor({ id, onPress } = {}) {
    super(id);

    this.onPress = onPress;

    this.object3D = new THREE.Group();

    this.createBase();
    this.createButton();
  }

  createBase() {
    const geometry = new THREE.BoxGeometry(3, 3, 0.6);

    const material = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });

    const base = new THREE.Mesh(geometry, material);

    base.castShadow = true;
    base.receiveShadow = true;

    this.object3D.add(base);
  }

  createButton() {
    const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 32);

    this.buttonMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.5,
    });

    this.button = new THREE.Mesh(geometry, this.buttonMaterial);

    this.button.rotation.x = Math.PI / 2;

    this.button.position.z = 0.55;

    this.button.castShadow = true;
    this.button.receiveShadow = true;

    this.object3D.add(this.button);
  }

  getInteractionText() {
    return tInteraction("pressButton");
  }

  setActive(active) {
    this.buttonMaterial.color.set(active ? 0x00ff00 : 0xff0000);
  }

  press() {
    if (typeof this.onPress === "function") {
      this.onPress(this);
    }
  }

  interact() {
    this.press();
  }

  update() {}
}

export { Button };
