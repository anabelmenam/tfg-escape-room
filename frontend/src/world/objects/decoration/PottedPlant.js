import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createPottedPlant = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const potMaterial = material(aged ? 0x554d46 : 0x9a5d3e, 0.88);
  const soilMaterial = material(0x2c2119, 1);
  const stemMaterial = material(aged ? 0x394436 : 0x496d3f, 0.9);
  const leafMaterial = material(aged ? 0x465345 : 0x64875b, 0.86);
  const pot = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.48, 0.85, 24), potMaterial));
  pot.position.y = 0.43;
  const soil = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24), soilMaterial));
  soil.position.y = 0.86;
  group.add(pot, soil);
  [-0.3, 0, 0.28].forEach((x, index) => {
    const stemHeight = 1.35 + index * 0.25;
    const stem = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, stemHeight, 10), stemMaterial));
    stem.position.set(x * 0.4, 0.85 + stemHeight / 2, index * 0.08);
    group.add(stem);
    [-1, 1].forEach((side, leafIndex) => {
      const leaf = finishMesh(new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), leafMaterial));
      leaf.scale.set(1.5, 0.42, 0.7);
      leaf.rotation.z = side * (0.45 + leafIndex * 0.1);
      leaf.position.set(stem.position.x + side * 0.22, 1.35 + index * 0.38 + leafIndex * 0.35, stem.position.z);
      group.add(leaf);
    });
  });
  group.scale.setScalar(scale);
  return group;
};

export { createPottedPlant };
