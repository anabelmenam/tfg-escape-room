import * as THREE from "three";
import { Entity, createRadioDialVisual } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class RadioPuzzle extends Entity {
  constructor({
    id = "radio-puzzle",
    position = new THREE.Vector3(),
    scale = 1,
    rotationY = 0,
    onFocus = null,
    key = null,
    finalKey = null,
    dialItem = null,
    onDialInserted = null,
    missingDialIndex = 2,
    solution = [7, 2, 5, 4],
    canSolve = null,
    onSolved = null,
  } = {}) {
    super(id);
    this.onFocus = onFocus;
    this.key = key;
    this.finalKey = finalKey;
    this.dialItem = dialItem;
    this.onDialInserted = onDialInserted;
    this.missingDialIndex = missingDialIndex;
    this.hasMissingDial = dialItem === null;
    this.values = [0, 0, 0, 0];
    this.solution = solution;
    this.canSolve = canSolve;
    this.onSolved = onSolved;
    this.isSolved = false;
    this.drawerProgress = 0;
    this.dialNeedles = [];

    this.object3D = this.createObject();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.set(scale, scale, scale);
  }

  createObject() {
    const group = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x4c2513, roughness: 0.5 });
    const woodTrim = new THREE.MeshStandardMaterial({ color: 0x241007, roughness: 0.58 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xa96e25, metalness: 0.78, roughness: 0.25 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x6d5540, roughness: 0.95 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffd9a0,
      transparent: true,
      opacity: 0.42,
      roughness: 0.12,
      metalness: 0,
    });
    const filament = new THREE.MeshStandardMaterial({ color: 0xff9d38, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.9, 1.28, 5, 3, 2), wood);
    body.position.y = 0.08;
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(3.82, 0.16, 1.16), woodTrim);
    topCap.position.set(0, 1.06, 0);
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.88, 0.2, 1.2), woodTrim);
    base.position.set(0, -0.96, 0.02);
    group.add(body, topCap, base);

    const speakerFrame = new THREE.Mesh(new THREE.BoxGeometry(1.58, 1.22, 0.08), woodTrim);
    speakerFrame.position.set(-1.12, 0.13, 0.68);
    const speaker = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 1.02), cloth);
    speaker.position.set(-1.12, 0.13, 0.731);
    group.add(speakerFrame, speaker);
    for (let line = -0.58; line <= 0.58; line += 0.145) {
      const thread = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.98, 0.018), woodTrim);
      thread.position.set(-1.12 + line, 0.13, 0.75);
      group.add(thread);
    }

    const valveWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 0.76), glass);
    valveWindow.position.set(0.95, 0.43, 0.752);
    const framePieces = [
      [1.92, 0.07, 0.95, 0.845],
      [1.92, 0.07, 0.95, 0.015],
      [0.07, 0.93, 0.025, 0.43],
      [0.07, 0.93, 1.875, 0.43],
    ].map(([width, height, x, y]) => {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.055), brass);
      piece.position.set(x, y, 0.75);
      return piece;
    });
    group.add(valveWindow, ...framePieces);

    [-0.38, 0.38].forEach((offset) => {
      const valve = new THREE.Group();
      const valveBase = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.11, 20), brass);
      valveBase.rotation.x = Math.PI / 2;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.47, 20), glass);
      tube.rotation.x = Math.PI / 2;
      tube.position.z = 0.22;
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.37, 10), filament);
      glow.rotation.x = Math.PI / 2;
      glow.position.z = 0.25;
      valve.add(valveBase, tube, glow);
      valve.position.set(0.95 + offset, 0.43, 0.76);
      group.add(valve);
    });

    for (let index = 0; index < 4; index += 1) {
      const x = -0.2 + index * 0.62;
      if (index === this.missingDialIndex && !this.hasMissingDial) {
        this.createMissingDialSlot(group, x, brass, woodTrim);
        continue;
      }
      group.add(this.createDial(index, x, brass, woodTrim));
    }

    this.drawer = new THREE.Group();
    this.drawer.position.set(0.55, -0.72, 0.66);

    const drawerFace = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.42, 0.14), woodTrim);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), brass);
    handle.position.set(0, 0, 0.1);
    handle.rotation.z = Math.PI;
    const drawerBottom = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.72), wood);
    drawerBottom.position.set(0, -0.19, -0.36);
    const drawerBack = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.36, 0.08), wood);
    drawerBack.position.set(0, 0, -0.71);
    const drawerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.72), wood);
    drawerLeft.position.set(-1.04, 0, -0.36);
    const drawerRight = drawerLeft.clone();
    drawerRight.position.x = 1.04;
    const drawerParts = [drawerFace, handle, drawerBottom, drawerBack, drawerLeft, drawerRight];
    this.drawer.add(...drawerParts);

    if (this.key) {
      this.key.object3D.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      this.key.object3D.position.set(-0.35, -0.13, -0.45);
      this.key.object3D.scale.setScalar(1.5);
      this.drawer.add(this.key.object3D);
    }
    if (this.finalKey) {
      this.finalKey.object3D.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
      this.finalKey.object3D.position.set(0.42, -0.13, -0.45);
      this.finalKey.object3D.scale.setScalar(0.28);
      this.finalKey.object3D.visible = false;
      this.finalKey.setEnabled(false);
      this.drawer.add(this.finalKey.object3D);
    }
    group.add(this.drawer);

    [body, topCap, base, speakerFrame, ...drawerParts, ...framePieces].forEach((piece) => {
      piece.castShadow = true;
      piece.receiveShadow = true;
    });
    return group;
  }

  createDial(index, x, brass, darkMaterial) {
    const visual = createRadioDialVisual({ index, brass, darkMaterial });
    visual.object3D.position.set(x, -0.36, 0.77);
    this.dialNeedles[index] = visual.needlePivot;
    this.updateDialIndicator(index);
    return visual.object3D;
  }

  createMissingDialSlot(group, x, brass, woodTrim) {
    this.dialSlot = new THREE.Group();
    this.dialSlot.position.set(x, -0.36, 0.77);
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.035, 20), woodTrim);
    socket.rotation.x = Math.PI / 2;
    socket.position.z = -0.025;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 20), brass);
    rim.position.z = 0.02;
    this.dialSlot.add(socket, rim);
    group.add(this.dialSlot);
  }

  installMissingDial(player) {
    if (this.hasMissingDial || !this.dialItem || !player.hasSelected(this.dialItem.id)) return false;
    const dial = player.inventory.remove(this.dialItem.id);
    if (!dial) return false;
    this.hasMissingDial = true;
    dial.object3D.visible = true;
    dial.object3D.position.set(0, 0, 0.04);
    dial.object3D.rotation.set(0, 0, 0);
    dial.object3D.scale.setScalar(1);
    dial.setEnabled(false);
    dial.setDialIndex(this.missingDialIndex);
    this.dialNeedles[this.missingDialIndex] = dial.needlePivot;
    this.updateDialIndicator(this.missingDialIndex);
    this.dialSlot.add(dial.object3D);
    this.onDialInserted?.();
    return true;
  }

  restoreDialState() {
    if (this.hasMissingDial || !this.dialItem) return;
    this.hasMissingDial = true;
    this.dialItem.object3D.visible = true;
    this.dialItem.object3D.position.set(0, 0, 0.04);
    this.dialItem.object3D.rotation.set(0, 0, 0);
    this.dialItem.object3D.scale.setScalar(1);
    this.dialItem.setEnabled(false);
    this.dialItem.setDialIndex(this.missingDialIndex);
    this.dialNeedles[this.missingDialIndex] = this.dialItem.needlePivot;
    this.updateDialIndicator(this.missingDialIndex);
    this.dialSlot.add(this.dialItem.object3D);
  }

  restoreSolvedState() {
    this.restoreDialState();
    this.values = [...this.solution];
    this.values.forEach((_, index) => this.updateDialIndicator(index));
    this.isSolved = true;
    this.drawerProgress = 1;
    this.drawer.position.z = 1.45;
  }

  updateDialIndicator(index) {
    this.dialNeedles[index].rotation.z = -(this.values[index] * Math.PI * 2) / 10;
  }

  incrementDial(index) {
    if (!this.hasMissingDial || this.isSolved || index < 0 || index >= this.values.length) return;
    this.values[index] = this.values[index] === 9 ? 0 : this.values[index] + 1;
    this.updateDialIndicator(index);

    if (this.values.every((value, valueIndex) => value === this.solution[valueIndex]) && (this.canSolve?.() ?? true)) {
      this.isSolved = true;
      this.exitFocusRequested = true;
      this.onSolved?.(this);
    }
  }

  update(delta) {
    if (!this.isSolved) return;
    this.drawerProgress = THREE.MathUtils.damp(this.drawerProgress, 1, 6, delta);
    this.drawer.position.z = THREE.MathUtils.lerp(0.66, 1.45, this.drawerProgress);
  }

  interact(player) {
    if (!this.hasMissingDial) {
      this.installMissingDial(player);
      return;
    }
    if (!this.isSolved) this.onFocus?.(this);
  }

  getInteractionText(player) {
    if (!this.hasMissingDial) {
      return player?.hasSelected(this.dialItem?.id)
        ? tInteraction("insert", tItem(this.dialItem.id))
        : tInteraction("needItem", tItem(this.dialItem?.id));
    }
    return this.isSolved ? null : tInteraction("examine", tItem("radio"));
  }

  getFocusPosition() {
    this.object3D.updateMatrixWorld(true);
    return this.object3D.localToWorld(new THREE.Vector3(0, 1.4, 4.2));
  }

  getLookAtPosition() {
    this.object3D.updateMatrixWorld(true);
    return this.object3D.localToWorld(new THREE.Vector3(0, 0, 0));
  }
}

export { RadioPuzzle };
