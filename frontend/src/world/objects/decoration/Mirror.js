import * as THREE from "three";
import { Entity } from "../Entity.js";

class Mirror extends Entity {
  constructor({ id = "mirror", position = new THREE.Vector3(), rotationY = 0, scale = 1 } = {}) {
    super(id);
    const group = new THREE.Group();
    group.name = id;
    group.position.copy(position);
    group.rotation.y = rotationY;
    group.scale.setScalar(scale);
    const frame = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.42 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x536b73, roughness: 0.16, metalness: 0.72 });
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 2.1), glass);
    mirror.position.z = 0.07;
    const pieces = [
      [1.9, 0.14, 0, 1.12],
      [1.9, 0.14, 0, -1.12],
      [0.14, 2.4, -0.88, 0],
      [0.14, 2.4, 0.88, 0],
    ].map(([width, height, x, y]) => {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.14), frame);
      piece.position.set(x, y, 0);
      return piece;
    });
    group.add(mirror, ...pieces);
    this.object3D = group;
  }
}

export { Mirror };
