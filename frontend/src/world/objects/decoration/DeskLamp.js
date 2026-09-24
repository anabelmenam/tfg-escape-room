import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction } from "../../../translations/index.js";

class DeskLamp extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    scale = 1,
    targetOffset = new THREE.Vector3(0, 0, 0.8),
    onToggle = null,
    powerAvailable = true,
  } = {}) {
    super(id);

    this.onToggle = onToggle;
    this.powerAvailable = powerAvailable;
    this.isActive = false;
    this.object3D = new THREE.Group();
    this.object3D.name = id ?? "desk-lamp";
    this.object3D.position.copy(position);
    this.object3D.rotation.copy(rotation);
    this.object3D.scale.setScalar(scale);

    this.createModel();
    this.createLight(targetOffset);
    this.setActive(false, { notify: false });
  }

  createModel() {
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x25282b,
      roughness: 0.38,
      metalness: 0.75,
    });
    const shadeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d4449,
      roughness: 0.5,
      metalness: 0.55,
      side: THREE.DoubleSide,
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 24), metalMaterial);
    base.position.y = 0.06;

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.5, 16), metalMaterial);
    stem.position.set(-0.2, 0.6, 0);
    stem.rotation.z = -0.18;

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.56, 16), metalMaterial);
    arm.position.set(0.09, 1.35, 0);
    arm.rotation.z = -Math.PI / 2.06;

    this.shade = new THREE.Group();
    this.shade.position.set(0.37, 1.15, 0);

    this.shade.rotation.z = Math.PI / 7;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.42, 0.55, 24, 1, true), shadeMaterial);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 24), metalMaterial);
    rim.position.y = -0.275;
    rim.rotation.x = Math.PI / 2;
    this.shade.add(cone, rim);

    this.bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d4d42,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), this.bulbMaterial);
    bulb.position.set(0.48, 0.98, 0);

    bulb.castShadow = false;

    [base, stem, arm, bulb].forEach((piece) => {
      piece.castShadow = true;
      piece.receiveShadow = true;
      piece.userData.ignoreAging = true;
    });
    bulb.castShadow = false;
    this.shade.traverse((piece) => {
      if (piece.isMesh) {
        piece.castShadow = false;
        piece.receiveShadow = true;
        piece.userData.ignoreAging = true;
      }
    });

    this.object3D.add(base, stem, arm, this.shade, bulb);
  }

  createLight(targetOffset) {

    this.light = new THREE.SpotLight(0x8b63ff, 300, 1.9, Math.PI / 6, 0.72, 1.7);
    this.light.position.set(0.48, 0.98, 0);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(512, 512);
    this.light.shadow.camera.near = 0.1;
    this.light.shadow.camera.far = 2;

    this.lightTarget = new THREE.Object3D();
    this.lightTarget.position.copy(targetOffset);
    this.light.target = this.lightTarget;

    this.object3D.add(this.light, this.lightTarget);
  }

  setActive(active, { notify = true } = {}) {
    const changed = this.isActive !== active;
    this.isActive = active;
    this.light.intensity = active ? 300 : 0;
    this.bulbMaterial.color.setHex(active ? 0xb99cff : 0x4d4d42);
    this.bulbMaterial.emissive.setHex(active ? 0x6d3cff : 0x000000);
    this.bulbMaterial.emissiveIntensity = active ? 2.4 : 0;

    if (changed && notify) {
      this.onToggle?.(active, this);
    }
  }

  getActive() {
    return this.isActive;
  }

  interact() {
    if (!this.powerAvailable) {
      return;
    }

    this.setActive(!this.isActive);
  }

  setPowerAvailable(available) {
    this.powerAvailable = available;

    if (!available) {
      this.setActive(false, { notify: false });
    }
  }

  getInteractionText() {
    if (!this.powerAvailable) {
      return tInteraction("noPower");
    }

    return this.isActive ? tInteraction("turnOffLamp") : tInteraction("turnOnLamp");
  }
}

export { DeskLamp };
