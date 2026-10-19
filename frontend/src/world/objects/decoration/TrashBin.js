import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createTrashBin = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "bathroom-trash-bin";

  const shellMaterial = material(aged ? 0x5f625e : 0x9ba7a3, 0.5, 0.18);
  const insideMaterial = material(aged ? 0x292d2b : 0x46504d, 0.88);

  const shell = finishMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.9, 24, 1, true), shellMaterial),
  );
  shell.position.y = 0.45;

  const bottom = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.07, 24), insideMaterial));
  bottom.position.y = 0.075;

  const innerBottom = finishMesh(
    new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), insideMaterial),
  );
  innerBottom.rotation.x = -Math.PI / 2;
  innerBottom.position.y = 0.16;

  const rim = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 10, 24), shellMaterial));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.9;

  group.add(shell, bottom, innerBottom, rim);
  group.scale.setScalar(scale);
  return group;
};

export { createTrashBin };
