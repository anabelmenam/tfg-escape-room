import * as THREE from "three";

const applyAgedFurnitureAppearance = (object3D, { intensity = 0.65, wearColor = 0x4b4640 } = {}) => {
  const agedColor = new THREE.Color(wearColor);

  const ageMaterial = (sourceMaterial) => {
    if (!sourceMaterial?.clone) {
      return sourceMaterial;
    }

    const material = sourceMaterial.clone();

    if (material.color) {
      material.color.lerp(agedColor, intensity);

      const hsl = {};
      material.color.getHSL(hsl);
      material.color.setHSL(hsl.h, hsl.s * (1 - intensity * 0.7), hsl.l * (1 - intensity * 0.25));
    }

    if (typeof material.roughness === "number") {
      material.roughness = Math.min(1, material.roughness + intensity * 0.65);
    }

    if (typeof material.metalness === "number") {
      material.metalness *= 1 - intensity * 0.5;
    }

    material.needsUpdate = true;

    return material;
  };

  object3D.traverse((child) => {
    if (!child.isMesh || child.userData.ignoreAging) {
      return;
    }

    child.material = Array.isArray(child.material) ? child.material.map(ageMaterial) : ageMaterial(child.material);
  });
};

export { applyAgedFurnitureAppearance };
