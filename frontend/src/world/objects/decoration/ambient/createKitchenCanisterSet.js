import * as THREE from "three";
import createBox from "../../helpers/createBox.js";
import { createAmbientMaterial as material, finishMesh } from "./ambientDecorHelpers.js";

const createKitchenCanisterSet = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-kitchen-canisters";
  group.userData.ambientDescriptionKey = "canisters";
  [-0.45, 0, 0.45].forEach((x, index) => {
    const height = 0.62 + index * 0.1;
    const ceramic = material(aged ? 0x77736a : 0xd9d0b7, 0.58);
    const jar = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, height, 22), ceramic));
    jar.position.set(x, height / 2, 0);
    const lid = finishMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 22), material(aged ? 0x4f4841 : 0x6f4b34, 0.74)),
    );
    lid.position.set(x, height + 0.04, 0);
    const label = createBox({
      width: 0.25,
      height: 0.18,
      depth: 0.02,
      position: new THREE.Vector3(x, height * 0.48, 0.195),
      material: material(aged ? 0x8b8475 : 0xb78555, 0.9),
    });
    group.add(jar, lid, label);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createKitchenCanisterSet };
