import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class SewingBoxPuzzle extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    onFocus = null,
    onSolved = null,
    planPaper,
    requiredKey = null,
    canSolve = null,
  } = {}) {
    super(id);
    if (!planPaper) throw new Error("SewingBoxPuzzle necesita un plano eléctrico.");

    this.onFocus = onFocus;
    this.onSolved = onSolved;
    this.planPaper = planPaper;
    this.requiredKey = requiredKey;
    this.canSolve = canSolve;
    this.isLocked = requiredKey !== null;
    this.isOpen = false;
    this.targetOpen = false;
    this.isFocused = false;
    this.isSolved = false;
    this.selectedSlot = null;
    this.revealProgress = 0;
    this.correctOrder = ["red", "blue", "green", "yellow"];
    this.spoolOrder = ["green", "red", "yellow", "blue"];
    this.spools = [];
    this.slotPositions = [];

    this.object3D = new THREE.Group();
    this.object3D.name = id ?? "sewing-box";
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.createBox();
    this.createFalseBottom();
    this.createSpools();
    this.preparePlanPaper();
    this.threadTray.visible = false;
  }

  createBox() {
    this.wood = new THREE.MeshStandardMaterial({ color: 0x70462a, roughness: 0.78 });
    this.innerWood = new THREE.MeshStandardMaterial({ color: 0x4b2b19, roughness: 0.9 });
    const add = (geometry, position, material = this.wood) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.object3D.add(mesh);
    };

    add(new THREE.BoxGeometry(3.5, 0.14, 1.55), new THREE.Vector3(0, 0.07, 0));
    add(new THREE.BoxGeometry(3.5, 0.62, 0.12), new THREE.Vector3(0, 0.37, 0.715));
    add(new THREE.BoxGeometry(3.5, 0.62, 0.12), new THREE.Vector3(0, 0.37, -0.715));
    add(new THREE.BoxGeometry(0.12, 0.62, 1.32), new THREE.Vector3(-1.69, 0.37, 0));
    add(new THREE.BoxGeometry(0.12, 0.62, 1.32), new THREE.Vector3(1.69, 0.37, 0));

    this.lidPivot = new THREE.Group();
    this.lidPivot.position.set(0, 0.68, -0.78);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 1.55), this.wood);
    lid.position.set(0, 0.075, 0.775);
    const lining = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 0.025, 1.12),
      new THREE.MeshStandardMaterial({ color: 0x8b3f3c, roughness: 0.85 }),
    );
    lining.position.set(0, 0.16, 0.77);
    lid.castShadow = true;
    lining.castShadow = true;
    this.lidPivot.add(lid, lining);
    this.object3D.add(this.lidPivot);
  }

  createFalseBottom() {
    this.threadTray = new THREE.Group();
    this.threadTray.position.set(0, 0.27, 0);
    const trayBottom = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.1, 1.2), this.innerWood);
    const trayFront = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.18, 0.08), this.wood);
    const trayBack = trayFront.clone();
    trayFront.position.set(0, 0.12, 0.56);
    trayBack.position.set(0, 0.12, -0.56);
    this.threadTray.add(trayBottom, trayFront, trayBack);
    this.threadTray.traverse((piece) => {
      if (piece.isMesh) {
        piece.castShadow = true;
        piece.receiveShadow = true;
      }
    });
    this.object3D.add(this.threadTray);
  }

  createSpools() {
    const colors = { red: 0xb8443f, blue: 0x3f6f9f, green: 0x4f865c, yellow: 0xc39a41 };
    const slots = [-1.18, -0.39, 0.39, 1.18];
    this.spoolOrder.forEach((colorName, slot) => {
      const spool = new THREE.Group();
      const threadMaterial = new THREE.MeshStandardMaterial({ color: colors[colorName], roughness: 0.7 });
      const capMaterial = new THREE.MeshStandardMaterial({ color: 0xd0ae79, roughness: 0.72 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 16), threadMaterial);
      const capA = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16), capMaterial);
      const capB = capA.clone();
      capA.position.y = 0.24;
      capB.position.y = -0.24;
      spool.add(body, capA, capB);
      spool.rotation.z = Math.PI / 2;
      spool.position.set(slots[slot], 0.3, 0);
      spool.traverse((piece) => {
        piece.userData.sewingSpoolSlot = slot;
        if (piece.isMesh) piece.castShadow = true;
      });
      this.spools.push(spool);
      this.slotPositions.push(spool.position.clone());
      this.threadTray.add(spool);
    });
  }

  preparePlanPaper() {
    const plan = this.planPaper.object3D;
    plan.position.set(0, 0.16, -0.02);
    plan.rotation.x = -Math.PI / 2;
    plan.visible = false;
    this.object3D.add(plan);
  }

  interact(player) {
    if (this.isLocked) {
      if (!player?.hasSelected(this.requiredKey)) return;
      player.removeItemFromInventory(this.requiredKey);
      this.isLocked = false;
    }
    if (!this.isOpen) {
      this.targetOpen = true;
      this.threadTray.visible = true;
      return;
    }
    this.onFocus?.(this);
  }

  update(delta) {
    const lidTarget = this.targetOpen ? -Math.PI * 0.62 : 0;
    this.lidPivot.rotation.x = THREE.MathUtils.damp(this.lidPivot.rotation.x, lidTarget, 7, delta);
    this.isOpen = Math.abs(this.lidPivot.rotation.x - lidTarget) < 0.001 && this.targetOpen;

    if (this.isSolved) {
      this.revealProgress = THREE.MathUtils.damp(this.revealProgress, 1, 4, delta);

      this.threadTray.position.y = THREE.MathUtils.lerp(0.27, 0.12, this.revealProgress);
      this.threadTray.position.x = THREE.MathUtils.lerp(0, 3.45, this.revealProgress);

      this.planPaper.object3D.position.y = 0.16;
      this.planPaper.object3D.scale.setScalar(0.75);
      this.planPaper.object3D.rotation.x = -Math.PI / 2;
    }
  }

  setFocused(focused) {
    this.isFocused = focused;
    if (!focused) this.clearSelection();
  }

  selectSpool(slot) {
    if (!this.isFocused || this.isSolved || !this.spools[slot]) return;
    if (!(this.canSolve?.() ?? true)) return;
    if (this.selectedSlot === null) {
      this.selectedSlot = slot;
      this.setSpoolSelected(slot, true);
      return;
    }
    if (this.selectedSlot === slot) {
      this.clearSelection();
      return;
    }
    const firstSlot = this.selectedSlot;
    this.clearSelection();
    this.swapSpools(firstSlot, slot);
    if (this.spoolOrder.every((color, index) => color === this.correctOrder[index]) && (this.canSolve?.() ?? true)) {
      this.isSolved = true;
      this.planPaper.object3D.visible = true;
      this.planPaper.setEnabled(true);

      this.exitFocusRequested = true;
      this.onSolved?.(this);
    }
  }

  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.isSolved = true;
    this.isLocked = false;
    this.targetOpen = true;
    this.isOpen = true;
    this.lidPivot.rotation.x = -Math.PI * 0.62;
    this.threadTray.visible = true;
    this.planPaper.object3D.visible = true;
    this.planPaper.setEnabled(true);
    this.revealProgress = 1;
    this.threadTray.position.set(3.45, 0.12, this.threadTray.position.z);
    if (notify) this.onSolved?.(this);
  }

  swapSpools(firstSlot, secondSlot) {
    const first = this.spools[firstSlot];
    const second = this.spools[secondSlot];
    first.position.copy(this.slotPositions[secondSlot]);
    second.position.copy(this.slotPositions[firstSlot]);
    first.traverse((piece) => {
      piece.userData.sewingSpoolSlot = secondSlot;
    });
    second.traverse((piece) => {
      piece.userData.sewingSpoolSlot = firstSlot;
    });
    [this.spools[firstSlot], this.spools[secondSlot]] = [second, first];
    [this.spoolOrder[firstSlot], this.spoolOrder[secondSlot]] = [
      this.spoolOrder[secondSlot],
      this.spoolOrder[firstSlot],
    ];
  }

  setSpoolSelected(slot, selected) {
    const spool = this.spools[slot];
    spool.position.copy(this.slotPositions[slot]);
    spool.position.y += selected ? 0.16 : 0;
  }

  clearSelection() {
    if (this.selectedSlot !== null) {
      this.setSpoolSelected(this.selectedSlot, false);
      this.selectedSlot = null;
    }
  }

  getInteractionText() {
    if (this.isLocked) return tInteraction("needItem", tItem(this.requiredKey));
    if (!this.isOpen) return tInteraction("open", tItem("sewing-box"));
    if (this.isSolved) return null;
    return tInteraction("examine", tItem("sewing-box"));
  }

  getFocusPosition() {
    const position = new THREE.Vector3();
    this.object3D.getWorldPosition(position);

    const offset = new THREE.Vector3(0, 2.75, 0.42);
    offset.applyQuaternion(this.object3D.getWorldQuaternion(new THREE.Quaternion()));
    return position.add(offset);
  }

  getLookAtPosition() {
    const position = new THREE.Vector3();
    this.object3D.getWorldPosition(position);
    return position.add(new THREE.Vector3(0, 0.3, 0));
  }
}

export { SewingBoxPuzzle };
