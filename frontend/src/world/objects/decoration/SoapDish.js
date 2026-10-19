import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createSoapDish = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const dishMaterial = material(aged ? 0x77746d : 0xc8c2b3, 0.34);
  const dish = finishMesh(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      dishMaterial,
    ),
  );
  dish.scale.set(1, 0.3, 0.7);
  dish.position.y = 0.12;

  const rim = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 10, 28), dishMaterial));
  rim.rotation.x = Math.PI / 2;
  rim.scale.y = 0.7;
  rim.position.y = 0.12;

  const soapMaterial = material(aged ? 0x5f765e : 0x56b887, 0.58);
  const soap = finishMesh(new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), soapMaterial));
  soap.scale.set(1.55, 0.55, 0.85);
  soap.position.y = 0.24;
  group.add(dish, rim, soap);
  group.scale.setScalar(scale);
  return group;
};

export { createSoapDish };
