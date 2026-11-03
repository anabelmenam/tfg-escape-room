import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { loadTexture } from "../helpers/loadTexture.js";

class KitchenWallCabinet extends Entity {
  constructor({
    id = "kitchen-wall-cabinet",
    position = new THREE.Vector3(),
    rotationY = 0,
    width = 5,
    color = 0x6b4b35,
    handleColor = 0xaaa9a2,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    const paintMap = loadTexture({
      path: "/textures/furniture/kitchen-cabinet-sage-enamel.png",
      repeat: { x: Math.max(1, width / 3), y: 1.3 },
    });
    const wood = new THREE.MeshStandardMaterial({ color: 0xffffff, map: paintMap, roughness: 0.72 });
    const dark = new THREE.MeshStandardMaterial({
      color,
      map: loadTexture({ path: "/textures/furniture/wood2.jpg", repeat: { x: Math.max(1, width / 3), y: 1.3 } }),
      roughness: 0.86,
    });
    const metal = new THREE.MeshStandardMaterial({ color: handleColor, roughness: 0.25, metalness: 0.7 });
    const doorWidth = (width - 0.18) / 2;

    this.object3D.add(
      createBox({ width, height: 2.8, depth: 1.25, position: new THREE.Vector3(0, 0, 0), material: dark }),
      createBox({
        width: doorWidth,
        height: 2.5,
        depth: 0.12,
        position: new THREE.Vector3(-doorWidth / 2 - 0.03, 0, 0.68),
        material: wood,
      }),
      createBox({
        width: doorWidth,
        height: 2.5,
        depth: 0.12,
        position: new THREE.Vector3(doorWidth / 2 + 0.03, 0, 0.68),
        material: wood,
      }),
      createBox({
        width: 0.1,
        height: 0.72,
        depth: 0.1,
        position: new THREE.Vector3(-0.27, -0.35, 0.8),
        material: metal,
      }),
      createBox({
        width: 0.1,
        height: 0.72,
        depth: 0.1,
        position: new THREE.Vector3(0.27, -0.35, 0.8),
        material: metal,
      }),
    );
  }
}

export { KitchenWallCabinet };
