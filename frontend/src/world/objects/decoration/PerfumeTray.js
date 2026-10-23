import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createPerfumeTray = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-perfume-tray";
  group.userData.ambientDescriptionKey = "perfume";
  const trayMaterial = material(aged ? 0x68625b : 0xb49a75, 0.38, 0.18);
  group.add(createBox({ width: 1.15, height: 0.06, depth: 0.62, position: new THREE.Vector3(0, 0.03, 0), material: trayMaterial }));
  [[-0.3, 0.28, 0x8b716f], [0.05, 0.42, 0x6f8a88], [0.36, 0.32, 0xa88b62]].forEach(([x, height, color], index) => {
    const bottle = createBox({ width: 0.22 + index * 0.035, height, depth: 0.22, position: new THREE.Vector3(x, height / 2 + 0.06, 0), material: material(aged ? 0x696764 : color, 0.25, 0.08) });
    const stopper = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 12), material(aged ? 0x55514d : 0xc1ad86, 0.3, 0.35)));
    stopper.position.set(x, height + 0.11, 0);
    group.add(bottle, stopper);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createPerfumeTray };
