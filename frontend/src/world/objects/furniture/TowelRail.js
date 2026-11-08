import * as THREE from "three";
import { Entity } from "../Entity.js";
import { createMesh } from "../helpers/createMesh.js";

const createDrapedTowel = ({ width, material }) => {
  const profile = new THREE.Shape();
  profile.moveTo(-0.13, -0.02);
  profile.lineTo(-0.13, -1.31);
  profile.quadraticCurveTo(-0.13, -1.38, -0.065, -1.38);
  profile.lineTo(-0.055, -0.08);
  profile.quadraticCurveTo(0, 0.035, 0.055, -0.08);
  profile.lineTo(0.055, -1.62);
  profile.quadraticCurveTo(0.055, -1.69, 0.12, -1.69);
  profile.quadraticCurveTo(0.13, -1.69, 0.13, -1.62);
  profile.lineTo(0.13, -0.02);
  profile.quadraticCurveTo(0, 0.18, -0.13, -0.02);

  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: width,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -width / 2);
  geometry.computeVertexNormals();

  const towel = new THREE.Mesh(geometry, material);
  towel.rotation.y = Math.PI / 2;
  towel.castShadow = true;
  towel.receiveShadow = true;
  return towel;
};

class TowelRail extends Entity {
  constructor({
    id = "bathroom-towel-rail",
    position = new THREE.Vector3(),
    rotationY = 0,
    metalColor = 0xb9aa83,
    towelColor = 0x668e8a,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    const metal = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.24, metalness: 0.72 });
    const cloth = new THREE.MeshStandardMaterial({ color: towelColor, roughness: 0.94, side: THREE.DoubleSide });
    const rail = createMesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 16), metal, new THREE.Vector3(0, 0, 0), {
      rotationZ: Math.PI / 2,
    });
    const towel = createDrapedTowel({ width: 2.15, material: cloth });
    this.object3D.add(rail, towel);
  }
}

export { TowelRail };
