import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createPlateStack = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-plate-stack";
  group.userData.ambientDescriptionKey = "plateStack";
  const ceramic = material(aged ? 0x77766f : 0xd8d1bd, 0.35);
  for (let index = 0; index < 5; index += 1) {
    const plate = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.055, 28), ceramic));
    plate.position.y = 0.035 + index * 0.055;
    group.add(plate);
  }
  group.scale.setScalar(scale);
  return group;
};

export { createPlateStack };
