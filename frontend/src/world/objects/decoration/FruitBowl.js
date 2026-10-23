import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createFruitBowl = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-fruit-bowl";
  group.userData.ambientDescriptionKey = "fruitBowl";
  const bowlColor = aged ? 0x544b43 : 0x8b6648;
  const bowlProfile = [
    new THREE.Vector2(0.3, 0.04),
    new THREE.Vector2(0.46, 0.1),
    new THREE.Vector2(0.6, 0.27),
    new THREE.Vector2(0.68, 0.49),
    new THREE.Vector2(0.69, 0.54),
    new THREE.Vector2(0.61, 0.54),
    new THREE.Vector2(0.55, 0.43),
    new THREE.Vector2(0.45, 0.25),
    new THREE.Vector2(0.29, 0.12),
  ];
  const bowl = finishMesh(new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 40), material(bowlColor, 0.68)));
  const rim = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.045, 10, 40), material(aged ? 0x49423c : 0x765238, 0.62)));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.54;
  group.add(bowl, rim);
  const appleColors = aged
    ? [0x795044, 0x70483f, 0x805348]
    : [0xb93832, 0xc44738, 0xa92f2d, 0xd0523f];
  const apples = [
    [-0.34, -0.14, 0.54], [0, -0.31, 0.55], [0.34, -0.13, 0.54],
    [-0.38, 0.22, 0.55], [0, 0.27, 0.57], [0.38, 0.22, 0.55],
    [-0.17, 0.02, 0.76], [0.18, 0.03, 0.77],
  ];
  apples.forEach(([x, z, y], index) => {
    const apple = finishMesh(new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 18, 14),
      material(appleColors[index % appleColors.length], 0.78),
    ));
    apple.scale.set(1, 0.92, 1);
    apple.position.set(x, y, z);
    const stem = finishMesh(new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.018, 0.11, 8),
      material(aged ? 0x493c32 : 0x5b3924, 0.86),
    ));
    stem.position.set(x, y + 0.18, z);
    stem.rotation.z = index % 2 === 0 ? 0.12 : -0.12;
    group.add(apple, stem);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createFruitBowl };
