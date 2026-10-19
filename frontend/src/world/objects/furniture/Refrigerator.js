import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { HingedPanelManager } from "../helpers/HingedPanelManager.js";

class Refrigerator extends Entity {
  constructor({ id = "kitchen-refrigerator", position = new THREE.Vector3(), rotationY = 0, color = 0xc9cbc5 } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.panelManager = new HingedPanelManager({ ownerId: id, speed: 6 });

    const body = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.18 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x777872, roughness: 0.25, metalness: 0.7 });
    const interior = new THREE.MeshStandardMaterial({ color: 0xd9ddd8, roughness: 0.65 });
    const shadow = new THREE.MeshStandardMaterial({ color: 0x333a3a, roughness: 0.78 });
    const shelfMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc9e0df,
      transparent: true,
      opacity: 0.62,
      roughness: 0.18,
      transmission: 0.22,
    });
    this.object3D.add(
      createBox({ width: 0.18, height: 7.2, depth: 3, position: new THREE.Vector3(-1.66, 3.6, 0), material: body }),
      createBox({ width: 0.18, height: 7.2, depth: 3, position: new THREE.Vector3(1.66, 3.6, 0), material: body }),
      createBox({ width: 3.14, height: 0.18, depth: 3, position: new THREE.Vector3(0, 0.09, 0), material: body }),
      createBox({ width: 3.14, height: 0.18, depth: 3, position: new THREE.Vector3(0, 7.11, 0), material: body }),
      createBox({ width: 3.14, height: 0.16, depth: 2.85, position: new THREE.Vector3(0, 2.22, 0), material: body }),
      createBox({ width: 3.14, height: 7.02, depth: 0.16, position: new THREE.Vector3(0, 3.6, -1.42), material: body }),
      createBox({ width: 3.06, height: 4.55, depth: 0.1, position: new THREE.Vector3(0, 4.72, -1.38), material: interior }),
      createBox({ width: 0.12, height: 4.55, depth: 2.65, position: new THREE.Vector3(-1.5, 4.72, 0), material: interior }),
      createBox({ width: 0.12, height: 4.55, depth: 2.65, position: new THREE.Vector3(1.5, 4.72, 0), material: interior }),
      createBox({ width: 3.04, height: 1.86, depth: 0.1, position: new THREE.Vector3(0, 1.16, -1.37), material: shadow }),
      createBox({ width: 0.1, height: 1.86, depth: 2.62, position: new THREE.Vector3(-1.5, 1.16, 0), material: shadow }),
      createBox({ width: 0.1, height: 1.86, depth: 2.62, position: new THREE.Vector3(1.5, 1.16, 0), material: shadow }),
    );

    [3.25, 4.45, 5.65].forEach((y) => {
      this.object3D.add(
        createBox({ width: 2.86, height: 0.08, depth: 2.42, position: new THREE.Vector3(0, y, 0.08), material: shelfMaterial }),
        createBox({ width: 2.86, height: 0.07, depth: 0.08, position: new THREE.Vector3(0, y + 0.08, 1.28), material: trim }),
      );
    });
    this.object3D.add(
      createBox({ width: 2.72, height: 0.75, depth: 1.95, position: new THREE.Vector3(0, 2.72, 0.18), material: shelfMaterial }),
      createBox({ width: 2.86, height: 0.08, depth: 2.4, position: new THREE.Vector3(0, 1.05, 0.08), material: trim }),
    );

    const createDoor = ({ index, y, height, handleY }) => {
      const width = 3.18;
      const door = new THREE.Group();
      door.position.set(-width / 2, y, 1.59);
      door.add(
        createBox({ width, height, depth: 0.14, position: new THREE.Vector3(width / 2, 0, 0), material: body }),
        createBox({ width: 0.13, height: Math.min(1.45, height * 0.55), depth: 0.13, position: new THREE.Vector3(width - 0.35, handleY, 0.16), material: trim }),
      );
      const binLevels = index === 0 ? [-1.45, -0.15, 1.15] : [-0.28, 0.38];
      binLevels.forEach((binY) => {
        door.add(
          createBox({ width: width - 0.48, height: 0.08, depth: 0.42, position: new THREE.Vector3(width / 2, binY, -0.23), material: interior }),
          createBox({ width: width - 0.48, height: 0.25, depth: 0.07, position: new THREE.Vector3(width / 2, binY + 0.12, -0.43), material: shelfMaterial }),
        );
      });
      this.object3D.add(door);
      this.panelManager.register({ panel: door, index, openRotation: -Math.PI / 2 });
    };
    createDoor({ index: 0, y: 4.72, height: 4.66, handleY: -0.45 });
    createDoor({ index: 1, y: 1.15, height: 1.94, handleY: 0 });
  }

  getInteractables() {
    return this.panelManager.getInteractables();
  }

  update(deltaTime) {
    this.panelManager.update(deltaTime);
  }

  setAudioListener(listener) {
    this.panelManager.setAudioListener(listener, this.object3D);
  }

  dispose() {
    this.panelManager.dispose();
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Refrigerator };
