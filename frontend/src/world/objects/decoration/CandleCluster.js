import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createCandleCluster = ({ aged = false, scale = 1, count = 3 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-candle-cluster";
  group.userData.ambientDescriptionKey = "candles";
  const candleCount = Math.max(0, Math.floor(count));
  const plateMaterial = material(aged ? 0x77746c : 0xc8b58e, 0.32, 0.08);
  Array.from({ length: candleCount }, (_, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = (column - (Math.min(candleCount, 3) - 1) / 2) * 0.52;
    const z = row * 0.5;
    const height = [0.34, 0.5, 0.27, 0.42][index % 4];
    const plate = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.045, 24), plateMaterial));
    plate.position.set(x, 0.023, z);
    const plateRim = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.025, 8, 24), plateMaterial));
    plateRim.position.set(x, 0.052, z);
    plateRim.rotation.x = Math.PI / 2;
    const candle = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, height, 16), material(aged ? 0x928d7f : 0xd8c9a7, 0.9)));
    candle.position.set(x, height / 2 + 0.055, z);
    const wick = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), material(0x28231f, 1)));
    wick.position.set(x, height + 0.09, z);
    group.add(plate, plateRim, candle, wick);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createCandleCluster };
