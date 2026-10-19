import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { createAmbientMaterial as material } from "./AmbientDecorUtils.js";

const createBookStack = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const colors = aged ? [0x514943, 0x5b5245, 0x494e4f] : [0x7d3f32, 0x3f5d69, 0x88713d];
  [[0, 0.09, 0, 1.05, 0.16, 0.72, 0.03], [0.04, 0.27, -0.02, 0.92, 0.16, 0.66, -0.05], [-0.03, 0.45, 0.02, 1, 0.17, 0.7, 0.02]]
    .forEach(([x, y, z, width, height, depth, rotation], index) => {
      const book = createBox({ width, height, depth, position: new THREE.Vector3(x, y, z), material: material(colors[index], 0.84) });
      book.rotation.y = rotation;
      group.add(book);
    });
  group.scale.setScalar(scale);
  return group;
};

export { createBookStack };
