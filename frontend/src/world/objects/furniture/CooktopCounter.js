import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { HingedPanelManager } from "../helpers/HingedPanelManager.js";
import { loadTexture } from "../helpers/loadTexture.js";
import { createRoundedPullHandle } from "../helpers/createRoundedPullHandle.js";

class CooktopCounter extends Entity {
  constructor({
    id = "kitchen-cooktop-counter",
    position = new THREE.Vector3(),
    rotationY = 0,
    width = 3,
    cabinetColor = 0x6b4b35,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.panelManager = new HingedPanelManager({ ownerId: id });

    const cabinet = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: loadTexture({
        path: "/textures/furniture/kitchen-cabinet-sage-enamel.png",
        repeat: { x: Math.max(1, width / 3), y: 1.35 },
      }),
      roughness: 0.72,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x171819, roughness: 0.28, metalness: 0.48 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x99958c, roughness: 0.25, metalness: 0.72 });
    const brass = new THREE.MeshStandardMaterial({ color: 0x8d6737, roughness: 0.42, metalness: 0.58 });
    const interior = new THREE.MeshStandardMaterial({
      color: cabinetColor,
      map: loadTexture({
        path: "/textures/furniture/wood2.jpg",
        repeat: { x: Math.max(1, width / 3), y: 1.2 },
      }),
      roughness: 0.82,
    });
    const marble = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: loadTexture({
        path: "/textures/furniture/kitchen-marble.png",
        repeat: { x: Math.max(1, width / 3), y: 1 },
      }),
      roughness: 0.34,
      metalness: 0.02,
    });

    this.object3D.add(
      createBox({
        width: 0.15,
        height: 2.55,
        depth: 2.15,
        position: new THREE.Vector3(-width / 2 + 0.075, 1.275, 0),
        material: interior,
      }),
      createBox({
        width: 0.15,
        height: 2.55,
        depth: 2.15,
        position: new THREE.Vector3(width / 2 - 0.075, 1.275, 0),
        material: interior,
      }),
      createBox({
        width: width - 0.3,
        height: 0.15,
        depth: 2.15,
        position: new THREE.Vector3(0, 0.075, 0),
        material: interior,
      }),
      createBox({
        width: width - 0.3,
        height: 2.4,
        depth: 0.15,
        position: new THREE.Vector3(0, 1.275, -1),
        material: interior,
      }),
      createBox({
        width: width + 0.18,
        height: 0.18,
        depth: 2.32,
        position: new THREE.Vector3(0, 2.65, 0.04),
        material: marble,
      }),
      createBox({
        width: width - 0.22,
        height: 0.43,
        depth: 0.15,
        position: new THREE.Vector3(0, 2.32, 1.12),
        material: metal,
      }),
    );

    const cookingCenterX = 0;
    const burnerOffsetX = Math.min(0.68, width / 2 - 0.55);
    [
      [-burnerOffsetX, -0.58],
      [burnerOffsetX, -0.58],
      [-burnerOffsetX, 0.58],
      [burnerOffsetX, 0.58],
    ].forEach(([offsetX, z]) => {
      const x = cookingCenterX + offsetX;
      const burnerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.075, 24), brass);
      burnerBase.position.set(x, 2.79, z);
      const burnerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.09, 24), dark);
      burnerCap.position.set(x, 2.85, z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.045, 10, 28), dark);
      ring.position.set(x, 2.78, z);
      ring.rotation.x = Math.PI / 2;
      this.object3D.add(burnerBase, burnerCap, ring);
      [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].forEach((angle) => {
        const support = createBox({
          width: 0.78,
          height: 0.07,
          depth: 0.07,
          position: new THREE.Vector3(x, 2.84, z),
          material: dark,
        });
        support.rotation.y = angle;
        this.object3D.add(support);
      });
    });

    const doorWidth = width - 0.22;
    const door = new THREE.Group();
    door.position.set(-doorWidth / 2, 1.13, 1.12);
    const handle = createRoundedPullHandle({ material: metal });
    handle.position.set(doorWidth - 0.32, 0.48, 0.13);
    door.add(
      createBox({
        width: doorWidth,
        height: 1.98,
        depth: 0.12,
        position: new THREE.Vector3(doorWidth / 2, 0, 0),
        material: cabinet,
      }),
      handle,
    );
    this.object3D.add(door);
    this.panelManager.register({ panel: door, openRotation: -Math.PI / 2 });

    [-0.92, -0.3, 0.32, 0.94].forEach((offsetX) => {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 18), metal);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(cookingCenterX + offsetX, 2.32, 1.23);
      this.object3D.add(knob);
    });
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

export { CooktopCounter };
