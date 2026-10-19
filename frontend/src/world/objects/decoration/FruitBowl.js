import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createFruitBowl = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const bowl = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.38, 0.22, 28), material(aged ? 0x544b43 : 0x8b6648, 0.74)));
  bowl.position.y = 0.11;
  group.add(bowl);
  const colors = aged ? [0x6c6250, 0x5d5949, 0x665246] : [0xb86b3e, 0x9e3f32, 0xc59a43, 0x738b45, 0xa84f37];
  [[-0.22, 0], [0.05, -0.08], [0.24, 0.08], [-0.06, 0.18], [0.14, 0.2]].forEach(([x, z], index) => {
    const fruit = finishMesh(new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), material(colors[index], 0.78)));
    fruit.position.set(x, 0.32 + (index % 2) * 0.08, z);
    group.add(fruit);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createFruitBowl };
