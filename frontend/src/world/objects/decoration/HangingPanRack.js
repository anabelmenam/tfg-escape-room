import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createHangingPanRack = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const metalMaterial = material(aged ? 0x56534d : 0x8a674a, 0.34, 0.55);
  group.add(createBox({ width: 3.1, height: 0.11, depth: 0.12, position: new THREE.Vector3(0, 0.72, 0), material: metalMaterial }));
  [-1, 0, 1].forEach((x, index) => {
    const hook = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 7, 16, Math.PI * 1.45), metalMaterial));
    hook.position.set(x, 0.55, 0);
    const pan = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.37 + index * 0.04, 0.32 + index * 0.04, 0.12, 28), metalMaterial));
    pan.rotation.x = Math.PI / 2;
    pan.position.set(x, -0.1 - index * 0.08, 0);
    const handle = createBox({ width: 0.13, height: 0.68, depth: 0.1, position: new THREE.Vector3(x, 0.32 - index * 0.08, 0), material: metalMaterial });
    group.add(hook, pan, handle);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createHangingPanRack };
