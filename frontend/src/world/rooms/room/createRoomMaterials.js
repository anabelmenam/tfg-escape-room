import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

const loadTexture = (path, repeat) => {
  if (!path) return null;
  const texture = textureLoader.load(path, undefined, undefined, (error) => console.error(`No se pudo cargar la textura: ${path}`, error));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat.x ?? 1, repeat.y ?? 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createRoomMaterials = (options) => ({
  wall: new THREE.MeshStandardMaterial({ color: options.wallColor, map: loadTexture(options.wallTexture, options.wallTextureRepeat), roughness: 0.9 }),
  floor: new THREE.MeshStandardMaterial({ color: options.floorColor, map: loadTexture(options.floorTexture, options.floorTextureRepeat), roughness: 0.8 }),
  ceiling: new THREE.MeshStandardMaterial({ color: options.ceilingColor, map: loadTexture(options.ceilingTexture, options.ceilingTextureRepeat), roughness: 0.9 }),
});

export { createRoomMaterials };
