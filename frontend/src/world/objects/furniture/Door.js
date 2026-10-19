import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tItem, tInteraction } from "../../../translations/index.js";
import createBox from "../helpers/createBox.js";
import { createWoodMaterials } from "../helpers/createWoodMaterials.js";
import { MechanicalAudio } from "../helpers/MechanicalAudio.js";

class Door extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    thickness = 0.3,
    requiredKey = null,
    locked = false,
    onOpenChange,
    onUnlock,
    woodColor = 0x8a6a52,
    handleColor = 0xb58a45,
    woodTexture = "textures/furniture/wood2.jpg",
    woodTextureRepeat = {
      x: 1,
      y: 1,
    },
  }) {
    super(id);

    this.doorAudio = new MechanicalAudio({ kind: "roomDoor", volume: 0.48 });

    this.thickness = thickness;
    this.requiredKey = requiredKey;
    this.onOpenChange = onOpenChange;
    this.onUnlock = onUnlock;

    this.isOpen = false;
    this.isLocked = locked || requiredKey !== null;

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    this.closedRotation = rotationY;
    this.openRotation = rotationY - Math.PI / 2;
    this.targetRotation = this.closedRotation;

    this.openSpeed = 4;
    this.closeSpeed = 7;
    this.collider = new THREE.Box3();

    this.createMaterials({
      woodColor,
      handleColor,
      woodTexture,
      woodTextureRepeat,
    });
    this.createDoor();
  }

  createMaterials({ woodColor, handleColor, woodTexture, woodTextureRepeat }) {
    const materials = createWoodMaterials({
      woodColor,
      handleColor,
      woodTexture,
      woodTextureRepeat,
    });

    this.woodMaterial = materials.wood;
    this.darkWoodMaterial = materials.darkWood;
    this.handleMaterial = materials.handle;
    this.hingeMaterial = new THREE.MeshStandardMaterial({
      color: 0x302d29,
      roughness: 0.38,
      metalness: 0.8,
    });
  }

  createDoor() {
    this.doorMesh = new THREE.Group();
    this.doorMesh.position.x = 2.5;

    const doorLeaf = createBox({
      width: 5,
      height: 8,
      depth: this.thickness,
      position: new THREE.Vector3(0, 0, 0),
      material: this.woodMaterial,
    });

    this.doorMesh.add(doorLeaf);
    this.createHandles();
    this.object3D.add(this.doorMesh);
  }

  createHandles() {
    const handleX = 1.65;
    const handleY = 0;
    const surfaceZ = this.thickness / 2;

    const frontHandle = this.createHandle({
      direction: 1,
    });
    frontHandle.position.set(handleX, handleY, surfaceZ);

    const rearHandle = this.createHandle({
      direction: -1,
    });
    rearHandle.position.set(handleX, handleY, -surfaceZ);

    const spindleGeometry = new THREE.CylinderGeometry(0.08, 0.08, this.thickness + 0.15, 16);
    const spindle = new THREE.Mesh(spindleGeometry, this.hingeMaterial);
    spindle.rotation.x = Math.PI / 2;
    spindle.position.set(handleX, handleY, 0);
    spindle.castShadow = true;

    this.doorMesh.add(frontHandle, rearHandle, spindle);
  }

  createHandle({ direction }) {
    const handle = new THREE.Group();
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 20);
    const base = new THREE.Mesh(baseGeometry, this.handleMaterial);

    base.rotation.x = Math.PI / 2;
    base.position.z = 0.05 * direction;
    base.castShadow = true;
    base.receiveShadow = true;

    const neckGeometry = new THREE.CylinderGeometry(0.11, 0.11, 0.18, 20);
    const neck = new THREE.Mesh(neckGeometry, this.handleMaterial);
    neck.rotation.x = Math.PI / 2;
    neck.position.z = 0.15 * direction;
    neck.castShadow = true;

    const knobGeometry = new THREE.SphereGeometry(0.27, 24, 24);
    const knob = new THREE.Mesh(knobGeometry, this.handleMaterial);
    knob.scale.set(1, 1, 0.82);
    knob.position.z = 0.3 * direction;
    knob.castShadow = true;
    knob.receiveShadow = true;

    handle.add(base, neck, knob);

    return handle;
  }

  interact(player) {
    if (this.isOpen) {
      this.close();
      return;
    }

    if (this.isLocked) {
      if (!this.requiredKey) {
        void this.playSound("locked");
        return;
      }

      if (!player.hasSelected(this.requiredKey)) {
        void this.playSound("locked");
        return;
      }

      player.removeItemFromInventory(this.requiredKey);
      this.unlock();
    }

    this.open();
  }

  getInteractionText() {
    if (this.isOpen) {
      return tInteraction("close", tItem("door"));
    }
    if (this.isLocked) {
      if (!this.requiredKey) {
        return tInteraction("locked");
      }

      return tInteraction("needItem", tItem(this.requiredKey));
    }
    return tInteraction("open", tItem("door"));
  }

  unlock({ notify = true } = {}) {
    this.isLocked = false;
    if (notify) this.onUnlock?.();
  }

  setAudioListener(listener) {
    this.doorAudio.setAudioListener(listener, this.doorMesh);
  }

  playSound(type, duration = 0.35) {
    this.doorAudio.play(type, duration);
  }

  dispose() {
    this.doorAudio.dispose();
  }

  open() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.targetRotation = this.openRotation;
    void this.playSound("open", 4.6 / this.openSpeed);

    if (typeof this.onOpenChange === "function") {
      this.onOpenChange(true);
    }
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.targetRotation = this.closedRotation;
    void this.playSound("close", 4.6 / this.closeSpeed);

    if (typeof this.onOpenChange === "function") {
      this.onOpenChange(false);
    }
  }

  update(delta) {
    const speed = this.isOpen ? this.openSpeed : this.closeSpeed;
    this.object3D.rotation.y = THREE.MathUtils.damp(this.object3D.rotation.y, this.targetRotation, speed, delta);
    if (Math.abs(this.object3D.rotation.y - this.targetRotation) < 0.001) {
      this.object3D.rotation.y = this.targetRotation;
    }
  }

  getCollider() {
    this.object3D.updateWorldMatrix(true, true);
    return this.collider.setFromObject(this.doorMesh);
  }
}

export { Door };
