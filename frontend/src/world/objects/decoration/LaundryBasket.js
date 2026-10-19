import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createLaundryBasket = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const basket = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 0.82, 20, 1, true), material(aged ? 0x5f574e : 0x8b7257, 0.95)));
  basket.position.y = 0.41;
  const towelA = createBox({ width: 0.7, height: 0.2, depth: 0.48, position: new THREE.Vector3(0, 0.82, 0), material: material(aged ? 0x65706d : 0x86aaa4, 0.98) });
  const towelB = createBox({ width: 0.56, height: 0.18, depth: 0.42, position: new THREE.Vector3(0.08, 0.99, -0.02), material: material(aged ? 0x77736b : 0xd2c8b1, 0.98) });
  group.add(basket, towelA, towelB);
  group.scale.setScalar(scale);
  return group;
};

export { createLaundryBasket };
