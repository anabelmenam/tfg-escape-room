import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";
import createBox from "../helpers/createBox.js";
import { createWoodMaterials } from "../helpers/createWoodMaterials.js";
import { MechanicalAudio } from "../helpers/MechanicalAudio.js";

class Wardrobe extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,

    woodColor = 0x5a321d,
    darkWoodColor = 0x3d2114,
    interiorColor = 0x6d4d35,
    handleColor = 0xb58a45,

    woodTexture = null,
    darkWoodTexture = null,
    interiorTexture = null,

    woodNormalMap = null,
    woodRoughnessMap = null,

    woodTextureRepeat = {
      x: 1,
      y: 1,
    },

    darkWoodTextureRepeat = null,
    interiorTextureRepeat = null,
  } = {}) {
    super(id);

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.doors = [];
    this.drawers = [];
    this.interactables = [];

    this.doorStates = [false, false];
    this.drawerStates = [false, false];

    this.openDoorAngles = [-THREE.MathUtils.degToRad(105), THREE.MathUtils.degToRad(105)];
    this.closedDrawerZ = 1.42;
    this.openDrawerZ = 2.75;
    this.animationSpeed = 5;
    this.doorAudio = new MechanicalAudio({ kind: "cabinetDoor", volume: 0.34 });
    this.drawerAudio = new MechanicalAudio({ kind: "drawer", volume: 0.38 });

    this.createMaterials({
      woodColor,
      darkWoodColor,
      interiorColor,
      handleColor,

      woodTexture,
      darkWoodTexture,
      interiorTexture,

      woodNormalMap,
      woodRoughnessMap,

      woodTextureRepeat,
      darkWoodTextureRepeat,
      interiorTextureRepeat,
    });
    this.createStructure();
    this.createDoors();
    this.createDrawers();
  }

  createMaterials({
    woodColor,
    darkWoodColor,
    interiorColor,
    handleColor,

    woodTexture,
    darkWoodTexture,
    interiorTexture,

    woodNormalMap,
    woodRoughnessMap,

    woodTextureRepeat,
    darkWoodTextureRepeat,
    interiorTextureRepeat,
  }) {
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

      woodTextureRepeat,
      darkWoodTextureRepeat,
      interiorTextureRepeat,
    });

    this.woodMaterial = materials.wood;
    this.darkWoodMaterial = materials.darkWood;
    this.interiorMaterial = materials.interior;
    this.handleMaterial = materials.handle;

    this.railMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.35,
      metalness: 0.8,
    });
  }

  createStructure() {
    const leftSide = createBox({
      width: 0.3,
      height: 8,
      depth: 3,
      position: new THREE.Vector3(-3, 4, 0),
      material: this.woodMaterial,
    });

    const rightSide = createBox({
      width: 0.3,
      height: 8,
      depth: 3,
      position: new THREE.Vector3(3, 4, 0),
      material: this.woodMaterial,
    });

    const top = createBox({
      width: 6.3,
      height: 0.3,
      depth: 3.15,
      position: new THREE.Vector3(0, 8, 0),
      material: this.woodMaterial,
    });

    const bottom = createBox({
      width: 6,
      height: 0.25,
      depth: 3,
      position: new THREE.Vector3(0, 0.55, 0),
      material: this.woodMaterial,
    });

    const back = createBox({
      width: 5.7,
      height: 7.5,
      depth: 0.18,
      position: new THREE.Vector3(0, 4.15, -1.42),
      material: this.woodMaterial,
    });

    const drawerDivider = createBox({
      width: 5.7,
      height: 0.2,
      depth: 2.75,
      position: new THREE.Vector3(0, 2.15, 0),
      material: this.woodMaterial,
    });

    const centralDrawerDivider = createBox({
      width: 0.18,
      height: 1.4,
      depth: 2.7,
      position: new THREE.Vector3(0, 1.35, 0),
      material: this.woodMaterial,
    });

    const interiorShelf = createBox({
      width: 5.6,
      height: 0.16,
      depth: 2.65,
      position: new THREE.Vector3(0, 6.8, -0.05),
      material: this.interiorMaterial,
    });

    const wardrobeFloor = createBox({
      width: 5.6,
      height: 0.16,
      depth: 2.65,
      position: new THREE.Vector3(0, 2.3, -0.05),
      material: this.interiorMaterial,
    });

    const rail = this.createRail();

    this.object3D.add(
      leftSide,
      rightSide,
      top,
      bottom,
      back,
      drawerDivider,
      centralDrawerDivider,
      interiorShelf,
      wardrobeFloor,
      rail,
    );

    this.createLegs();
  }

  createLegs() {
    const legPositions = [
      [-2.7, 0.25, 1.2],
      [2.7, 0.25, 1.2],
      [-2.7, 0.25, -1.2],
      [2.7, 0.25, -1.2],
    ];

    legPositions.forEach(([x, y, z]) => {
      const leg = createBox({
        width: 0.4,
        height: 0.5,
        depth: 0.4,
        position: new THREE.Vector3(x, y, z),
        material: this.woodMaterial,
      });

      this.object3D.add(leg);
    });
  }

  createRail() {
    const geometry = new THREE.CylinderGeometry(0.08, 0.08, 5.8, 20);
    const rail = new THREE.Mesh(geometry, this.railMaterial);

    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 6.3, -0.15);

    rail.castShadow = true;
    rail.receiveShadow = true;

    return rail;
  }

  createDoors() {
    const leftDoor = this.createDoor({
      index: 0,
      side: "left",
    });

    const rightDoor = this.createDoor({
      index: 1,
      side: "right",
    });

    this.doors.push(leftDoor, rightDoor);
    this.object3D.add(leftDoor, rightDoor);
  }

  createDoor({ index, side }) {

    const door = new THREE.Group();

    const isLeftDoor = side === "left";

    const pivotX = isLeftDoor ? -2.82 : 2.82;
    const panelOffsetX = isLeftDoor ? 1.4 : -1.4;

    door.position.set(pivotX, 5.05, 1.53);
    door.userData.doorIndex = index;

    const panel = createBox({
      width: 2.8,
      height: 5.55,
      depth: 0.18,
      position: new THREE.Vector3(panelOffsetX, 0, 0),
      material: this.woodMaterial,
    });

    const handle = this.createDoorHandle();

    handle.position.set(isLeftDoor ? 2.45 : -2.45, -0.1, 0.12);

    door.add(panel, handle);

    door.traverse((child) => {
      child.userData.doorRoot = door;
      child.userData.doorIndex = index;
    });

    const doorInteractable = {
      id: `${this.id}-door-${index}`,
      object3D: door,
      enabled: true,

      getInteractionText: () => {
        return this.doorStates[index] ? tInteraction("close", tItem("door")) : tInteraction("open", tItem("door"));
      },

      interact: () => {
        this.toggleDoor(index);
      },
    };

    this.interactables.push(doorInteractable);

    return door;
  }

  createDrawers() {
    const leftDrawer = this.createDrawer({
      index: 0,
      x: -1.45,
    });

    const rightDrawer = this.createDrawer({
      index: 1,
      x: 1.45,
    });

    this.drawers.push(leftDrawer, rightDrawer);
    this.object3D.add(leftDrawer, rightDrawer);
  }

  createDrawer({ index, x }) {
    const drawer = new THREE.Group();

    drawer.position.set(x, 1.35, this.closedDrawerZ);
    drawer.userData.drawerIndex = index;

    const front = createBox({
      width: 2.7,
      height: 1.25,
      depth: 0.18,
      position: new THREE.Vector3(0, 0, 0),
      material: this.woodMaterial,
    });

    const drawerBottom = createBox({
      width: 2.4,
      height: 0.12,
      depth: 2.25,
      position: new THREE.Vector3(0, -0.48, -1.07),
      material: this.interiorMaterial,
    });

    const leftWall = createBox({
      width: 0.12,
      height: 0.8,
      depth: 2.2,
      position: new THREE.Vector3(-1.14, -0.08, -1.07),
      material: this.interiorMaterial,
    });

    const rightWall = createBox({
      width: 0.12,
      height: 0.8,
      depth: 2.2,
      position: new THREE.Vector3(1.14, -0.08, -1.07),
      material: this.interiorMaterial,
    });

    const rearWall = createBox({
      width: 2.4,
      height: 0.8,
      depth: 0.12,
      position: new THREE.Vector3(0, -0.08, -2.12),
      material: this.interiorMaterial,
    });

    const handle = this.createDrawerHandle();
    handle.position.set(0, 0, 0.1);

    drawer.add(front, drawerBottom, leftWall, rightWall, rearWall, handle);

    drawer.traverse((child) => {
      child.userData.drawerRoot = drawer;
      child.userData.drawerIndex = index;
    });

    const drawerInteractable = {
      id: `${this.id}-drawer-${index}`,
      object3D: drawer,
      enabled: true,

      getInteractionText: () => {
        return this.drawerStates[index]
          ? tInteraction("close", tItem("drawer"))
          : tInteraction("open", tItem("drawer"));
      },

      interact: () => {
        this.toggleDrawer(index);
      },
    };

    this.interactables.push(drawerInteractable);

    return drawer;
  }

  createDoorHandle() {
    const handleGroup = new THREE.Group();

    const handleHeight = 0.9;
    const handleThickness = 0.12;
    const supportDepth = 0.22;

    const bar = createBox({
      width: handleThickness,
      height: handleHeight,
      depth: handleThickness,
      position: new THREE.Vector3(0, 0, 0.16),
      material: this.handleMaterial,
    });

    const upperSupport = createBox({
      width: 0.1,
      height: 0.1,
      depth: supportDepth,
      position: new THREE.Vector3(0, handleHeight / 2 - 0.08, 0.06),
      material: this.handleMaterial,
    });

    const lowerSupport = createBox({
      width: 0.1,
      height: 0.1,
      depth: supportDepth,
      position: new THREE.Vector3(0, -handleHeight / 2 + 0.08, 0.06),
      material: this.handleMaterial,
    });

    handleGroup.add(bar, upperSupport, lowerSupport);

    return handleGroup;
  }

  createDrawerHandle() {
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
    return this.interactables;
  }

  openDoor(index) {
    if (!this.doors[index]) {
      return;
    }

    this.doorStates[index] = true;
    this.doorAudio.play("open", 4.6 / this.animationSpeed);
  }

  closeDoor(index) {
    if (!this.doors[index]) {
      return;
    }

    this.doorStates[index] = false;
    this.doorAudio.play("close", 4.6 / this.animationSpeed);
  }

  toggleDoor(index) {
    if (!this.doors[index]) {
      return;
    }

    this.doorStates[index] = !this.doorStates[index];
    this.doorAudio.play(this.doorStates[index] ? "open" : "close", 4.6 / this.animationSpeed);
  }

  openDrawer(index) {
    if (!this.drawers[index]) {
      return;
    }

    this.drawerStates[index] = true;
    this.drawerAudio.play("open", 4.3 / this.animationSpeed);
  }

  closeDrawer(index) {
    if (!this.drawers[index]) {
      return;
    }

    this.drawerStates[index] = false;
    this.drawerAudio.play("close", 4.3 / this.animationSpeed);
  }

  toggleDrawer(index) {
    if (!this.drawers[index]) {
      return;
    }

    this.drawerStates[index] = !this.drawerStates[index];
    this.drawerAudio.play(this.drawerStates[index] ? "open" : "close", 4.3 / this.animationSpeed);
  }

  closeAllDoors() {
    this.doorStates.fill(false);
  }

  closeAllDrawers() {
    this.drawerStates.fill(false);
  }

  closeAll() {
    this.closeAllDoors();
    this.closeAllDrawers();
  }

  addObjectToDrawer(index, object3D, position = new THREE.Vector3()) {
    const drawer = this.drawers[index];

    if (!drawer || !object3D) {
      return false;
    }

    drawer.add(object3D);
    object3D.position.copy(position);

    return true;
  }

  addObjectToInterior(object3D, position = new THREE.Vector3()) {
    if (!object3D) {
      return false;
    }

    this.object3D.add(object3D);
    object3D.position.copy(position);

    return true;
  }

  update(deltaTime) {
    this.doors.forEach((door, index) => {
      const targetRotation = this.doorStates[index] ? this.openDoorAngles[index] : 0;

      door.rotation.y = THREE.MathUtils.damp(door.rotation.y, targetRotation, this.animationSpeed, deltaTime);
    });

    this.drawers.forEach((drawer, index) => {
      const targetZ = this.drawerStates[index] ? this.openDrawerZ : this.closedDrawerZ;

      drawer.position.z = THREE.MathUtils.damp(drawer.position.z, targetZ, this.animationSpeed, deltaTime);
    });
  }

  setAudioListener(listener) {
    this.doorAudio.setAudioListener(listener, this.object3D);
    this.drawerAudio.setAudioListener(listener, this.object3D);
  }

  dispose() {
    this.doorAudio.dispose();
    this.drawerAudio.dispose();
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);

    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Wardrobe };
