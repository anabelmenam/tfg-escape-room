import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";

class Stove extends Entity {
  constructor({ id = "kitchen-stove", position = new THREE.Vector3(), rotationY = 0, bodyColor = 0xddd8ca } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    const body = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.48 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.36, metalness: 0.35 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x99958c, roughness: 0.25, metalness: 0.72 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x1b2428, roughness: 0.18, metalness: 0.25 });

    this.object3D.add(
      createBox({ width: 3.1, height: 3, depth: 2.45, position: new THREE.Vector3(0, 1.5, 0), material: body }),
      createBox({ width: 2.55, height: 1.55, depth: 0.1, position: new THREE.Vector3(0, 1.15, 1.27), material: glass }),
      createBox({ width: 2.2, height: 0.12, depth: 0.12, position: new THREE.Vector3(0, 2.15, 1.36), material: metal }),
      createBox({ width: 3.2, height: 0.18, depth: 2.55, position: new THREE.Vector3(0, 3.08, 0), material: dark }),
    );

    [[-0.85, -0.62], [0.85, -0.62], [-0.85, 0.62], [0.85, 0.62]].forEach(([x, z]) => {
      const burner = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 10, 24), metal);
      burner.position.set(x, 3.2, z);
      burner.rotation.x = Math.PI / 2;
      this.object3D.add(burner);
    });
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Stove };
