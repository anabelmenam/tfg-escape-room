import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createVase = ({ aged = false, flowers = true, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-vase";
  group.userData.ambientDescriptionKey = aged ? "oldVase" : "vase";
  const profile = [new THREE.Vector2(0.32, 0), new THREE.Vector2(0.44, 0.22), new THREE.Vector2(0.36, 0.65), new THREE.Vector2(0.2, 0.9), new THREE.Vector2(0.19, 1.03)];
  group.add(finishMesh(new THREE.Mesh(new THREE.LatheGeometry(profile, 28), material(aged ? 0x5d6664 : 0x789a94, 0.42))));
  if (flowers) {
    [-0.18, 0, 0.18].forEach((x, index) => {
      const stem = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.78 + index * 0.08, 8), material(0x4d6840, 0.9)));
      stem.position.set(x * 0.45, 1.25 + index * 0.04, 0);
      stem.rotation.z = x * 0.8;
      const flower = finishMesh(new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), material(aged ? 0x83786f : [0xb97968, 0xd0aa70, 0x9c7180][index], 0.85)));
      flower.scale.y = 0.62;
      flower.position.set(x, 1.62 + index * 0.08, 0);
      group.add(stem, flower);
    });
  }
  group.scale.setScalar(scale);
  return group;
};

export { createVase };
