import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class ElectricalPanelPuzzle extends Entity {
  constructor({
    id = "electrical-panel",
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    onFocus = null,
    onSolved = null,
    canSolve = null,
  } = {}) {
    super(id);
    this.onFocus = onFocus;
    this.onSolved = onSolved;
    this.canSolve = canSolve;
    this.isFocused = false;
    this.isOpen = false;
    this.hasFuse = false;
    this.isSolved = false;

    this.correctSwitches = [1, 3, 4, 7];
    this.targetDoorAngle = 0;
    this.switchStates = new Array(8).fill(false);
    this.switchLevers = [];
    this.indicators = [];
    this.object3D = this.createObject();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);
  }

  createObject() {
    const group = new THREE.Group();
    const casingMaterial = new THREE.MeshStandardMaterial({ color: 0x59616a, metalness: 0.7, roughness: 0.35 });
    const insetMaterial = new THREE.MeshStandardMaterial({ color: 0x1d2329, metalness: 0.45, roughness: 0.5 });
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x9da7ae, metalness: 0.8, roughness: 0.25 });

    const depth = 0.85;
    const wallThickness = 0.22;
    const back = new THREE.Mesh(new THREE.BoxGeometry(4.8, 5.8, 0.12), casingMaterial);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 5.8, depth), casingMaterial);
    const rightWall = leftWall.clone();
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(4.36, wallThickness, depth), casingMaterial);
    const bottomWall = topWall.clone();
    const inset = new THREE.Mesh(new THREE.BoxGeometry(4.36, 5.36, 0.045), insetMaterial);

    back.position.z = -depth / 2 + 0.06;
    leftWall.position.set(-2.29, 0, 0);
    rightWall.position.set(2.29, 0, 0);
    topWall.position.set(0, 2.69, 0);
    bottomWall.position.set(0, -2.69, 0);
    inset.position.z = -depth / 2 + 0.14;

    [back, leftWall, rightWall, topWall, bottomWall].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
    });
    group.add(back, leftWall, rightWall, topWall, bottomWall, inset);

    const xPositions = [-1.08, -0.36, 0.36, 1.08];
    const yPositions = [1.1, 0.3];
    let index = 0;
    yPositions.forEach((y) => {
      xPositions.forEach((x) => {
        this.createSwitch(group, x, y, index, railMaterial);
        index += 1;
      });
    });

    this.createFuseSocket(group, railMaterial);
    this.createDoor(group, casingMaterial);
    return group;
  }

  createDoor(group, casingMaterial) {
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-2.18, 0, 0.47);
    const door = new THREE.Mesh(new THREE.BoxGeometry(4.36, 5.36, 0.08), casingMaterial);
    door.position.x = 2.18;
    door.castShadow = true;
    door.receiveShadow = true;
    this.doorPivot.add(door);
    group.add(this.doorPivot);
  }

  createSwitch(group, x, y, index, railMaterial) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.54, 0.12), railMaterial);
    housing.position.set(x, y, -0.12);
    housing.castShadow = true;
    housing.userData.electricalSwitchIndex = index;

    const leverPivot = new THREE.Group();
    leverPivot.position.set(x, y, -0.03);
    leverPivot.userData.electricalSwitchIndex = index;
    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.38, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xc4cbd0, metalness: 0.85, roughness: 0.2 }),
    );
    lever.position.y = -0.08;
    lever.userData.electricalSwitchIndex = index;
    leverPivot.add(lever);

    const indicator = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 16),
      new THREE.MeshStandardMaterial({ color: 0x3c1212, emissive: 0x000000, roughness: 0.35 }),
    );
    indicator.position.set(x + 0.23, y + 0.14, -0.045);
    indicator.userData.electricalSwitchIndex = index;
    group.add(housing, leverPivot, indicator);
    this.switchLevers[index] = leverPivot;
    this.indicators[index] = indicator;
  }

  createFuseSocket(group, railMaterial) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.72, 0.13), railMaterial);
    const socket = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.38, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.75 }),
    );
    frame.position.set(0, -1.35, -0.12);
    socket.position.set(0, -1.35, -0.045);
    frame.castShadow = true;
    this.fuse = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.2, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xc98238, metalness: 0.7, roughness: 0.3 }),
    );
    this.fuse.position.set(0, -1.35, 0.04);
    this.fuse.visible = false;
    group.add(frame, socket, this.fuse);
  }

  toggleSwitch(index) {
    if (this.isSolved || index < 0 || index >= this.switchStates.length) return;
    this.switchStates[index] = !this.switchStates[index];
    this.switchLevers[index].rotation.z = this.switchStates[index] ? -0.62 : 0.62;

    const indicatorMaterial = this.indicators[index].material;
    indicatorMaterial.color.setHex(this.switchStates[index] ? 0x85df74 : 0x3c1212);
    indicatorMaterial.emissive.setHex(this.switchStates[index] ? 0x2f9f2a : 0x000000);
    indicatorMaterial.emissiveIntensity = this.switchStates[index] ? 1.2 : 0;

    const isCorrect = this.switchStates.every((isEnabled, switchIndex) => {
      return isEnabled === this.correctSwitches.includes(switchIndex + 1);
    });

    if (isCorrect && (this.canSolve?.() ?? true)) {
      this.isSolved = true;
      this.exitFocusRequested = true;
      this.onSolved?.(this);
    }
  }

  update(delta) {
    this.doorPivot.rotation.y = THREE.MathUtils.damp(this.doorPivot.rotation.y, this.targetDoorAngle, 7, delta);
  }

  openPanel() {
    this.isOpen = true;
    this.targetDoorAngle = -Math.PI / 2;
  }

  closePanel() {
    this.isOpen = false;
    this.targetDoorAngle = 0;
  }

  insertFuse(player) {
    if (this.hasFuse || !player?.hasSelected("fuse")) {
      return false;
    }

    player.removeItemFromInventory("fuse");
    this.hasFuse = true;
    this.fuse.visible = true;
    return true;
  }

  setFocused(focused) {
    this.isFocused = focused;
  }

  interact(player) {
    if (!this.isOpen) {
      this.openPanel();
      return;
    }

    if (!this.hasFuse) {
      if (this.insertFuse(player)) {
        return;
      }

      this.closePanel();
      return;
    }

    this.onFocus?.(this);
  }

  getInteractionText(player) {
    if (!this.isOpen) {
      return tInteraction("open", tItem(this.id));
    }

    if (!this.hasFuse) {
      return player?.hasSelected("fuse")
        ? tInteraction("insert", tItem("fuse"))
        : tInteraction("missingFuse");
    }

    return tInteraction("examine", tItem(this.id));
  }

  getFocusPosition() {
    this.object3D.updateMatrixWorld(true);
    return this.object3D.localToWorld(new THREE.Vector3(0, 0, 4.3));
  }

  getLookAtPosition() {
    this.object3D.updateMatrixWorld(true);
    return this.object3D.localToWorld(new THREE.Vector3(0, -0.1, 0));
  }
}

export { ElectricalPanelPuzzle };
