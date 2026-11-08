import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { createWoodMaterials } from "../helpers/createWoodMaterials.js";

class Chair extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 0.8,
    woodColor = 0x5a321d,
    darkWoodColor = 0x3d2114,
    woodTexture = null,
    darkWoodTexture = null,
    woodNormalMap = null,
    woodRoughnessMap = null,
    darkWoodNormalMap = null,
    darkWoodRoughnessMap = null,
    woodTextureRepeat = {
      x: 1,
      y: 1,
    },
    darkWoodTextureRepeat = null,
  } = {}) {
    super(id);

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    const materials = createWoodMaterials({
      woodColor,
      darkWoodColor,
      woodTexture,
      darkWoodTexture,
      woodNormalMap,
      woodRoughnessMap,
      darkWoodNormalMap,
      darkWoodRoughnessMap,
      woodTextureRepeat,
      darkWoodTextureRepeat,
    });

    this.woodMaterial = materials.wood;
    this.darkWoodMaterial = materials.darkWood;
    this.createChair();
  }

  createChair() {
    this.createSeat();
    this.createLegs();
    this.createBackrest();
    this.createSupports();
  }

  createSeat() {
    const seat = createBox({
      width: 2.8,
      height: 0.3,
      depth: 2.7,
      position: new THREE.Vector3(0, 2.6, 0),
      material: this.woodMaterial,
    });

    this.object3D.add(seat);
  }

  createLegs() {
    const legPositions = [
      [-1.15, 1.25, 1.05],
      [1.15, 1.25, 1.05],
      [-1.15, 1.25, -1.05],
      [1.15, 1.25, -1.05],
    ];

    legPositions.forEach(([x, y, z]) => {
      const leg = createBox({
        width: 0.3,
        height: 2.5,
        depth: 0.3,
        position: new THREE.Vector3(x, y, z),
        material: this.darkWoodMaterial,
      });

      this.object3D.add(leg);
    });
  }

  createBackrest() {
    const leftPost = createBox({
      width: 0.32,
      height: 3.5,
      depth: 0.32,
      position: new THREE.Vector3(-1.15, 4.2, -1.05),
      material: this.darkWoodMaterial,
    });

    const rightPost = createBox({
      width: 0.32,
      height: 3.5,
      depth: 0.32,
      position: new THREE.Vector3(1.15, 4.2, -1.05),
      material: this.darkWoodMaterial,
    });

    const topRail = createBox({
      width: 2.65,
      height: 0.42,
      depth: 0.35,
      position: new THREE.Vector3(0, 5.75, -1.05),
      material: this.woodMaterial,
    });

    this.object3D.add(leftPost, rightPost, topRail);
    this.createBackrestSlats();
  }

  createBackrestSlats() {
    const slatPositions = [-0.72, -0.24, 0.24, 0.72];

    slatPositions.forEach((x) => {
      const slat = createBox({
        width: 0.18,
        height: 3,
        depth: 0.18,
        position: new THREE.Vector3(x, 4.2, -1.05),
        material: this.woodMaterial,
      });

      this.object3D.add(slat);
    });
  }

  createSupports() {
    const supportHeight = 1.2;

    const frontSupport = createBox({
      width: 2.15,
      height: 0.2,
      depth: 0.2,
      position: new THREE.Vector3(0, supportHeight, 1.05),
      material: this.darkWoodMaterial,
    });

    const rearSupport = createBox({
      width: 2.15,
      height: 0.2,
      depth: 0.2,
      position: new THREE.Vector3(0, supportHeight, -1.05),
      material: this.darkWoodMaterial,
    });

    const leftSupport = createBox({
      width: 0.2,
      height: 0.2,
      depth: 1.95,
      position: new THREE.Vector3(-1.15, supportHeight, 0),
      material: this.darkWoodMaterial,
    });

    const rightSupport = createBox({
      width: 0.2,
      height: 0.2,
      depth: 1.95,
      position: new THREE.Vector3(1.15, supportHeight, 0),
      material: this.darkWoodMaterial,
    });

    this.object3D.add(frontSupport, rearSupport, leftSupport, rightSupport);
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Chair };
