import * as THREE from "three";
const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x5a321d,
  roughness: 0.72,
  metalness: 0.05,
});

export default function createBox({ width, height, depth, position, material = woodMaterial }) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}
