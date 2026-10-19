import * as THREE from "three";

const createCurvedFaucet = ({
  material,
  surfaceY = 0,
  baseZ = -0.67,
  reach = 0.76,
  height = 0.57,
} = {}) => {
  const faucet = new THREE.Group();
  faucet.name = "sink-faucet";

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.1, 24), material);
  base.position.set(0, surfaceY + 0.05, baseZ);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.38, 24), material);
  body.position.set(0, surfaceY + 0.24, baseZ);
  const spoutEndY = surfaceY + height * 0.98;

  // A smooth mixer spout, joined to the body and ending vertically over the bowl.
  const spoutPath = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, surfaceY + 0.36, baseZ),
    new THREE.Vector3(0, surfaceY + height, baseZ),
    new THREE.Vector3(0, surfaceY + height, baseZ + reach),
    new THREE.Vector3(0, spoutEndY, baseZ + reach),
  );
  const neck = new THREE.Mesh(new THREE.TubeGeometry(spoutPath, 40, 0.06, 14, false), material);
  neck.name = "sink-faucet-spout";

  const outletHeight = 0.13;
  const outletY = spoutEndY - outletHeight / 2;
  const outletZ = baseZ + reach;
  const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, outletHeight, 18), material);
  outlet.position.set(0, outletY, outletZ);
  const aerator = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 18), material);
  aerator.position.set(0, outletY - outletHeight / 2 - 0.035, outletZ);

  const leverPivot = new THREE.Group();
  leverPivot.name = "sink-faucet-lever";
  leverPivot.position.set(0, surfaceY + 0.44, baseZ - 0.015);
  const leverJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.055, 18), material);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.055, 0.3), material);
  lever.position.z = -0.13;
  leverPivot.add(leverJoint, lever);

  faucet.add(base, body, neck, outlet, aerator, leverPivot);
  faucet.userData.lever = leverPivot;
  faucet.userData.outletPosition = new THREE.Vector3(0, aerator.position.y - 0.035, outletZ);
  faucet.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return faucet;
};

export { createCurvedFaucet };
