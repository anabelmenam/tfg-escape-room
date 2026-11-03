import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./ambientDecorHelpers.js";

const createKeyBowl = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-key-bowl";
  group.userData.ambientDescriptionKey = "keyBowl";
  const bowl = finishMesh(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      material(aged ? 0x67635c : 0xa88963, 0.42, 0.16),
    ),
  );
  bowl.position.y = 0.3;
  group.add(bowl);
  group.scale.setScalar(scale);
  return group;
};

export { createKeyBowl };
