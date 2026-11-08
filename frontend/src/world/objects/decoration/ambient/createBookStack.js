import * as THREE from "three";
import createBox from "../../helpers/createBox.js";
import { createAmbientMaterial as material } from "./ambientDecorHelpers.js";

const createBookStack = ({ aged = false, scale = 1, variant = 0 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-book-stack";
  group.userData.ambientDescriptionKey = "bookStack";
  const palettes = aged
    ? [
        [0x514943, 0x5b5245, 0x494e4f],
        [0x51473e, 0x5a5044, 0x43494a],
        [0x4c4840, 0x59483f, 0x4b5144],
      ]
    : [
        [0x7d3f32, 0x3f5d69, 0x88713d],
        [0x53683f, 0x845342, 0x4c4f70],
        [0x365b65, 0x8b633a, 0x6d3f52],
      ];
  const colors = palettes[Math.abs(variant) % palettes.length];
  const layouts = [
    [
      [0, 0.09, 0, 1.05, 0.16, 0.72, 0.03],
      [0.04, 0.27, -0.02, 0.92, 0.16, 0.66, -0.05],
      [-0.03, 0.45, 0.02, 1, 0.17, 0.7, 0.02],
    ],
    [
      [-0.08, 0.1, 0.02, 1.18, 0.18, 0.68, -0.06],
      [0.07, 0.3, -0.03, 0.86, 0.19, 0.62, 0.08],
    ],
    [
      [-0.28, 0.47, 0, 0.18, 0.94, 0.7, -0.04],
      [-0.04, 0.43, 0.01, 0.19, 0.86, 0.68, 0.02],
      [0.22, 0.5, -0.02, 0.17, 1, 0.66, 0.07],
    ],
  ];
  layouts[Math.abs(variant) % layouts.length].forEach(([x, y, z, width, height, depth, rotation], index) => {
    const book = createBox({
      width,
      height,
      depth,
      position: new THREE.Vector3(x, y, z),
      material: material(colors[index], 0.84),
    });
    book.rotation.y = rotation;
    group.add(book);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createBookStack };
