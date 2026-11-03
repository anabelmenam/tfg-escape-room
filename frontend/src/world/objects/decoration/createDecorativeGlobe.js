import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./ambientDecorHelpers.js";

const createDecorativeGlobe = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-decorative-globe";
  group.userData.ambientDescriptionKey = "decorativeGlobe";
  const metalMaterial = material(aged ? 0x655b4d : 0x9b7441, 0.38, 0.35);
  const globe = finishMesh(
    new THREE.Mesh(new THREE.SphereGeometry(0.48, 28, 18), material(aged ? 0x586663 : 0x5d8d96, 0.72)),
  );
  globe.position.y = 0.78;
  globe.rotation.z = -0.22;
  const meridian = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.025, 8, 32), metalMaterial));
  meridian.position.y = 0.78;
  meridian.rotation.y = Math.PI / 2;
  meridian.rotation.z = -0.22;
  const stem = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.32, 12), metalMaterial));
  stem.position.y = 0.25;
  const base = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.4, 0.1, 24), metalMaterial));
  base.position.y = 0.05;
  group.add(globe, meridian, stem, base);
  group.scale.setScalar(scale);
  return group;
};

export { createDecorativeGlobe };
