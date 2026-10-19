import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { HingedPanelManager } from "../helpers/HingedPanelManager.js";
import { createRoundedPullHandle } from "../helpers/createRoundedPullHandle.js";
import { loadTexture } from "../helpers/loadTexture.js";

class KitchenTallCabinet extends Entity {
  constructor({
    id = "kitchen-tall-cabinet",
    position = new THREE.Vector3(),
    rotationY = 0,
    width = 3,
    height = 7,
    depth = 2.5,
    color = 0x6b4b35,
    handleColor = 0xaaa9a2,
    hingeSide = "left",
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.panelManager = new HingedPanelManager({ ownerId: id });

    const paintMap = loadTexture({
      path: "/textures/furniture/kitchen-cabinet-sage-enamel.png",
      repeat: { x: 1.2, y: 2.2 },
    });
    const wood = new THREE.MeshStandardMaterial({ color: 0xffffff, map: paintMap, roughness: 0.72 });
    const dark = new THREE.MeshStandardMaterial({
      color,
      map: loadTexture({ path: "/textures/furniture/wood2.jpg", repeat: { x: 1.2, y: 2.2 } }),
      roughness: 0.86,
    });
    const metal = new THREE.MeshStandardMaterial({ color: handleColor, roughness: 0.25, metalness: 0.7 });

    const frameThickness = 0.16;
    this.object3D.add(
      createBox({ width: frameThickness, height, depth, position: new THREE.Vector3(-width / 2 + frameThickness / 2, height / 2, 0), material: dark }),
      createBox({ width: frameThickness, height, depth, position: new THREE.Vector3(width / 2 - frameThickness / 2, height / 2, 0), material: dark }),
      createBox({ width: width - frameThickness * 2, height: frameThickness, depth, position: new THREE.Vector3(0, frameThickness / 2, 0), material: dark }),
      createBox({ width: width - frameThickness * 2, height: frameThickness, depth, position: new THREE.Vector3(0, height - frameThickness / 2, 0), material: dark }),
      createBox({ width: width - frameThickness * 2, height: height - frameThickness * 2, depth: frameThickness, position: new THREE.Vector3(0, height / 2, -depth / 2 + frameThickness / 2), material: dark }),
      createBox({ width: width - 0.3, height: 0.12, depth: depth - 0.3, position: new THREE.Vector3(0, height * 0.36, 0), material: dark }),
      createBox({ width: width - 0.3, height: 0.12, depth: depth - 0.3, position: new THREE.Vector3(0, height * 0.68, 0), material: dark }),
    );

    const hingeSign = hingeSide === "right" ? 1 : -1;
    const doorWidth = width - 0.24;
    const door = new THREE.Group();
    door.position.set(hingeSign * (width / 2 - 0.12), height / 2, depth / 2 + 0.04);
    const handle = createRoundedPullHandle({ material: metal, height: 1.05 });
    handle.position.set(-hingeSign * (doorWidth - 0.32), 0, 0.15);
    door.add(
      createBox({ width: doorWidth, height: height - 0.24, depth: 0.14, position: new THREE.Vector3(-hingeSign * doorWidth / 2, 0, 0), material: wood }),
      handle,
    );
    this.object3D.add(door);
    this.panelManager.register({ panel: door, openRotation: hingeSign < 0 ? -Math.PI / 2 : Math.PI / 2 });
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

export { KitchenTallCabinet };
