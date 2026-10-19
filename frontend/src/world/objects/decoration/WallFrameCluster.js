import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { loadTexture } from "../helpers/loadTexture.js";
import { createAmbientMaterial as material } from "./AmbientDecorUtils.js";

const createWallFrameCluster = ({ aged = false, scale = 1, imagePaths = [] } = {}) => {
  const group = new THREE.Group();
  const frameMaterial = material(aged ? 0x453d37 : 0x65472f, 0.78);
  const artColors = aged ? [0x6a6962, 0x71675d, 0x5d6664] : [0x8ba49a, 0xb58c72, 0x9d8c5f];
  [[-1.15, 0.25, 1.25, 1.65], [0.15, -0.05, 1.05, 1.3], [1.25, 0.35, 0.9, 1.15]].forEach(([x, y, width, height], index) => {
    const frame = createBox({ width, height, depth: 0.1, position: new THREE.Vector3(x, y, 0), material: frameMaterial });
    const imagePath = imagePaths[index % imagePaths.length];
    const artMaterial = imagePath
      ? new THREE.MeshBasicMaterial({ map: loadTexture({ path: imagePath }), color: aged ? 0xb0aaa0 : 0xffffff })
      : material(artColors[index], 0.9);
    const art = createBox({ width: width - 0.16, height: height - 0.16, depth: 0.035, position: new THREE.Vector3(x, y, 0.07), material: artMaterial });
    group.add(frame, art);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createWallFrameCluster };
