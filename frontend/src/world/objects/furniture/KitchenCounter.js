import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { HingedPanelManager } from "../helpers/HingedPanelManager.js";
import { loadTexture } from "../helpers/loadTexture.js";
import { createRoundedPullHandle } from "../helpers/createRoundedPullHandle.js";
import { createCurvedFaucet } from "../helpers/createCurvedFaucet.js";

const createRoundedRectanglePath = (width, depth, radius, reverse = false) => {
  const path = reverse ? new THREE.Path() : new THREE.Shape();
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  if (reverse) {
    path.moveTo(-halfWidth + radius, -halfDepth);
    path.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth, -halfDepth + radius);
    path.lineTo(-halfWidth, halfDepth - radius);
    path.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth + radius, halfDepth);
    path.lineTo(-halfWidth + radius, halfDepth);
    path.lineTo(halfWidth - radius, halfDepth);
    path.quadraticCurveTo(halfWidth, halfDepth, halfWidth, halfDepth - radius);
    path.lineTo(halfWidth, -halfDepth + radius);
    path.quadraticCurveTo(halfWidth, -halfDepth, halfWidth - radius, -halfDepth);
    path.lineTo(-halfWidth + radius, -halfDepth);
  } else {
    path.moveTo(-halfWidth + radius, -halfDepth);
    path.lineTo(halfWidth - radius, -halfDepth);
    path.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + radius);
    path.lineTo(halfWidth, halfDepth - radius);
    path.quadraticCurveTo(halfWidth, halfDepth, halfWidth - radius, halfDepth);
    path.lineTo(-halfWidth + radius, halfDepth);
    path.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - radius);
    path.lineTo(-halfWidth, -halfDepth + radius);
    path.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + radius, -halfDepth);
  }

  return path;
};

class KitchenCounter extends Entity {
  constructor({
    id = "kitchen-counter",
    position = new THREE.Vector3(),
    rotationY = 0,
    width = 7,
    cabinetColor = 0x6b4b35,
    counterColor = 0xb8ae98,
    metalColor = 0xaaa9a2,
    hasSink = true,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.panelManager = new HingedPanelManager({ ownerId: id });

    const woodMap = loadTexture({
      path: "/textures/furniture/kitchen-cabinet-sage-enamel.png",
      repeat: { x: Math.max(1, width / 3), y: 1.4 },
    });
    const cabinet = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodMap, roughness: 0.72 });
    const marbleMap = loadTexture({
      path: "/textures/furniture/kitchen-marble.png",
      repeat: { x: Math.max(1, width / 3), y: 1 },
    });
    const counter = new THREE.MeshStandardMaterial({
      color: counterColor,
      map: marbleMap,
      roughness: 0.34,
      metalness: 0.02,
    });
    const metal = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.23, metalness: 0.72 });
    const dark = new THREE.MeshStandardMaterial({
      color: cabinetColor,
      map: loadTexture({
        path: "/textures/furniture/wood2.jpg",
        repeat: { x: Math.max(1, width / 3), y: 1.2 },
      }),
      roughness: 0.8,
    });

    const frameThickness = 0.15;
    this.object3D.add(
      createBox({ width, height: frameThickness, depth: 2.15, position: new THREE.Vector3(0, frameThickness / 2, 0), material: dark }),
      createBox({ width: frameThickness, height: 2.55, depth: 2.15, position: new THREE.Vector3(-width / 2 + frameThickness / 2, 1.275, 0), material: dark }),
      createBox({ width: frameThickness, height: 2.55, depth: 2.15, position: new THREE.Vector3(width / 2 - frameThickness / 2, 1.275, 0), material: dark }),
      createBox({ width: width - frameThickness * 2, height: 2.4, depth: frameThickness, position: new THREE.Vector3(0, 1.275, -1), material: dark }),
    );

    if (hasSink) {
      const topWidth = width + 0.22;
      const topDepth = 2.35;
      const openingWidth = 1.7;
      const openingDepth = 1.24;
      const sideWidth = (topWidth - openingWidth) / 2;
      const edgeDepth = (topDepth - openingDepth) / 2;
      this.object3D.add(
        createBox({ width: sideWidth, height: 0.24, depth: topDepth, position: new THREE.Vector3(-(openingWidth + sideWidth) / 2, 2.67, 0.05), material: counter }),
        createBox({ width: sideWidth, height: 0.24, depth: topDepth, position: new THREE.Vector3((openingWidth + sideWidth) / 2, 2.67, 0.05), material: counter }),
        createBox({ width: openingWidth, height: 0.24, depth: edgeDepth, position: new THREE.Vector3(0, 2.67, 0.05 - (openingDepth + edgeDepth) / 2), material: counter }),
        createBox({ width: openingWidth, height: 0.24, depth: edgeDepth, position: new THREE.Vector3(0, 2.67, 0.05 + (openingDepth + edgeDepth) / 2), material: counter }),
      );
    } else {
      this.object3D.add(
        createBox({ width: width + 0.22, height: 0.24, depth: 2.35, position: new THREE.Vector3(0, 2.67, 0.05), material: counter }),
      );
    }

    const doorCount = width < 2.5 ? 1 : 3;
    const bayWidth = (width - 0.3) / doorCount;
    Array.from({ length: doorCount }, (_, index) => index).forEach((index) => {
      const x = -width / 2 + 0.15 + bayWidth / 2 + index * bayWidth;
      if (index < doorCount - 1) {
        this.object3D.add(
          createBox({ width: frameThickness, height: 2.4, depth: 2, position: new THREE.Vector3(x + bayWidth / 2, 1.275, 0), material: dark }),
        );
      }
      const hingeSign = index === doorCount - 1 && doorCount > 1 ? 1 : -1;
      const leafWidth = bayWidth - 0.1;
      const leafHeight = 2.28;
      const door = new THREE.Group();
      door.position.set(x + hingeSign * leafWidth / 2, 1.32, 1.12);
      const handle = createRoundedPullHandle({
        material: metal,
        height: 0.72,
      });
      handle.position.set(-hingeSign * (leafWidth - 0.25), 0.55, 0.13);
      door.add(
        createBox({ width: leafWidth, height: leafHeight, depth: 0.12, position: new THREE.Vector3(-hingeSign * leafWidth / 2, 0, 0), material: cabinet }),
        handle,
      );
      this.object3D.add(door);
      this.panelManager.register({ panel: door, index, openRotation: hingeSign < 0 ? -Math.PI / 2 : Math.PI / 2 });
    });

    if (hasSink) {
      const basinMaterial = new THREE.MeshStandardMaterial({ color: 0x777a78, roughness: 0.34, metalness: 0.68, side: THREE.DoubleSide });
      const basin = new THREE.Group();
      basin.name = `${id}-rectangular-sink`;
      basin.userData.fillable = true;
      basin.userData.fillLevel = 0;
      this.sinkBasin = basin;
      const basinBottom = createBox({
        width: 1.42,
        height: 0.07,
        depth: 0.88,
        position: new THREE.Vector3(0, 2.08, 0.08),
        material: basinMaterial,
      });
      const basinWallHeight = 0.7;
      const basinWallY = 2.4;
      const cornerGeometry = new THREE.CylinderGeometry(0.085, 0.07, basinWallHeight, 18);
      const leftWall = createBox({ width: 0.1, height: basinWallHeight, depth: 1, position: new THREE.Vector3(-0.76, basinWallY, 0.08), material: basinMaterial });
      const rightWall = createBox({ width: 0.1, height: basinWallHeight, depth: 1, position: new THREE.Vector3(0.76, basinWallY, 0.08), material: basinMaterial });
      const backWall = createBox({ width: 1.42, height: basinWallHeight, depth: 0.1, position: new THREE.Vector3(0, basinWallY, -0.46), material: basinMaterial });
      const frontWall = createBox({ width: 1.42, height: basinWallHeight, depth: 0.1, position: new THREE.Vector3(0, basinWallY, 0.62), material: basinMaterial });
      leftWall.rotation.z = -0.1;
      rightWall.rotation.z = 0.1;
      backWall.rotation.x = 0.1;
      frontWall.rotation.x = -0.1;
      basin.add(
        basinBottom,
        leftWall,
        rightWall,
        backWall,
        frontWall,
      );
      [[-0.71, -0.41], [0.71, -0.41], [-0.71, 0.57], [0.71, 0.57]].forEach(([x, z]) => {
        const corner = new THREE.Mesh(cornerGeometry, basinMaterial);
        corner.position.set(x, basinWallY, z);
        basin.add(corner);
      });

      const drainDark = new THREE.MeshStandardMaterial({ color: 0x2f3434, roughness: 0.3, metalness: 0.78 });
      const drain = new THREE.Group();
      const drainRing = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.025, 28), metal);
      const drainCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.03, 28), drainDark);
      drainRing.position.y = 2.1;
      drainCenter.position.y = 2.12;
      drain.add(drainRing, drainCenter);
      Array.from({ length: 6 }, (_, index) => {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.012, 0.015), metal);
        slot.position.y = 2.14;
        slot.rotation.y = (index / 6) * Math.PI;
        drain.add(slot);
        return slot;
      });
      drain.position.set(0, 0, 0.08);
      const rimY = 2.82;
      const rimShape = createRoundedRectanglePath(1.82, 1.32, 0.14);
      rimShape.holes.push(createRoundedRectanglePath(1.6, 1.1, 0.09, true));
      const rim = new THREE.Mesh(
        new THREE.ExtrudeGeometry(rimShape, { depth: 0.045, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.018, bevelSegments: 2 }),
        metal,
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, rimY, 0.08);

      const faucet = createCurvedFaucet({ material: metal, surfaceY: 2.82 });

      [basin, drain, rim].forEach((object) => {
        object.traverse((mesh) => {
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.ignoreAging = true;
        });
      });
      faucet.object3D?.traverse?.((mesh) => { mesh.userData.ignoreAging = true; });
      faucet.traverse?.((mesh) => { mesh.userData.ignoreAging = true; });
      this.object3D.add(basin, drain, rim, faucet);
    }
  }

  getInteractables() {
    return this.panelManager.getInteractables();
  }

  update(deltaTime) {
    this.panelManager.update(deltaTime);
  }

  setAudioListener(listener) {
    this.panelManager.setAudioListener(listener, this.object3D);
  }

  dispose() {
    this.panelManager.dispose();
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { KitchenCounter };
