import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { createWoodMaterials } from "../helpers/createWoodMaterials.js";
import { DrawerManager } from "../helpers/DrawerManager.js";

class Desk extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    woodColor = 0x5a321d,
    darkWoodColor = 0x3d2114,
    interiorColor = 0x6b4226,
    handleColor = 0x8a6a42,
    woodTexture = null,
    darkWoodTexture = null,
    interiorTexture = null,
    woodNormalMap = null,
    woodRoughnessMap = null,
    darkWoodNormalMap = null,
    darkWoodRoughnessMap = null,
    interiorNormalMap = null,
    interiorRoughnessMap = null,
    woodTextureRepeat = {
      x: 1,
      y: 1,
    },
    darkWoodTextureRepeat = null,
    interiorTextureRepeat = null,
    drawerOpenDistance = 1.22,
    drawerSpeed = 5,
    lockedDrawers = [],
  } = {}) {
    super(id);

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.drawerOpenDistance = drawerOpenDistance;
    this.drawerSpeed = drawerSpeed;
    this.drawerManager = new DrawerManager({
      ownerId: this.id,
      drawerSpeed,
      lockedDrawers,
    });

    const materials = createWoodMaterials({
      woodColor,
      darkWoodColor,
      interiorColor,
      handleColor,
      woodTexture,
      darkWoodTexture,
      interiorTexture,
      woodNormalMap,
      woodRoughnessMap,
      darkWoodNormalMap,
      darkWoodRoughnessMap,
      interiorNormalMap,
      interiorRoughnessMap,
      woodTextureRepeat,
      darkWoodTextureRepeat,
      interiorTextureRepeat,
    });

    this.woodMaterial = materials.wood;
    this.darkWoodMaterial = materials.darkWood;
    this.drawerInteriorMaterial = materials.interior;
    this.handleMaterial = materials.handle;

    this.createStructure();
    this.createDrawers();
  }

  createStructure() {
    const tabletop = createBox({
      width: 7,
      height: 0.3,
      depth: 3.4,
      position: new THREE.Vector3(0, 3.15, 0),
      material: this.woodMaterial,
    });

    const rearSupport = createBox({
      width: 6.3,
      height: 0.22,
      depth: 0.35,
      position: new THREE.Vector3(0, 1.97, -1.45),
      material: this.darkWoodMaterial,
    });

    const leftDrawerSupport = createBox({
      width: 0.22,
      height: 1.1,
      depth: 2.8,
      position: new THREE.Vector3(-3.05, 2.6, 0),
      material: this.darkWoodMaterial,
    });

    const rightDrawerSupport = createBox({
      width: 0.22,
      height: 1.1,
      depth: 2.8,
      position: new THREE.Vector3(0.05, 2.6, 0),
      material: this.darkWoodMaterial,
    });

    const drawerTopSupport = createBox({
      width: 3.1,
      height: 0.15,
      depth: 2.8,
      position: new THREE.Vector3(-1.5, 3.04, 0),
      material: this.darkWoodMaterial,
    });

    this.object3D.add(tabletop, rearSupport, leftDrawerSupport, rightDrawerSupport, drawerTopSupport);
    this.createLegs();
  }

  createLegs() {
    const legPositions = [
      [-3.05, 1.5, 1.35],
      [3.05, 1.5, 1.35],
      [-3.05, 1.5, -1.35],
      [3.05, 1.5, -1.35],
    ];

    legPositions.forEach(([x, y, z]) => {
      const leg = createBox({
        width: 0.38,
        height: 3,
        depth: 0.38,
        position: new THREE.Vector3(x, y, z),
        material: this.woodMaterial,
      });

      this.object3D.add(leg);
    });
  }

  createDrawers() {
    const drawer = this.createDrawer({
      index: 0,
      x: -1.5,
      y: 2.56,
      closedZ: 1.28,
    });
    this.object3D.add(drawer);

    this.drawerManager.registerDrawer({
      drawer,
      index: 0,
      closedZ: drawer.userData.closedZ,
      openZ: drawer.userData.openZ,
    });
  }

  createDrawer({ index, x, y, closedZ }) {
    const drawer = new THREE.Group();
    drawer.position.set(x, y, closedZ);
    drawer.userData.drawerIndex = index;
    drawer.userData.closedZ = closedZ;
    drawer.userData.openZ = closedZ + this.drawerOpenDistance;

    const front = createBox({
      width: 2.85,
      height: 0.9,
      depth: 0.18,
      position: new THREE.Vector3(0, 0, 0),
      material: this.woodMaterial,
    });

    const bottom = createBox({
      width: 2.55,
      height: 0.12,
      depth: 2.25,
      position: new THREE.Vector3(0, -0.32, -1.05),
      material: this.drawerInteriorMaterial,
    });

    const leftWall = createBox({
      width: 0.12,
      height: 0.6,
      depth: 2.2,
      position: new THREE.Vector3(-1.21, -0.02, -1.05),
      material: this.drawerInteriorMaterial,
    });

    const rightWall = createBox({
      width: 0.12,
      height: 0.6,
      depth: 2.2,
      position: new THREE.Vector3(1.21, -0.02, -1.05),
      material: this.drawerInteriorMaterial,
    });

    const rearWall = createBox({
      width: 2.55,
      height: 0.6,
      depth: 0.12,
      position: new THREE.Vector3(0, -0.02, -2.1),
      material: this.drawerInteriorMaterial,
    });

    const handle = this.createHandle();
    handle.position.set(0, 0, 0.1);
    drawer.add(front, bottom, leftWall, rightWall, rearWall, handle);
    drawer.traverse((child) => {
      child.userData.drawerRoot = drawer;
      child.userData.drawerIndex = index;
    });

    return drawer;
  }

  createHandle() {
    const handleGroup = new THREE.Group();

    const handleWidth = 1.05;
    const handleThickness = 0.12;
    const supportDepth = 0.22;

    const bar = createBox({
      width: handleWidth,
      height: handleThickness,
      depth: handleThickness,
      position: new THREE.Vector3(0, 0, 0.16),
      material: this.handleMaterial,
    });

    const leftSupport = createBox({
      width: 0.1,
      height: 0.1,
      depth: supportDepth,
      position: new THREE.Vector3(-handleWidth / 2 + 0.08, 0, 0.06),
      material: this.handleMaterial,
    });

    const rightSupport = createBox({
      width: 0.1,
      height: 0.1,
      depth: supportDepth,
      position: new THREE.Vector3(handleWidth / 2 - 0.08, 0, 0.06),
      material: this.handleMaterial,
    });

    handleGroup.add(bar, leftSupport, rightSupport);

    return handleGroup;
  }

  getInteractables() {
    return this.drawerManager.getInteractables();
  }

  getDrawer(index = 0) {
    return this.drawerManager.getDrawer(index);
  }

  openDrawer(index = 0) {
    return this.drawerManager.open(index);
  }

  closeDrawer(index = 0) {
    return this.drawerManager.close(index);
  }

  toggleDrawer(index = 0) {
    return this.drawerManager.toggle(index);
  }

  lockDrawer(index = 0) {
    return this.drawerManager.lock(index);
  }

  unlockDrawer(index = 0) {
    return this.drawerManager.unlock(index);
  }

  isDrawerLocked(index = 0) {
    return this.drawerManager.isLocked(index);
  }

  addObjectToDrawer(index, object3D, position = new THREE.Vector3()) {
    return this.drawerManager.addObject(index, object3D, position);
  }

  update(deltaTime) {
    this.drawerManager.update(deltaTime);
  }

  setAudioListener(listener) {
    this.drawerManager.setAudioListener(listener, this.object3D);
  }

  dispose() {
    this.drawerManager.dispose();
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);

    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Desk };
