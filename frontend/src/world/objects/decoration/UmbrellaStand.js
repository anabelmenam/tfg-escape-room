import * as THREE from "three";
import { createAmbientMaterial as material, finishMesh } from "./AmbientDecorUtils.js";

const createUmbrellaStand = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  const standMaterial = material(aged ? 0x315866 : 0x5c807c, 0.42, 0.25);
  const rimMaterial = material(aged ? 0x9b7245 : 0xc19a63, 0.34, 0.55);
  const stand = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 1.25, 22, 1, true), standMaterial));
  stand.position.y = 0.625;
  const standRim = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 24), rimMaterial));
  standRim.position.y = 1.25;
  standRim.rotation.x = Math.PI / 2;
  const standBase = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 22), standMaterial));
  standBase.position.y = 0.03;
  group.add(stand, standRim, standBase);
  [
    { x: -0.18, z: 0.14, tiltX: 0.03, tiltZ: -0.08 },
    { x: 0.18, z: 0.14, tiltX: -0.04, tiltZ: 0.08 },
    { x: 0, z: -0.18, tiltX: 0.06, tiltZ: 0.01 },
  ].forEach(({ x, z, tiltX, tiltZ }, index) => {
    const umbrellaMaterial = material(
      (aged ? [0x6e323c, 0x304a62, 0x76602c] : [0x934657, 0x426c8a, 0xa1843d])[index],
      0.72,
    );
    const metalMaterial = material(aged ? 0x555551 : 0x777a78, 0.35, 0.5);
    const shaftHeight = 1.62 + index * 0.1;
    const umbrella = new THREE.Group();
    umbrella.position.set(x, 0, z);
    umbrella.rotation.set(tiltX, 0, tiltZ);
    const shaft = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, shaftHeight, 10), metalMaterial));
    shaft.position.y = 0.95 + index * 0.05;
    const foldedCanopy = finishMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.045, 0.92, 14), umbrellaMaterial));
    foldedCanopy.position.y = 0.74;
    const strap = finishMesh(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 18), rimMaterial));
    strap.position.y = 0.82;
    strap.rotation.x = Math.PI / 2;
    const tip = finishMesh(new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 10), metalMaterial));
    tip.position.y = 0.19;
    tip.rotation.z = Math.PI;
    const handleCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, shaftHeight + 0.14, 0), new THREE.Vector3(0.33, shaftHeight + 0.36, 0), new THREE.Vector3(0.38, shaftHeight + 0.08, 0));
    const handle = finishMesh(new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 18, 0.045, 8, false), umbrellaMaterial));
    umbrella.add(shaft, foldedCanopy, strap, tip, handle);
    group.add(umbrella);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createUmbrellaStand };
