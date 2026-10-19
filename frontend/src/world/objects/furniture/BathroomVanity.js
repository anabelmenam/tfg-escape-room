import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";
import { DrawerManager } from "../helpers/DrawerManager.js";
import { tInteraction, tItem } from "../../../translations/index.js";
import { createCurvedFaucet } from "../helpers/createCurvedFaucet.js";
import { MechanicalAudio } from "../helpers/MechanicalAudio.js";
import { loadTexture } from "../helpers/loadTexture.js";

class BathroomVanity extends Entity {
  constructor({
    id = "bathroom-vanity",
    position = new THREE.Vector3(),
    rotationY = 0,
    cabinetColor = 0x7b573d,
    fixtureColor = 0xf1ead9,
    metalColor = 0xb9aa83,
    drawerSpeed = 7,
    doorSpeed = 7,
    lockedDrawers = [],
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.doorSpeed = doorSpeed;
    this.drawerManager = new DrawerManager({ ownerId: id, drawerSpeed, lockedDrawers });
    this.doorAudio = new MechanicalAudio({ kind: "cabinetDoor", volume: 0.32 });
    this.cabinetDoors = [];
    this.doorStates = [];
    this.waterFill = 0;
    this.waterFillTarget = 0;

    const cabinetMap = loadTexture({
      path: "/textures/furniture/kitchen-cabinet-sage-enamel.png",
      repeat: { x: 1.8, y: 1.25 },
    });
    const frameMap = loadTexture({
      path: "/textures/furniture/kitchen-cabinet-walnut.png",
      repeat: { x: 1.8, y: 1.25 },
    });
    const marbleMap = loadTexture({
      path: "/textures/furniture/kitchen-marble.png",
      repeat: { x: 1.8, y: 1 },
    });
    this.woodMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: cabinetMap, roughness: 0.72 });
    this.darkWoodMaterial = new THREE.MeshStandardMaterial({ color: cabinetColor, map: frameMap, roughness: 0.82 });
    this.stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d0c4, map: marbleMap, roughness: 0.34 });
    this.porcelainMaterial = new THREE.MeshStandardMaterial({ color: fixtureColor, roughness: 0.25 });
    this.metalMaterial = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.24, metalness: 0.72 });

    this.createStructure();
    this.createDrawer();
    this.createCabinetDoors();
    this.createSink();
  }

  createStructure() {
    this.object3D.add(
      createBox({ width: 4.6, height: 0.16, depth: 1.65, position: new THREE.Vector3(0, 0.08, 0), material: this.darkWoodMaterial }),
      createBox({ width: 4.6, height: 0.16, depth: 1.65, position: new THREE.Vector3(0, 2.48, 0), material: this.darkWoodMaterial }),
      createBox({ width: 0.16, height: 2.4, depth: 1.65, position: new THREE.Vector3(-2.22, 1.28, 0), material: this.darkWoodMaterial }),
      createBox({ width: 0.16, height: 2.4, depth: 1.65, position: new THREE.Vector3(2.22, 1.28, 0), material: this.darkWoodMaterial }),
      createBox({ width: 4.28, height: 0.14, depth: 1.55, position: new THREE.Vector3(0, 1.67, 0), material: this.darkWoodMaterial }),
      createBox({ width: 4.28, height: 2.25, depth: 0.12, position: new THREE.Vector3(0, 1.25, -0.77), material: this.darkWoodMaterial }),
      createBox({ width: 4.9, height: 0.22, depth: 1.9, position: new THREE.Vector3(0, 2.66, 0.06), material: this.stoneMaterial }),
    );
  }

  createDrawer() {
    const drawer = new THREE.Group();
    const closedZ = 0.73;
    const width = 4.18;
    const height = 0.62;
    const depth = 1.35;
    drawer.position.set(0, 2.08, closedZ);
    drawer.add(
      createBox({ width, height, depth: 0.15, position: new THREE.Vector3(0, 0, 0.08), material: this.woodMaterial }),
      createBox({ width: width - 0.18, height: 0.1, depth, position: new THREE.Vector3(0, -height / 2 + 0.07, -depth / 2), material: this.darkWoodMaterial }),
      createBox({ width: 0.1, height: height - 0.16, depth, position: new THREE.Vector3(-width / 2 + 0.08, -0.02, -depth / 2), material: this.darkWoodMaterial }),
      createBox({ width: 0.1, height: height - 0.16, depth, position: new THREE.Vector3(width / 2 - 0.08, -0.02, -depth / 2), material: this.darkWoodMaterial }),
      createBox({ width: width - 0.18, height: height - 0.16, depth: 0.1, position: new THREE.Vector3(0, -0.02, -depth + 0.05), material: this.darkWoodMaterial }),
    );
    const handle = this.createDrawerHandle();
    drawer.add(handle);
    drawer.traverse((child) => {
      child.userData.drawerRoot = drawer;
      child.userData.drawerIndex = 0;
    });
    this.object3D.add(drawer);
    this.drawerManager.registerDrawer({ drawer, index: 0, closedZ, openZ: closedZ + 1.25 });
  }

  createDrawerHandle() {
    const handle = new THREE.Group();
    handle.name = `${this.id}-drawer-handle`;
    const width = 1.25;
    const barZ = 0.43;
    const supportZ = 0.27;
    const thickness = 0.11;
    handle.add(
      createBox({
        width,
        height: thickness,
        depth: thickness,
        position: new THREE.Vector3(0, 0, barZ),
        material: this.metalMaterial,
      }),
      createBox({
        width: thickness,
        height: thickness,
        depth: 0.34,
        position: new THREE.Vector3(-width / 2 + 0.08, 0, supportZ),
        material: this.metalMaterial,
      }),
      createBox({
        width: thickness,
        height: thickness,
        depth: 0.34,
        position: new THREE.Vector3(width / 2 - 0.08, 0, supportZ),
        material: this.metalMaterial,
      }),
    );
    return handle;
  }

  createCabinetDoors() {
    const doorWidth = 2.125;
    const frontZ = 0.86;
    [-1, 1].forEach((side, index) => {
      const hinge = new THREE.Group();
      hinge.position.set(side * 2.14, 0.88, frontZ);
      const leaf = createBox({
        width: doorWidth,
        height: 1.4,
        depth: 0.14,
        position: new THREE.Vector3(-side * doorWidth / 2, 0, 0),
        material: this.woodMaterial,
      });
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), this.metalMaterial);
      knob.position.set(-side * (doorWidth - 0.22), 0, 0.18);
      knob.castShadow = true;
      hinge.add(leaf, knob);
      hinge.traverse((child) => {
        child.userData.cabinetDoorIndex = index;
      });
      this.object3D.add(hinge);
      this.cabinetDoors.push(hinge);
      this.doorStates.push({
        isOpen: false,
        targetRotation: 0,
        openRotation: side < 0 ? -Math.PI / 2 : Math.PI / 2,
      });
    });
  }

  createSink() {
    const basinZ = 0.28;
    const basinMaterial = this.porcelainMaterial.clone();
    basinMaterial.side = THREE.DoubleSide;
    const basin = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      basinMaterial,
    );
    basin.position.set(0, 3.11, basinZ);
    basin.scale.set(1, 0.54, 0.72);
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 20), this.metalMaterial);
    drain.position.set(0, 2.7, basinZ);
    this.faucet = createCurvedFaucet({
      material: this.metalMaterial,
      surfaceY: 2.78,
      baseZ: -0.58,
      reach: 0.88,
      height: 0.58,
    });
    const faucetLift = 0.12;
    this.faucet.position.y = faucetLift;

    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x74c6d8,
      transparent: true,
      opacity: 0.68,
      roughness: 0.12,
      metalness: 0,
      transmission: 0.18,
      depthWrite: false,
    });
    this.waterSurface = new THREE.Mesh(new THREE.CircleGeometry(0.7, 36), waterMaterial);
    this.waterSurface.rotation.x = -Math.PI / 2;
    this.waterSurface.position.set(0, 2.73, basinZ);
    this.waterSurface.scale.set(0.35, 0.35 * 0.72, 1);
    this.waterSurface.visible = false;
    this.waterSurface.renderOrder = 2;
    this.waterSurface.userData.ignoreAging = true;

    const outlet = this.faucet.userData.outletPosition;
    this.waterStream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 0.42, 12),
      waterMaterial.clone(),
    );
    this.waterStream.position.set(outlet.x, outlet.y + faucetLift - 0.21, outlet.z);
    this.waterStream.visible = false;
    this.waterStream.userData.ignoreAging = true;

    [basin, drain].forEach((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    this.object3D.add(basin, drain, this.waterSurface, this.waterStream, this.faucet);
  }

  setWaterRunning(active) {
    this.waterFillTarget = active ? 1 : 0;
    this.waterSurface.visible = active || this.waterFill > 0.01;
    this.waterStream.visible = active;
  }

  createDoorInteractable(index) {
    const door = this.cabinetDoors[index];
    return {
      id: `${this.id}-door-${index}`,
      object3D: door,
      enabled: true,
      interact: () => this.toggleDoor(index),
      getInteractionText: () =>
        this.doorStates[index].isOpen ? tInteraction("close", tItem("door")) : tInteraction("open", tItem("door")),
    };
  }

  toggleDoor(index) {
    const state = this.doorStates[index];
    if (!state) return false;
    state.isOpen = !state.isOpen;
    state.targetRotation = state.isOpen ? state.openRotation : 0;
    this.doorAudio.play(state.isOpen ? "open" : "close", 4.6 / this.doorSpeed);
    return true;
  }

  getInteractables() {
    return [...this.drawerManager.getInteractables(), ...this.cabinetDoors.map((_, index) => this.createDoorInteractable(index))];
  }

  addObjectToDrawer(index, object3D, position = new THREE.Vector3()) {
    return this.drawerManager.addObject(index, object3D, position);
  }

  unlockDrawer(index) {
    return this.drawerManager.unlock(index);
  }

  update(deltaTime) {
    this.drawerManager.update(deltaTime);
    this.waterFill = THREE.MathUtils.damp(this.waterFill, this.waterFillTarget, 1.25, deltaTime);
    if (this.waterSurface) {
      const fill = THREE.MathUtils.smoothstep(this.waterFill, 0, 1);
      this.waterSurface.position.y = THREE.MathUtils.lerp(2.73, 3.055, fill);
      const spread = THREE.MathUtils.lerp(0.35, 1, fill);
      this.waterSurface.scale.set(spread, spread * 0.72, 1);
      this.waterSurface.visible = this.waterFillTarget > 0 || this.waterFill > 0.01;
    }
    this.cabinetDoors.forEach((door, index) => {
      door.rotation.y = THREE.MathUtils.damp(
        door.rotation.y,
        this.doorStates[index].targetRotation,
        this.doorSpeed,
        deltaTime,
      );
    });
  }

  setAudioListener(listener) {
    this.drawerManager.setAudioListener(listener, this.object3D);
    this.doorAudio.setAudioListener(listener, this.object3D);
  }

  dispose() {
    this.drawerManager.dispose();
    this.doorAudio.dispose();
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { BathroomVanity };
