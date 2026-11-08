import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { createWoodMaterials } from "../helpers/createWoodMaterials.js";
import { DrawerManager } from "../helpers/DrawerManager.js";

class Cabinet extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    width = 4,
    height = 5,
    depth = 2.2,
    rows = 4,
    columns = 1,
    frameThickness = 0.15,
    drawerGap = 0.08,
    drawerOpenDistance = 1.5,
    drawerSpeed = 10,
    lockedDrawers = [],
    requiredDrawerKeys = {},
    handleType = "knob",
    handleColor = 0x8a6a42,
    woodColor = 0x5a321d,
    darkWoodColor = 0x3d2114,
    drawerInteriorColor = 0x6b4226,
    woodTexture = null,
    darkWoodTexture = null,
    drawerInteriorTexture = null,
    woodNormalMap = null,
    woodRoughnessMap = null,
    woodTextureRepeat = {
      x: 1,
      y: 1,
    },
    darkWoodTextureRepeat = null,
    drawerInteriorTextureRepeat = null,
  } = {}) {
    super(id);

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.rows = Math.max(1, rows);
    this.columns = Math.max(1, columns);
    this.frameThickness = frameThickness;
    this.drawerGap = drawerGap;
    this.drawerOpenDistance = drawerOpenDistance;
    this.drawerSpeed = drawerSpeed;
    this.drawerManager = new DrawerManager({
      ownerId: this.id,
      drawerSpeed,
      lockedDrawers,
      requiredDrawerKeys,
    });

    this.handleType = handleType;
    this.handleColor = handleColor;

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.createMaterials({
      woodColor,
      darkWoodColor,
      drawerInteriorColor,
      handleColor,
      woodTexture,
      darkWoodTexture,
      drawerInteriorTexture,
      woodNormalMap,
      woodRoughnessMap,
      woodTextureRepeat,
      darkWoodTextureRepeat,
      drawerInteriorTextureRepeat,
    });

    this.createStructure();
    this.createDrawers();
  }

  createMaterials({
    woodColor,
    darkWoodColor,
    drawerInteriorColor,
    handleColor,
    woodTexture,
    darkWoodTexture,
    drawerInteriorTexture,
    woodNormalMap,
    woodRoughnessMap,
    woodTextureRepeat,
    darkWoodTextureRepeat,
    drawerInteriorTextureRepeat,
  }) {
    const materials = createWoodMaterials({
      woodColor,
      darkWoodColor,
      interiorColor: drawerInteriorColor,
      handleColor,
      woodTexture,
      darkWoodTexture,
      interiorTexture: drawerInteriorTexture,
      woodNormalMap,
      woodRoughnessMap,
      woodTextureRepeat,
      darkWoodTextureRepeat,
      interiorTextureRepeat: drawerInteriorTextureRepeat,
    });

    this.woodMaterial = materials.wood;
    this.darkWoodMaterial = materials.darkWood;
    this.drawerInteriorMaterial = materials.interior;
    this.handleMaterial = materials.handle;
  }

  createStructure() {
    const sideHeight = this.height - this.frameThickness * 2;
    const innerWidth = this.width - this.frameThickness * 2;

    const leftSide = createBox({
      width: this.frameThickness,
      height: sideHeight,
      depth: this.depth,
      position: new THREE.Vector3(-this.width / 2 + this.frameThickness / 2, this.height / 2, 0),
      material: this.darkWoodMaterial,
    });

    const rightSide = createBox({
      width: this.frameThickness,
      height: sideHeight,
      depth: this.depth,
      position: new THREE.Vector3(this.width / 2 - this.frameThickness / 2, this.height / 2, 0),
      material: this.darkWoodMaterial,
    });

    const top = createBox({
      width: this.width,
      height: this.frameThickness,
      depth: this.depth + 0.1,
      position: new THREE.Vector3(0, this.height - this.frameThickness / 2, 0),
      material: this.woodMaterial,
    });

    const bottom = createBox({
      width: innerWidth,
      height: this.frameThickness,
      depth: this.depth,
      position: new THREE.Vector3(0, this.frameThickness / 2, 0),
      material: this.darkWoodMaterial,
    });

    const back = createBox({
      width: innerWidth,
      height: sideHeight,
      depth: this.frameThickness,
      position: new THREE.Vector3(0, this.height / 2, -this.depth / 2 + this.frameThickness / 2),
      material: this.darkWoodMaterial,
    });

    this.object3D.add(leftSide, rightSide, top, bottom, back);
  }

  createDrawers() {
    const usableWidth = this.width - this.frameThickness * 2 - this.drawerGap * (this.columns + 1);
    const usableHeight = this.height - this.frameThickness * 2 - this.drawerGap * (this.rows + 1);
    const drawerWidth = usableWidth / this.columns;
    const drawerHeight = usableHeight / this.rows;

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const x =
          -this.width / 2 +
          this.frameThickness +
          this.drawerGap +
          drawerWidth / 2 +
          column * (drawerWidth + this.drawerGap);

        const y =
          this.height - this.frameThickness - this.drawerGap - drawerHeight / 2 - row * (drawerHeight + this.drawerGap);

        this.createDrawer({
          width: drawerWidth,
          height: drawerHeight,
          x,
          y,
        });
      }
    }
  }

  createDrawer({ width, height, x, y }) {
    const drawerIndex = this.drawerManager.drawers.length;
    const drawer = new THREE.Group();
    drawer.position.set(x, y, this.depth / 2 - this.frameThickness);
    drawer.userData.closedZ = drawer.position.z;
    drawer.userData.openZ = drawer.position.z + this.drawerOpenDistance;

    this.createDrawerBody({
      drawer,
      width,
      height,
    });
    this.createDrawerFront({
      drawer,
      width,
      height,
    });
    this.createHandle({
      drawer,
      width,
      height,
    });

    this.object3D.add(drawer);
    this.drawerManager.registerDrawer({
      drawer,
      index: drawerIndex,
      closedZ: drawer.userData.closedZ,
      openZ: drawer.userData.openZ,
    });
  }

  createDrawerBody({ drawer, width, height }) {
    const wallThickness = Math.min(0.1, this.frameThickness);

    const drawerDepth = this.depth - this.frameThickness * 2;

    const interiorWidth = width - wallThickness * 2;
    const interiorHeight = Math.max(0.15, height - wallThickness * 2);

    const bottom = createBox({
      width: interiorWidth,
      height: wallThickness,
      depth: drawerDepth,
      position: new THREE.Vector3(0, -height / 2 + wallThickness / 2, -drawerDepth / 2),
      material: this.drawerInteriorMaterial,
    });

    const leftSide = createBox({
      width: wallThickness,
      height: interiorHeight,
      depth: drawerDepth,
      position: new THREE.Vector3(-width / 2 + wallThickness / 2, 0, -drawerDepth / 2),
      material: this.drawerInteriorMaterial,
    });

    const rightSide = createBox({
      width: wallThickness,
      height: interiorHeight,
      depth: drawerDepth,
      position: new THREE.Vector3(width / 2 - wallThickness / 2, 0, -drawerDepth / 2),
      material: this.drawerInteriorMaterial,
    });

    const rear = createBox({
      width: interiorWidth,
      height: interiorHeight,
      depth: wallThickness,
      position: new THREE.Vector3(0, 0, -drawerDepth + wallThickness / 2),
      material: this.drawerInteriorMaterial,
    });

    drawer.add(bottom, leftSide, rightSide, rear);
  }

  createDrawerFront({ drawer, width, height }) {
    const front = createBox({
      width,
      height,
      depth: this.frameThickness,
      position: new THREE.Vector3(0, 0, this.frameThickness / 2),
      material: this.woodMaterial,
    });

    drawer.add(front);
  }

  createHandle({ drawer, width }) {
    if (this.handleType === "none") {
      return;
    }

    if (this.handleType === "bar") {
      const handleWidth = Math.min(width * 0.45, 1.2);

      const bar = createBox({
        width: handleWidth,
        height: 0.12,
        depth: 0.12,
        position: new THREE.Vector3(0, 0, this.frameThickness + 0.16),
        material: this.handleMaterial,
      });

      const leftSupport = createBox({
        width: 0.1,
        height: 0.1,
        depth: 0.22,
        position: new THREE.Vector3(-handleWidth / 2 + 0.08, 0, this.frameThickness + 0.06),
        material: this.handleMaterial,
      });

      const rightSupport = createBox({
        width: 0.1,
        height: 0.1,
        depth: 0.22,
        position: new THREE.Vector3(handleWidth / 2 - 0.08, 0, this.frameThickness + 0.06),
        material: this.handleMaterial,
      });

      drawer.add(bar, leftSupport, rightSupport);

      return;
    }

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), this.handleMaterial);
    knob.position.set(0, 0, this.frameThickness + 0.13);
    drawer.add(knob);
  }

  getDrawerIndex(row, column = 0) {
    if (row < 0 || row >= this.rows || column < 0 || column >= this.columns) {
      return -1;
    }

    return row * this.columns + column;
  }

  toggleDrawer(index) {
    return this.drawerManager.toggle(index);
  }

  openDrawer(index) {
    return this.drawerManager.open(index);
  }

  closeDrawer(index) {
    return this.drawerManager.close(index);
  }

  lockDrawer(index) {
    return this.drawerManager.lock(index);
  }

  unlockDrawer(index) {
    return this.drawerManager.unlock(index);
  }

  isDrawerLocked(index) {
    return this.drawerManager.isLocked(index);
  }

  getInteractables() {
    return this.drawerManager.getInteractables();
  }

  getDrawer(index) {
    return this.drawerManager.getDrawer(index);
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

  addObjectToDrawerAt(row, column, object3D, localPosition = new THREE.Vector3()) {
    const drawerIndex = this.getDrawerIndex(row, column);

    if (drawerIndex === -1) {
      return false;
    }

    return this.addObjectToDrawer(drawerIndex, object3D, localPosition);
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);

    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Cabinet };
