import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createUtensilCrock = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const crock = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.58, 22), material(aged ? 0x68645d : 0xc4b59a, 0.7)));
  crock.position.y = 0.29;
  group.add(crock);
  [-0.16, 0, 0.16].forEach((x, index) => {
    const utensil = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.9, 8), material(index === 1 ? 0x797873 : 0x6f4e36, 0.55, index === 1 ? 0.6 : 0)));
    utensil.position.set(x, 0.8, 0);
    utensil.rotation.z = x * 0.9;
    group.add(utensil);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createUtensilCrock };
