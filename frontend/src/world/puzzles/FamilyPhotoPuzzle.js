import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class FamilyPhotoPuzzle extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    imagePath = "/images/puzzles/family-photo-1998.png",
    onFocus = null,
    onSolved = null,
  } = {}) {
    super(id);

    this.onFocus = onFocus;
    this.onSolved = onSolved;
    this.isFocused = false;
    this.isSolved = false;
    this.columns = 5;
    this.rows = 4;
    this.fragmentOrder = this.createShuffledOrder();
    this.fragments = [];
    this.slotPositions = [];
    this.selectedSlot = null;
    this.photoTexture = new THREE.TextureLoader().load(imagePath);
    this.photoTexture.colorSpace = THREE.SRGBColorSpace;
    this.photoTexture.wrapS = THREE.RepeatWrapping;
    this.photoTexture.wrapT = THREE.RepeatWrapping;

    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.createPhoto();
  }

  createPhoto() {
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.8 });
    const backing = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, 0.12), frameMaterial);
    backing.castShadow = true;
    backing.receiveShadow = true;

    this.object3D.add(backing);

    const fragmentWidth = 0.9;
    const fragmentHeight = 0.72;

    for (let slot = 0; slot < this.fragmentOrder.length; slot++) {
      const column = slot % this.columns;
      const row = Math.floor(slot / this.columns);
      const fragment = this.createFragment(this.fragmentOrder[slot], fragmentWidth, fragmentHeight);
      const position = new THREE.Vector3(
        (column - (this.columns - 1) / 2) * fragmentWidth,
        ((this.rows - 1) / 2 - row) * fragmentHeight,
        0.08,
      );
      fragment.position.copy(position);
      fragment.userData.photoFragmentSlot = slot;
      this.fragments.push(fragment);
      this.slotPositions.push(position);
      this.object3D.add(fragment);
    }
  }

  createShuffledOrder() {
    const order = Array.from({ length: this.columns * this.rows }, (_, index) => index);

    for (let index = order.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    if (order.every((piece, index) => piece === index)) {
      [order[0], order[1]] = [order[1], order[0]];
    }

    return order;
  }

  createFragment(index, width, height) {
    const column = index % this.columns;
    const row = Math.floor(index / this.columns);
    const texture = this.photoTexture.clone();
    texture.repeat.set(1 / this.columns, 1 / this.rows);
    texture.offset.set(column / this.columns, 1 - (row + 1) / this.rows);
    texture.needsUpdate = true;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0,
    });
    const fragment = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    return fragment;
  }

  setFocused(focused) {
    this.isFocused = focused;

    if (!focused) {
      this.clearSelection();
    }
  }

  interact() {
    if (!this.isSolved) {
      this.onFocus?.(this);
    }
  }

  selectFragment(slot) {
    if (!this.isFocused || this.isSolved || !this.fragments[slot]) {
      return;
    }

    if (this.selectedSlot === null) {
      this.selectedSlot = slot;
      this.setFragmentSelected(slot, true);
      return;
    }

    if (this.selectedSlot === slot) {
      this.clearSelection();
      return;
    }

    const firstSlot = this.selectedSlot;
    this.clearSelection();
    this.swapFragments(firstSlot, slot);

    if (this.fragmentOrder.every((piece, index) => piece === index)) {
      this.isSolved = true;
      this.onSolved?.(this);
    }
  }

  swapFragments(firstSlot, secondSlot) {
    const firstFragment = this.fragments[firstSlot];
    const secondFragment = this.fragments[secondSlot];

    firstFragment.position.copy(this.slotPositions[secondSlot]);
    secondFragment.position.copy(this.slotPositions[firstSlot]);
    firstFragment.userData.photoFragmentSlot = secondSlot;
    secondFragment.userData.photoFragmentSlot = firstSlot;
    [this.fragments[firstSlot], this.fragments[secondSlot]] = [secondFragment, firstFragment];
    [this.fragmentOrder[firstSlot], this.fragmentOrder[secondSlot]] = [
      this.fragmentOrder[secondSlot],
      this.fragmentOrder[firstSlot],
    ];
  }

  setFragmentSelected(slot, selected) {
    const fragment = this.fragments[slot];

    if (!fragment) {
      return;
    }

    fragment.position.copy(this.slotPositions[slot]);
    fragment.position.z += selected ? 0.18 : 0;
  }

  clearSelection() {
    if (this.selectedSlot !== null) {
      this.setFragmentSelected(this.selectedSlot, false);
      this.selectedSlot = null;
    }
  }

  getInteractionText() {
    return this.isSolved ? null : tInteraction("examine", tItem("family-photo"));
  }

  getFocusPosition() {
    const position = new THREE.Vector3();
    this.object3D.getWorldPosition(position);
    const offset = new THREE.Vector3(0, 0, 3);
    offset.applyQuaternion(this.object3D.getWorldQuaternion(new THREE.Quaternion()));

    return position.add(offset);
  }

  getLookAtPosition() {
    const position = new THREE.Vector3();
    this.object3D.getWorldPosition(position);

    return position;
  }
}

export { FamilyPhotoPuzzle };
