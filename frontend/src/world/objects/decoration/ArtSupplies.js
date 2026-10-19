import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createArtSupplies = ({ aged = false, scale = 1, variant = "cup" } = {}) => {
  const group = new THREE.Group();
  const paperColor = aged ? 0xb3aa96 : 0xf0e7cf;
  const pencilColors = aged ? [0x6c5550, 0x4f6067, 0x6f6545, 0x5c6851] : [0xc54f43, 0x3f78a0, 0xd0a232, 0x55935a];
  group.add(createBox({ width: 1.25, height: 0.025, depth: 0.9, position: new THREE.Vector3(0, 0.015, 0), material: material(paperColor, 0.98) }));
  if (variant === "drawing") {
    const sun = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.018, 18), material(pencilColors[2], 0.9)));
    sun.rotation.x = Math.PI / 2;
    sun.position.set(0.34, 0.045, -0.18);
    const house = createBox({ width: 0.38, height: 0.018, depth: 0.3, position: new THREE.Vector3(-0.2, 0.045, 0.12), material: material(pencilColors[0], 0.9) });
    group.add(sun, house);
  }
  const cup = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.42, 18, 1, true), material(aged ? 0x625d55 : 0x7fa2a0, 0.75)));
  cup.position.set(0.78, 0.21, -0.15);
  group.add(cup);
  pencilColors.forEach((color, index) => {
    const pencil = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72 + index * 0.04, 6), material(color, 0.78)));
    pencil.position.set(0.72 + index * 0.045, 0.65, -0.17 + (index % 2) * 0.05);
    pencil.rotation.z = (index - 1.5) * 0.08;
    group.add(pencil);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createArtSupplies };
