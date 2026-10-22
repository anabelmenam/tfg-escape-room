import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createBottleSet = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const colors = aged ? [0x48504b, 0x4d4941, 0x55514b] : [0x668676, 0x80684d, 0x7d5b5e];
  [-0.38, 0, 0.38].forEach((x, index) => {
    const height = 0.55 + index * 0.13;
    const bottle = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, height, 18), material(colors[index], 0.3, 0.05)));
    bottle.position.set(x, height / 2, (index - 1) * 0.055);
    const neck = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.2, 16), material(colors[index], 0.3, 0.05)));
    neck.position.set(x, height + 0.08, (index - 1) * 0.055);
    group.add(bottle, neck);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createBottleSet };
