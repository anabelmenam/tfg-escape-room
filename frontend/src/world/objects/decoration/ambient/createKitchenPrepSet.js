import * as THREE from "three";
import createBox from "../../helpers/createBox.js";
import { createAmbientMaterial as material, finishMesh } from "./ambientDecorHelpers.js";

const createKitchenPrepSet = ({ aged = false, scale = 1 } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-kitchen-prep";
  group.userData.ambientDescriptionKey = "prepSet";
  const board = createBox({
    width: 1.35,
    height: 0.08,
    depth: 0.82,
    position: new THREE.Vector3(0, 0.04, 0),
    material: material(aged ? 0x665442 : 0xa9794f, 0.9),
  });
  const loaf = finishMesh(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.7, 6, 14), material(aged ? 0x78634a : 0xb9824c, 0.92)),
  );
  loaf.rotation.z = Math.PI / 2;
  loaf.position.set(-0.2, 0.32, -0.05);

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.38, 0);
  bladeShape.quadraticCurveTo(-0.34, -0.12, -0.24, -0.145);
  bladeShape.lineTo(-0.18, -0.145);
  bladeShape.lineTo(-0.145, -0.17);
  bladeShape.lineTo(-0.11, -0.145);
  bladeShape.lineTo(-0.075, -0.17);
  bladeShape.lineTo(-0.04, -0.145);
  bladeShape.lineTo(-0.005, -0.17);
  bladeShape.lineTo(0.03, -0.145);
  bladeShape.lineTo(0.065, -0.17);
  bladeShape.lineTo(0.1, -0.145);
  bladeShape.lineTo(0.135, -0.17);
  bladeShape.lineTo(0.17, -0.145);
  bladeShape.lineTo(0.205, -0.17);
  bladeShape.lineTo(0.3, -0.145);
  bladeShape.lineTo(0.31, 0.105);
  bladeShape.lineTo(-0.22, 0.12);
  bladeShape.quadraticCurveTo(-0.33, 0.1, -0.38, 0);
  bladeShape.closePath();
  const knifeBlade = finishMesh(
    new THREE.Mesh(
      new THREE.ExtrudeGeometry(bladeShape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.008,
        bevelSegments: 2,
      }),
      material(0xb7b8b4, 0.2, 0.78),
    ),
  );
  knifeBlade.rotation.x = Math.PI / 2;
  knifeBlade.position.set(0.08, 0.155, 0.29);

  const knifeHandle = finishMesh(new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.19, 5, 12), material(0x4a3428, 0.78)));
  knifeHandle.rotation.z = Math.PI / 2;
  knifeHandle.position.set(0.57, 0.17, 0.295);
  knifeHandle.scale.set(0.88, 1, 0.72);
  const bolster = createBox({
    width: 0.075,
    height: 0.125,
    depth: 0.2,
    position: new THREE.Vector3(0.405, 0.17, 0.295),
    material: material(0x777873, 0.22, 0.72),
  });
  const rivets = [-0.055, 0.06].map((offset) => {
    const rivet = finishMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.145, 12), material(0xb7b8b4, 0.2, 0.78)),
    );
    rivet.rotation.x = Math.PI / 2;
    rivet.position.set(0.57 + offset, 0.17, 0.295);
    return rivet;
  });
  group.add(board, loaf, knifeBlade, bolster, knifeHandle, ...rivets);
  group.scale.setScalar(scale);
  return group;
};

export { createKitchenPrepSet };
