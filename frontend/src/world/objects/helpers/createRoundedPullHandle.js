import * as THREE from "three";

const createRoundedPullHandle = ({ material, height = 0.78 } = {}) => {
  const handle = new THREE.Group();
  const barHeight = height - 0.16;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, barHeight, 18), material);
  bar.position.z = 0.14;
  bar.castShadow = true;
  bar.receiveShadow = true;
  handle.add(bar);

  [-1, 1].forEach((side) => {
    const y = side * barHeight / 2;
    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16), material);
    support.rotation.x = Math.PI / 2;
    support.position.set(0, y, 0.07);
    support.castShadow = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), material);
    cap.position.set(0, y, 0.14);
    cap.castShadow = true;
    handle.add(support, cap);
  });

  return handle;
};

export { createRoundedPullHandle };
