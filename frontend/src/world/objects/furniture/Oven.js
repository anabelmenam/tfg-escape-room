import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { HingedPanelManager } from "../helpers/HingedPanelManager.js";
import { createRoundedPullHandle } from "../helpers/createRoundedPullHandle.js";
import { loadTexture } from "../helpers/loadTexture.js";

class Oven extends Entity {
  constructor({
    id = "kitchen-oven",
    position = new THREE.Vector3(),
    rotationY = 0,
    width = 2.8,
    height = 7.2,
    bodyColor = 0xddd8ca,
    cabinetColor = 0x6b4b35,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.panelManager = new HingedPanelManager({ ownerId: id, speed: 6 });

    const cabinet = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: loadTexture({
        path: "/textures/furniture/kitchen-cabinet-sage-enamel.png",
        repeat: { x: 1.15, y: 1.8 },
      }),
      roughness: 0.72,
    });
    const body = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.18 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x172126, roughness: 0.16, metalness: 0.28 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x92918b, roughness: 0.24, metalness: 0.75 });
    const enamel = new THREE.MeshStandardMaterial({ color: 0x111416, roughness: 0.34, metalness: 0.22 });
    const displayMaterial = new THREE.MeshStandardMaterial({
      color: 0x182126,
      emissive: 0x35505a,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.22,
    });

    const frame = new THREE.MeshStandardMaterial({
      color: cabinetColor,
      map: loadTexture({ path: "/textures/furniture/wood2.jpg", repeat: { x: 1.15, y: 1.8 } }),
      roughness: 0.84,
    });
    this.object3D.add(
      createBox({ width: 0.16, height, depth: 2.4, position: new THREE.Vector3(-width / 2 + 0.08, height / 2, 0), material: frame }),
      createBox({ width: 0.16, height, depth: 2.4, position: new THREE.Vector3(width / 2 - 0.08, height / 2, 0), material: frame }),
      createBox({ width: width - 0.32, height: 0.16, depth: 2.4, position: new THREE.Vector3(0, 0.08, 0), material: frame }),
      createBox({ width: width - 0.32, height: 0.16, depth: 2.4, position: new THREE.Vector3(0, height - 0.08, 0), material: frame }),
      createBox({ width: width - 0.32, height: height - 0.32, depth: 0.16, position: new THREE.Vector3(0, height / 2, -1.12), material: frame }),
      createBox({ width: width - 0.48, height: 2.12, depth: 0.1, position: new THREE.Vector3(0, 3.65, -1.02), material: enamel }),
      createBox({ width: 0.12, height: 2.12, depth: 2.1, position: new THREE.Vector3(-width / 2 + 0.27, 3.65, 0), material: enamel }),
      createBox({ width: 0.12, height: 2.12, depth: 2.1, position: new THREE.Vector3(width / 2 - 0.27, 3.65, 0), material: enamel }),
      createBox({ width: width - 0.48, height: 0.12, depth: 2.1, position: new THREE.Vector3(0, 2.62, 0), material: enamel }),
      createBox({ width: width - 0.48, height: 0.12, depth: 2.1, position: new THREE.Vector3(0, 4.68, 0), material: enamel }),
      createBox({ width: width - 0.1, height: 0.16, depth: 2.4, position: new THREE.Vector3(0, 2.43, -0.02), material: frame }),
      createBox({ width: width - 0.1, height: 0.16, depth: 2.4, position: new THREE.Vector3(0, 4.98, -0.02), material: frame }),
      createBox({ width: width - 0.22, height: 0.44, depth: 0.16, position: new THREE.Vector3(0, 4.68, 1.27), material: body }),
      createBox({ width: 0.68, height: 0.23, depth: 0.07, position: new THREE.Vector3(0, 4.68, 1.39), material: displayMaterial }),
    );

    [-0.88, 0.88].forEach((x, index) => {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.13, 24), metal);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(x, 4.68, 1.43);
      knob.castShadow = true;
      const marker = createBox({
        width: 0.035,
        height: 0.11,
        depth: 0.025,
        position: new THREE.Vector3(x, 4.75 - index * 0.025, 1.51),
        material: enamel,
      });
      this.object3D.add(knob, marker);
    });
    [-0.3, 0, 0.3].forEach((x) => {
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 18), metal);
      button.rotation.x = Math.PI / 2;
      button.position.set(x, 4.5, 1.43);
      button.castShadow = true;
      this.object3D.add(button);
    });

    [3.08, 3.72].forEach((rackY) => {
      [-0.82, -0.42, 0, 0.42, 0.82].forEach((rackZ) => {
        this.object3D.add(
          createBox({ width: width - 0.58, height: 0.045, depth: 0.045, position: new THREE.Vector3(0, rackY, rackZ), material: metal }),
        );
      });
      [-0.82, 0, 0.82].forEach((rackX) => {
        this.object3D.add(
          createBox({ width: 0.045, height: 0.045, depth: 1.72, position: new THREE.Vector3(rackX, rackY, 0), material: metal }),
        );
      });
    });

    const lowerDoorWidth = width - 0.08;
    const lowerDoor = new THREE.Group();
    lowerDoor.position.set(-lowerDoorWidth / 2, 1.28, 1.27);
    const lowerHandle = createRoundedPullHandle({ material: metal, height: 0.72 });
    lowerHandle.position.set(lowerDoorWidth - 0.32, 0, 0.14);
    lowerDoor.add(
      createBox({ width: lowerDoorWidth, height: 2.48, depth: 0.14, position: new THREE.Vector3(lowerDoorWidth / 2, 0, 0), material: cabinet }),
      lowerHandle,
    );
    this.object3D.add(lowerDoor);
    this.panelManager.register({ panel: lowerDoor, index: 0, openRotation: -Math.PI / 2 });

    const ovenDoorHeight = 1.82;
    const ovenDoor = new THREE.Group();
    ovenDoor.position.set(0, 2.53, 1.27);
    ovenDoor.add(
      createBox({ width: width - 0.22, height: ovenDoorHeight, depth: 0.14, position: new THREE.Vector3(0, ovenDoorHeight / 2, 0), material: body }),
      createBox({ width: width - 0.52, height: 1.16, depth: 0.08, position: new THREE.Vector3(0, ovenDoorHeight / 2 - 0.1, 0.12), material: glass }),
      createBox({ width: width - 0.5, height: 0.12, depth: 0.12, position: new THREE.Vector3(0, ovenDoorHeight - 0.1, 0.16), material: metal }),
    );
    this.object3D.add(ovenDoor);
    this.panelManager.register({ panel: ovenDoor, index: 1, axis: "x", openRotation: Math.PI / 2 });

    const upperDoorWidth = width - 0.08;
    const upperDoor = new THREE.Group();
    upperDoor.position.set(-upperDoorWidth / 2, 6.03, 1.27);
    const upperHandle = createRoundedPullHandle({ material: metal, height: 0.72 });
    upperHandle.position.set(upperDoorWidth - 0.32, 0, 0.14);
    upperDoor.add(
      createBox({ width: upperDoorWidth, height: 2.28, depth: 0.14, position: new THREE.Vector3(upperDoorWidth / 2, 0, 0), material: cabinet }),
      upperHandle,
    );
    this.object3D.add(upperDoor);
    this.panelManager.register({ panel: upperDoor, index: 2, openRotation: -Math.PI / 2 });
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

export { Oven };
