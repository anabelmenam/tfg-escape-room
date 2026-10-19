import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createKitchenPrepSet = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const board = createBox({ width: 1.35, height: 0.08, depth: 0.82, position: new THREE.Vector3(0, 0.04, 0), material: material(aged ? 0x665442 : 0xa9794f, 0.9) });
  const loaf = finishMesh(new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.7, 6, 14), material(aged ? 0x78634a : 0xb9824c, 0.92)));
  loaf.rotation.z = Math.PI / 2;
  loaf.position.set(-0.16, 0.32, 0);
  const knifeBlade = createBox({ width: 0.78, height: 0.035, depth: 0.14, position: new THREE.Vector3(0.32, 0.18, 0.32), material: material(0x9b9b96, 0.26, 0.65) });
  const knifeHandle = createBox({ width: 0.34, height: 0.07, depth: 0.18, position: new THREE.Vector3(0.86, 0.18, 0.32), material: material(0x4a3428, 0.82) });
  group.add(board, loaf, knifeBlade, knifeHandle);
  group.scale.setScalar(scale);
  return group;
};

export { createKitchenPrepSet };
