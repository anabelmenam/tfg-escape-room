import * as THREE from "three";
import { Entity } from "../Entity.js";

class WallClock extends Entity {
  constructor({
    id = "wall-clock",
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    hour = 8,
    minute = 20,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a2a17, roughness: 0.45 });
    const ink = new THREE.MeshStandardMaterial({ color: 0x211b1a, roughness: 0.45 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.07, 10, 48), wood);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 48),
      new THREE.MeshStandardMaterial({ color: 0xe0d2ae, roughness: 0.9 }),
    );
    face.position.z = 0.03;
    this.object3D.add(face, rim);
    for (let index = 0; index < 60; index += 1) {
      const major = index % 5 === 0;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(major ? 0.025 : 0.009, major ? 0.08 : 0.03, 0.01), ink);
      const angle = (index * Math.PI) / 30;
      tick.position.set(Math.sin(angle) * 0.48, Math.cos(angle) * 0.48, 0.045);
      tick.rotation.z = -angle;
      this.object3D.add(tick);
    }
    this.hourPivot = this.createHand("hour", 0.27, 0.065, 0.07, ink);
    this.minutePivot = this.createHand("minute", 0.41, 0.035, 0.11, ink);
    this.hub = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), wood);
    this.hub.position.z = 0.14;
    this.object3D.add(this.hub);
    this.setTime(hour, minute);
  }

  createHand(name, length, width, z, material) {
    const pivot = new THREE.Group();
    pivot.position.z = z;
    const hand = new THREE.Mesh(new THREE.BoxGeometry(width, length, 0.025), material);
    hand.position.y = length / 2;
    hand.userData.clockHand = name;
    pivot.add(hand);
    this.object3D.add(pivot);
    return pivot;
  }

  setTime(hour, minute) {
    this.hour = ((hour % 12) + 12) % 12;
    this.minute = ((minute % 60) + 60) % 60;
    this.hourPivot.rotation.z = (-this.hour * Math.PI) / 6;
    this.minutePivot.rotation.z = (-this.minute * Math.PI) / 30;
  }

  getFocusPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3(0, 0, 2.2));
  }

  getLookAtPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3());
  }
}

export { WallClock };
