import * as THREE from "three";

const ATLAS_PATH = "/images/puzzles/bathroom-mosaic/blue-tiles-atlas.png";
const atlas = new THREE.TextureLoader().load(ATLAS_PATH);
atlas.colorSpace = THREE.SRGBColorSpace;

const createTileTexture = (tileId) => {
  const texture = atlas.clone();
  const column = tileId % 3;
  const row = Math.floor(tileId / 3);
  texture.repeat.set(1 / 3, 1 / 3);
  texture.offset.set(column / 3, (2 - row) / 3);
  texture.needsUpdate = true;
  return texture;
};

const createTile = ({ tileId, size = 1.1, depth = 0.1 } = {}) => {
  const texture = createTileTexture(tileId);
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.24,
    clearcoat: 0.48,
    clearcoatRoughness: 0.2,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, depth), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.tileTexture = texture;
  return mesh;
};

export { createTile };
