import * as THREE from "three";

const createMesh = (
  geometry,
  material,
  position,
  { rotationX = 0, rotationY = 0, rotationZ = 0 } = {},
) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.rotation.set(rotationX, rotationY, rotationZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export { createMesh };
