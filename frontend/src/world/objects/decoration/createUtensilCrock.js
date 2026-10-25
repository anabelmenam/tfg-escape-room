import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./ambientDecorHelpers.js";

const createUtensilCrock = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-utensil-crock";
  group.userData.ambientDescriptionKey = "utensils";
  const ceramic = material(aged ? 0x68645d : 0xc4b59a, 0.58);
  const crock = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.58, 28, 1, true), ceramic));
  crock.position.y = 0.29;
  const base = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.045, 28), ceramic));
  base.position.y = 0.022;
  const rim = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.035, 9, 32), ceramic));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.58;
  const opening = finishMesh(new THREE.Mesh(new THREE.CircleGeometry(0.245, 28), material(0x29231e, 0.9)));
  opening.rotation.x = -Math.PI / 2;
  opening.position.y = 0.575;
  group.add(crock, base, opening, rim);

  const wood = material(aged ? 0x51483d : 0x70482d, 0.7);
  const steel = material(0x8a8b86, 0.28, 0.7);
  const addHandle = (x, z, height, tilt, utensilMaterial) => {
    const handle = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, height, 10), utensilMaterial));
    handle.position.set(x, 0.56 + height / 2, z);
    handle.rotation.z = tilt;
    group.add(handle);
    return handle;
  };

  addHandle(-0.13, 0.01, 0.78, -0.12, wood);
  const spoon = finishMesh(new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 12), wood));
  spoon.scale.set(0.72, 1.3, 0.34);
  spoon.position.set(-0.085, 1.34, 0.01);
  spoon.rotation.z = -0.12;
  group.add(spoon);

  addHandle(0.03, -0.03, 0.87, 0.035, steel);
  const ladle = finishMesh(new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), steel));
  ladle.scale.set(0.9, 0.42, 0.9);
  ladle.rotation.x = Math.PI;
  ladle.position.set(0.015, 1.46, -0.03);
  group.add(ladle);

  addHandle(0.15, 0.04, 0.75, 0.16, wood);
  const spatula = finishMesh(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.045), wood));
  spatula.position.set(0.09, 1.33, 0.04);
  spatula.rotation.z = 0.16;
  group.add(spatula);
  [-0.05, 0, 0.05].forEach((offset) => {
    const slot = finishMesh(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.16, 0.052), material(0x2d241e, 0.9)));
    slot.position.set(0.09 + offset, 1.33, 0.04);
    slot.rotation.z = 0.16;
    group.add(slot);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createUtensilCrock };
