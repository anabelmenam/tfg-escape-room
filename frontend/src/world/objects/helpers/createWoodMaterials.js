import * as THREE from "three";
import { loadTexture } from "./loadTexture.js";

const createWoodMaterials = ({
  woodColor = 0x5a321d,
  darkWoodColor = 0x3d2114,
  interiorColor = 0x6b4226,
  handleColor = 0x8a6a42,

  woodTexture = null,
  darkWoodTexture = null,
  interiorTexture = null,

  woodNormalMap = null,
  woodRoughnessMap = null,

  darkWoodNormalMap = null,
  darkWoodRoughnessMap = null,

  interiorNormalMap = null,
  interiorRoughnessMap = null,

  woodTextureRepeat = { x: 1, y: 1 },
  darkWoodTextureRepeat = null,
  interiorTextureRepeat = null,

  woodRoughness = 0.78,
  darkWoodRoughness = 0.84,
  interiorRoughness = 0.9,

  woodMetalness = 0.02,
  darkWoodMetalness = 0.01,
  interiorMetalness = 0,

  handleRoughness = 0.35,
  handleMetalness = 0.55,

  woodNormalScale = 1,
  darkWoodNormalScale = 1,
  interiorNormalScale = 1,
} = {}) => {
  const resolvedDarkWoodTexture = darkWoodTexture ?? woodTexture;

  const resolvedInteriorTexture = interiorTexture ?? darkWoodTexture ?? woodTexture;

  const resolvedDarkRepeat = darkWoodTextureRepeat ?? woodTextureRepeat;

  const resolvedInteriorRepeat = interiorTextureRepeat ?? darkWoodTextureRepeat ?? woodTextureRepeat;

  const woodMap = loadTexture({
    path: woodTexture,
    repeat: woodTextureRepeat,
    colorTexture: true,
  });

  const woodNormalTexture = loadTexture({
    path: woodNormalMap,
    repeat: woodTextureRepeat,
    colorTexture: false,
  });

  const woodRoughnessTexture = loadTexture({
    path: woodRoughnessMap,
    repeat: woodTextureRepeat,
    colorTexture: false,
  });

  const darkWoodMap = loadTexture({
    path: resolvedDarkWoodTexture,
    repeat: resolvedDarkRepeat,
    colorTexture: true,
  });

  const darkWoodNormalTexture = loadTexture({
    path: darkWoodNormalMap ?? woodNormalMap,
    repeat: resolvedDarkRepeat,
    colorTexture: false,
  });

  const darkWoodRoughnessTexture = loadTexture({
    path: darkWoodRoughnessMap ?? woodRoughnessMap,
    repeat: resolvedDarkRepeat,
    colorTexture: false,
  });

  const interiorMap = loadTexture({
    path: resolvedInteriorTexture,
    repeat: resolvedInteriorRepeat,
    colorTexture: true,
  });

  const interiorNormalTexture = loadTexture({
    path: interiorNormalMap ?? darkWoodNormalMap ?? woodNormalMap,
    repeat: resolvedInteriorRepeat,
    colorTexture: false,
  });

  const interiorRoughnessTexture = loadTexture({
    path: interiorRoughnessMap ?? darkWoodRoughnessMap ?? woodRoughnessMap,
    repeat: resolvedInteriorRepeat,
    colorTexture: false,
  });

  const wood = new THREE.MeshStandardMaterial({
    color: woodColor,
    map: woodMap,

    normalMap: woodNormalTexture,
    normalScale: new THREE.Vector2(woodNormalScale, woodNormalScale),

    roughnessMap: woodRoughnessTexture,
    roughness: woodRoughness,
    metalness: woodMetalness,
  });

  const darkWood = new THREE.MeshStandardMaterial({
    color: darkWoodColor,
    map: darkWoodMap,

    normalMap: darkWoodNormalTexture,
    normalScale: new THREE.Vector2(darkWoodNormalScale, darkWoodNormalScale),

    roughnessMap: darkWoodRoughnessTexture,

    roughness: darkWoodRoughness,
    metalness: darkWoodMetalness,
  });

  const interior = new THREE.MeshStandardMaterial({
    color: interiorColor,
    map: interiorMap,

    normalMap: interiorNormalTexture,
    normalScale: new THREE.Vector2(interiorNormalScale, interiorNormalScale),

    roughnessMap: interiorRoughnessTexture,

    roughness: interiorRoughness,
    metalness: interiorMetalness,
  });

  const handle = new THREE.MeshStandardMaterial({
    color: handleColor,
    roughness: handleRoughness,
    metalness: handleMetalness,
  });

  return {
    wood,
    darkWood,
    interior,
    handle,
  };
};

export { createWoodMaterials };
