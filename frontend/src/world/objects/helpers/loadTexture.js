import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

const normalizeRepeat = (repeat) => ({
  x: repeat?.x ?? 1,
  y: repeat?.y ?? 1,
});

const loadTexture = ({ path, repeat = { x: 1, y: 1 }, colorTexture = true, flipY = true } = {}) => {
  if (!path) {
    return null;
  }

  const normalizedRepeat = normalizeRepeat(repeat);
  const cacheKey = [path, normalizedRepeat.x, normalizedRepeat.y, colorTexture, flipY].join("|");

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey);
  }

  const texture = textureLoader.load(path, undefined, undefined, (error) => {
    console.error(`No se pudo cargar la textura: ${path}`, error);
  });

  texture.name = path;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(normalizedRepeat.x, normalizedRepeat.y);
  texture.flipY = flipY;
  texture.colorSpace = colorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  textureCache.set(cacheKey, texture);

  return texture;
};

export { loadTexture };
