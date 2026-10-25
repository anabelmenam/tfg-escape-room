import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./ambientDecorHelpers.js";

const createToyBasket = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-toy-basket";
  group.userData.ambientDescriptionKey = "toyBasket";
  const basket = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.6, 0.65, 20, 1, true), material(aged ? 0x655b4e : 0x9a744d, 0.95)));
  basket.position.y = 0.33;
  const bottom = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.59, 0.59, 0.05, 20), material(aged ? 0x4f4942 : 0x75583e, 0.98)));
  bottom.position.y = 0.055;
  group.add(basket, bottom);
  group.userData.isPuzzleContainer = true;
  group.userData.contents = [];
  group.scale.setScalar(scale);
  return group;
};

export { createToyBasket };
