import * as THREE from "three";

const finishMesh = (mesh) => {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const createAmbientMaterial = (color, roughness = 0.75, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide });

export { createAmbientMaterial, finishMesh };
