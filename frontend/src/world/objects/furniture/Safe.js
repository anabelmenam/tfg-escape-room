import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Safe extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,

    password = ["△", "○", "□", "✕"],
    symbols = ["□", "△", "✕", "☆", "○", "◇"],

    width = 4,
    height = 4.5,
    depth = 3.5,

    bodyColor = 0x30343a,
    doorColor = 0x25282d,
    metalColor = 0x777777,
    interiorColor = 0x171a1e,

    onFocus = null,
    onUnlock = null,
    canUnlock = null,
  } = {}) {
    super(id);

    if (!Array.isArray(password) || password.length === 0) {
      throw new Error(`Safe "${id}": password debe contener al menos un valor.`);
    }

    if (!Array.isArray(symbols) || symbols.length < 2) {
      throw new Error(`Safe "${id}": symbols debe contener al menos dos valores.`);
    }

    for (const value of password) {
      if (!symbols.includes(value)) {
        throw new Error(`Safe "${id}": el valor "${value}" del password no existe en symbols.`);
      }
    }

    this.password = password.map(String);
    this.symbols = symbols.map(String);

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.bodyColor = bodyColor;
    this.doorColor = doorColor;
    this.metalColor = metalColor;
    this.interiorColor = interiorColor;
    this.wallThickness = Math.min(width, height, depth) * 0.08;

    this.onFocus = onFocus;
    this.onUnlock = onUnlock;
    this.canUnlock = canUnlock;

    this.values = new Array(this.password.length).fill(0);
    this.displayMeshes = [];
    this.contents = new Map();

    this.isLocked = true;
    this.isOpen = false;
    this.isFocused = false;
    this.openAngle = -Math.PI / 2;
    this.doorSpeed = 6;
    this.targetDoorRotation = 0;

    this.object3D = this.createObject();

    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }
  }

  createObject() {
    const safe = new THREE.Group();
    safe.name = this.id;

    this.createBody(safe);
    this.createDoor(safe);
    this.createLockPanel();
    this.createHandle();
    this.createContentContainer(safe);

    return safe;
  }

  createBody(safe) {
    const exteriorMaterial = new THREE.MeshStandardMaterial({
      color: this.bodyColor,
      roughness: 0.45,
      metalness: 0.65,
    });

    const interiorMaterial = new THREE.MeshStandardMaterial({
      color: this.interiorColor,
      roughness: 0.6,
      metalness: 0.5,
    });
    const thickness = this.wallThickness;
    const innerWidth = this.width - thickness * 2;
    const innerHeight = this.height - thickness * 2;

    const createWall = (width, height, depth, position, material = exteriorMaterial) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      wall.position.copy(position);
      wall.castShadow = true;
      wall.receiveShadow = true;

      return wall;
    };

    const bottom = createWall(this.width, thickness, this.depth, new THREE.Vector3(0, thickness / 2, 0));
    const top = createWall(this.width, thickness, this.depth, new THREE.Vector3(0, this.height - thickness / 2, 0));
    const left = createWall(thickness, innerHeight, this.depth, new THREE.Vector3(-this.width / 2 + thickness / 2, this.height / 2, 0));
    const right = createWall(thickness, innerHeight, this.depth, new THREE.Vector3(this.width / 2 - thickness / 2, this.height / 2, 0));
    const back = createWall(innerWidth, innerHeight, thickness, new THREE.Vector3(0, this.height / 2, -this.depth / 2 + thickness / 2));

    const interiorBottom = createWall(
      innerWidth,
      0.01,
      this.depth - thickness * 2,
      new THREE.Vector3(0, thickness + 0.005, 0),
      interiorMaterial,
    );
    const interiorBack = createWall(
      innerWidth,
      innerHeight,
      0.01,
      new THREE.Vector3(0, this.height / 2, -this.depth / 2 + thickness + 0.005),
      interiorMaterial,
    );

    safe.add(bottom, top, left, right, back, interiorBottom, interiorBack);
  }

  createContentContainer(safe) {
    this.contentContainer = new THREE.Group();
    this.contentContainer.name = `${this.id}-content-container`;
    this.contentContainer.position.y = this.wallThickness + 0.02;

    safe.add(this.contentContainer);
  }

  createDoor(safe) {
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-this.width / 2, this.height / 2, this.depth / 2 + 0.06);

    const material = new THREE.MeshStandardMaterial({
      color: this.doorColor,
      roughness: 0.35,
      metalness: 0.75,
    });

    this.door = new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.92, this.height * 0.9, 0.18), material);

    this.door.position.x = (this.width * 0.92) / 2;

    this.door.castShadow = true;
    this.door.receiveShadow = true;

    this.doorPivot.add(this.door);
    safe.add(this.doorPivot);
  }

  createLockPanel() {
    this.lockPanel = new THREE.Group();

    this.lockPanel.position.set(0, -1, 0.13);
    this.lockPanel.scale.setScalar(0.7);

    this.door.add(this.lockPanel);

    const panelWidth = Math.min(this.width * 0.7, this.password.length * 0.72 + 0.35);

    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.65,
    });

    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, 1.15, 0.12), panelMaterial);

    this.lockPanel.add(panel);

    const spacing = panelWidth / this.password.length;

    for (let i = 0; i < this.password.length; i++) {
      const x = -panelWidth / 2 + spacing / 2 + i * spacing;

      this.createSymbolDisplay(i, x, spacing);
    }
  }

  createSymbolDisplay(index, x, spacing) {
    const displayWidth = Math.min(spacing * 0.72, 0.55);

    const displayMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5e1d8,
      roughness: 0.5,
      metalness: 0.05,
    });

    const display = new THREE.Mesh(new THREE.BoxGeometry(displayWidth, 0.7, 0.08), displayMaterial);

    display.position.set(x, 0, 0.1);

    display.userData.safeDigitIndex = index;

    this.lockPanel.add(display);

    const symbol = this.createSymbolMesh(this.symbols[this.values[index]], displayWidth);

    symbol.position.set(x, 0, 0.15);
    symbol.userData.safeDigitIndex = index;

    this.lockPanel.add(symbol);

    this.displayMeshes.push(symbol);
  }

  createSymbolMesh(value, width) {
    const canvas = document.createElement("canvas");

    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#111111";

    const baseFontSize = 150;
    context.font = `bold ${baseFontSize}px Arial`;

    const metrics = context.measureText(String(value));
    const glyphWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const glyphHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const targetSize = canvas.width * 0.68;
    const scale = Math.min(targetSize / glyphWidth, targetSize / glyphHeight);

    context.font = `bold ${baseFontSize * scale}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(String(value), canvas.width / 2, canvas.height / 2 + 5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.65,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.75, width * 0.75), material);

    return mesh;
  }

  createHandle() {
    const material = new THREE.MeshStandardMaterial({
      color: this.metalColor,
      roughness: 0.25,
      metalness: 0.9,
    });

    this.handle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.35, 20), material);

    this.handle.rotation.x = Math.PI / 2;

    this.handle.position.set(this.width * 0.35, -this.height * 0.1, 0.2);

    this.door.add(this.handle);
  }

  changeDigit(index) {
    if (!this.isLocked) {
      return;
    }

    if (index < 0 || index >= this.values.length) {
      return;
    }

    this.values[index] = (this.values[index] + 1) % this.symbols.length;

    this.updateDisplay(index);

    this.checkPassword();
  }

  updateDisplay(index) {
    const oldMesh = this.displayMeshes[index];

    const newMesh = this.createSymbolMesh(this.symbols[this.values[index]], 0.55);

    newMesh.position.copy(oldMesh.position);
    newMesh.userData.safeDigitIndex = index;

    this.lockPanel.remove(oldMesh);

    oldMesh.geometry.dispose();
    oldMesh.material.map?.dispose();
    oldMesh.material.dispose();

    this.lockPanel.add(newMesh);

    this.displayMeshes[index] = newMesh;
  }

  getCurrentCombination() {
    return this.values.map((index) => this.symbols[index]);
  }

  checkPassword() {
    const currentCombination = this.getCurrentCombination();

    const correct = this.password.every((value, index) => value === currentCombination[index]);

    if (correct && (this.canUnlock?.() ?? true)) {
      this.unlock();
    }

    return correct;
  }

  unlock() {
    if (!this.isLocked) {
      return;
    }

    this.isLocked = false;

    this.exitFocusRequested = true;

    if (this.onUnlock) {
      this.onUnlock(this);
    }
  }

  open() {
    if (this.isLocked || this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.targetDoorRotation = this.openAngle;
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.targetDoorRotation = 0;
  }

  toggleDoor() {
    if (this.isLocked) {
      return;
    }

    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  setFocused(focused) {
    this.isFocused = focused;
  }

  interact() {
    if (this.isLocked) {
      this.onFocus?.(this);
      return;
    }

    this.toggleDoor();
  }

  getInteractionText() {
    if (this.isLocked) {
      return tInteraction("examine", tItem("safe"));
    }

    return this.isOpen ? tInteraction("close", tItem("safe")) : tInteraction("open", tItem("safe"));
  }

  addItem(
    item,
    {
      position = new THREE.Vector3(0, 0.15, 0),
      rotation = null,
      scale = null,
      visible = true,
    } = {},
  ) {
    const object3D = item?.object3D ?? (item?.isObject3D ? item : null);
    const itemId = item?.id ?? object3D?.name;

    if (!object3D || !itemId || this.contents.has(itemId)) {
      return false;
    }

    this.contents.set(itemId, item);
    this.contentContainer.add(object3D);
    object3D.position.copy(position);
    object3D.visible = visible;

    if (rotation) {
      object3D.rotation.copy(rotation);
    }

    if (scale !== null) {
      if (typeof scale === "number") {
        object3D.scale.setScalar(scale);
      } else {
        object3D.scale.copy(scale);
      }
    }

    return true;
  }

  removeItem(itemId, targetParent = null) {
    const item = this.contents.get(itemId);

    if (!item) {
      return null;
    }

    const object3D = item.object3D ?? (item.isObject3D ? item : null);
    this.contents.delete(itemId);

    if (object3D) {
      this.contentContainer.remove(object3D);
      targetParent?.add(object3D);
    }

    return item;
  }

  hasItem(itemId) {
    return this.contents.has(itemId);
  }

  getItem(itemId) {
    return this.contents.get(itemId) ?? null;
  }

  getItems() {
    return Array.from(this.contents.values());
  }

  update(delta) {
    this.doorPivot.rotation.y = THREE.MathUtils.damp(
      this.doorPivot.rotation.y,
      this.targetDoorRotation,
      this.doorSpeed,
      delta,
    );

    if (Math.abs(this.doorPivot.rotation.y - this.targetDoorRotation) < 0.001) {
      this.doorPivot.rotation.y = this.targetDoorRotation;
    }
  }

  getFocusPosition() {
    const position = new THREE.Vector3();
    this.lockPanel.getWorldPosition(position);

    const worldScale = new THREE.Vector3();
    this.object3D.getWorldScale(worldScale);
    const scale = Math.max(worldScale.x, worldScale.y, worldScale.z);
    const offset = new THREE.Vector3(0, 0, Math.max(2, 3.8 * scale));

    offset.applyQuaternion(this.object3D.getWorldQuaternion(new THREE.Quaternion()));

    return position.add(offset);
  }

  getLookAtPosition() {
    const position = new THREE.Vector3();
    this.lockPanel.getWorldPosition(position);

    return position;
  }
}

export { Safe };
