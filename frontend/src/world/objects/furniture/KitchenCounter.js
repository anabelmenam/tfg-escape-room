import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { HingedPanelManager } from "../helpers/HingedPanelManager.js";
import { DrawerManager } from "../helpers/DrawerManager.js";
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
    this.drawerManager = new DrawerManager({ ownerId: id, drawerSpeed: 7 });

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
      const hasDrawer = hasSink && doorCount > 1 && index === 0;
      const leafHeight = hasDrawer ? 1.7 : 2.28;
      const door = new THREE.Group();
      door.position.set(x + hingeSign * leafWidth / 2, hasDrawer ? 1.03 : 1.32, 1.12);
      const handle = createRoundedPullHandle({
        material: metal,
        height: 0.72,
      });
      handle.position.set(-hingeSign * (leafWidth - 0.25), hasDrawer ? 0.3 : 0.55, 0.13);
      door.add(
        createBox({ width: leafWidth, height: leafHeight, depth: 0.12, position: new THREE.Vector3(-hingeSign * leafWidth / 2, 0, 0), material: cabinet }),
        handle,
      );
      this.object3D.add(door);
      this.panelManager.register({ panel: door, index, openRotation: hingeSign < 0 ? -Math.PI / 2 : Math.PI / 2 });
      if (hasDrawer) {
        const drawer = new THREE.Group();
        drawer.position.set(x, 2.18, 1.12);
        drawer.add(
          createBox({ width: leafWidth, height: 0.6, depth: 0.12, position: new THREE.Vector3(0, 0.06, 0), material: cabinet }),
          createBox({ width: leafWidth - 0.12, height: 0.09, depth: 1.68, position: new THREE.Vector3(0, -0.2, -0.85), material: dark }),
          createBox({ width: 0.09, height: 0.37, depth: 1.68, position: new THREE.Vector3(-leafWidth / 2 + 0.08, 0, -0.85), material: dark }),
          createBox({ width: 0.09, height: 0.37, depth: 1.68, position: new THREE.Vector3(leafWidth / 2 - 0.08, 0, -0.85), material: dark }),
          createBox({ width: leafWidth - 0.12, height: 0.37, depth: 0.09, position: new THREE.Vector3(0, 0, -1.64), material: dark }),
        );
        const drawerHandle = createRoundedPullHandle({ material: metal, height: 0.52 });
        drawerHandle.rotation.z = Math.PI / 2;
        drawerHandle.position.z = 0.13;
        drawer.add(drawerHandle);
        this.object3D.add(drawer);
        this.drawerManager.registerDrawer({ drawer, index: 0, closedZ: 1.12, openZ: 2.38 });
      }
    });

    if (hasSink) {
      const basinMaterial = new THREE.MeshStandardMaterial({ color: 0xa8aaa6, roughness: 0.24, metalness: 0.82, side: THREE.DoubleSide });
      const basin = new THREE.Group();
      basin.name = `${id}-rectangular-sink`;
      basin.userData.fillable = true;
      basin.userData.fillLevel = 0;
      this.sinkBasin = basin;
      const floorShape = createRoundedRectanglePath(1.46, 0.94, 0.16);
      const basinBottom = new THREE.Mesh(new THREE.ShapeGeometry(floorShape, 32), basinMaterial);
      basinBottom.rotation.x = -Math.PI / 2;
      basinBottom.position.set(0, 2.1, 0.08);

      const wallShape = createRoundedRectanglePath(1.66, 1.14, 0.2);
      wallShape.holes.push(createRoundedRectanglePath(1.46, 0.94, 0.15, true));
      const basinWalls = new THREE.Mesh(
        new THREE.ExtrudeGeometry(wallShape, {
          depth: 0.65,
          bevelEnabled: true,
          bevelSize: 0.025,
          bevelThickness: 0.025,
          bevelSegments: 3,
          curveSegments: 24,
        }),
        basinMaterial,
      );
      basinWalls.rotation.x = Math.PI / 2;
      basinWalls.position.set(0, 2.77, 0.08);
      basin.add(basinBottom, basinWalls);

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
    return [...this.panelManager.getInteractables(), ...this.drawerManager.getInteractables()];
  }

  addObjectToDrawer(index, object3D, position = new THREE.Vector3()) {
    return this.drawerManager.addObject(index, object3D, position);
  }

  update(deltaTime) {
    this.panelManager.update(deltaTime);
    this.drawerManager.update(deltaTime);
  }

  setAudioListener(listener) {
    this.panelManager.setAudioListener(listener, this.object3D);
    this.drawerManager.setAudioListener(listener, this.object3D);
  }

  dispose() {
    this.panelManager.dispose();
    this.drawerManager.dispose();
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { KitchenCounter };
