import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Lock extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    digits = 4,
    password = "1234",
    color = 0x4a4a4a,
    metalColor = 0x777777,
    wheelColor = 0x222222,
    onFocus = null,
    onUnlock = null,
  } = {}) {
    super(id);

    if (!Number.isInteger(digits) || digits < 1) {
      throw new Error(`CombinationLock "${id}": digits debe ser mayor que 0.`);
    }

    const passwordString = String(password);

    if (passwordString.length !== digits) {
      throw new Error(`CombinationLock "${id}": password debe tener ${digits} dígitos.`);
    }

    if (!/^\d+$/.test(passwordString)) {
      throw new Error(`CombinationLock "${id}": password solo puede contener números.`);
    }

    this.digits = digits;
    this.password = passwordString;

    this.color = color;
    this.metalColor = metalColor;
    this.wheelColor = wheelColor;

    this.onFocus = onFocus;
    this.onUnlock = onUnlock;

    this.values = Array(digits).fill(0);

    this.locked = true;
    this.focused = false;

    this.wheels = [];
    this.numberMeshes = [];

    this.shackleOpenProgress = 0;
    this.shackleOpening = false;

    this.object3D = this.createLock();

    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }
  }

  createLock() {
    const group = new THREE.Group();

    group.name = this.id;

    this.createBody(group);
    this.createShackle(group);
    this.createWheels(group);

    return group;
  }

  createBody(group) {
    const width = Math.max(2.6, this.digits * 0.75 + 0.8);

    const geometry = new THREE.BoxGeometry(width, 2.2, 0.8);

    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.35,
      metalness: 0.65,
    });

    this.body = new THREE.Mesh(geometry, material);

    this.body.position.y = 0;

    this.body.castShadow = true;
    this.body.receiveShadow = true;

    this.body.userData.entity = this;

    group.add(this.body);
  }

  createShackle(group) {
    const width = Math.max(1.4, this.digits * 0.35);

    const radius = width / 2;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-radius, 1, 0),

      new THREE.Vector3(-radius, 2.3, 0),

      new THREE.Vector3(0, 2.9, 0),

      new THREE.Vector3(radius, 2.3, 0),

      new THREE.Vector3(radius, 1, 0),
    ]);

    const geometry = new THREE.TubeGeometry(curve, 32, 0.15, 12, false);

    const material = new THREE.MeshStandardMaterial({
      color: this.metalColor,
      roughness: 0.2,
      metalness: 0.9,
    });

    this.shackle = new THREE.Mesh(geometry, material);

    this.shackle.castShadow = true;

    group.add(this.shackle);
  }

  createWheels(group) {
    const spacing = 0.72;

    const totalWidth = (this.digits - 1) * spacing;

    const startX = -totalWidth / 2;

    for (let index = 0; index < this.digits; index++) {
      const wheelGroup = new THREE.Group();

      wheelGroup.position.set(startX + index * spacing, 0, 0.44);

      const wheelGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.48, 24);

      const wheelMaterial = new THREE.MeshStandardMaterial({
        color: this.wheelColor,
        roughness: 0.45,
        metalness: 0.35,
      });

      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

      wheel.rotation.z = Math.PI / 2;

      wheel.castShadow = true;

      wheel.userData.lock = this;
      wheel.userData.lockDigitIndex = index;

      wheelGroup.add(wheel);

      const numberMesh = this.createNumberMesh(this.values[index]);

      numberMesh.position.set(0, 0, 0.3);

      numberMesh.userData.lock = this;
      numberMesh.userData.lockDigitIndex = index;

      wheelGroup.add(numberMesh);

      this.wheels.push(wheelGroup);
      this.numberMeshes.push(numberMesh);

      group.add(wheelGroup);
    }
  }

  createNumberMesh(number) {
    const canvas = document.createElement("canvas");

    canvas.width = 128;
    canvas.height = 128;

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(0.35, 0.45);

    const mesh = new THREE.Mesh(geometry, material);

    mesh.userData.canvas = canvas;
    mesh.userData.texture = texture;

    this.drawNumber(mesh, number);

    return mesh;
  }

  drawNumber(mesh, number) {
    const canvas = mesh.userData.canvas;

    const texture = mesh.userData.texture;

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#111111";

    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#f2e6c9";

    context.font = "bold 82px Arial";

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(String(number), canvas.width / 2, canvas.height / 2);

    texture.needsUpdate = true;
  }

  incrementDigit(index) {
    if (!this.focused || !this.locked) {
      return;
    }

    if (index < 0 || index >= this.digits) {
      return;
    }

    this.values[index] = (this.values[index] + 1) % 10;

    this.updateDigit(index);
    this.checkCombination();
  }

  decrementDigit(index) {
    if (!this.focused || !this.locked) {
      return;
    }

    if (index < 0 || index >= this.digits) {
      return;
    }

    this.values[index] = (this.values[index] + 9) % 10;

    this.updateDigit(index);
    this.checkCombination();
  }

  updateDigit(index) {
    this.drawNumber(this.numberMeshes[index], this.values[index]);
  }

  getCombination() {
    return this.values.join("");
  }

  checkCombination() {
    if (this.getCombination() === this.password) {
      this.unlock();

      return true;
    }

    return false;
  }

  unlock() {
    if (!this.locked) {
      return;
    }

    this.locked = false;

    this.exitFocusRequested = true;
    this.shackleOpening = true;
    this.shackleOpenProgress = 0;

    if (this.onUnlock) {
      this.onUnlock(this);
    }
  }

  setFocused(focused) {
    this.focused = focused;
  }

  interact() {
    if (!this.enabled) {
      return;
    }

    if (this.onFocus) {
      this.onFocus(this);
    }
  }

  getInteractionText() {
    if (!this.enabled) {
      return null;
    }

    return this.locked ? tInteraction("examine", tItem("lock")) : null;
  }

  getFocusPosition() {
    const position = new THREE.Vector3();
    this.object3D.getWorldPosition(position);
    const worldScale = new THREE.Vector3();
    this.object3D.getWorldScale(worldScale);

    const scale = Math.max(worldScale.x, worldScale.y, worldScale.z);
    const distance = Math.max(1.2, 2.5 * scale);
    const offset = new THREE.Vector3(0, 0, distance);
    offset.applyQuaternion(this.object3D.getWorldQuaternion(new THREE.Quaternion()));

    return position.add(offset);
  }

  getLookAtPosition() {
    const position = new THREE.Vector3();
    this.object3D.getWorldPosition(position);
    const worldScale = new THREE.Vector3();
    this.object3D.getWorldScale(worldScale);
    position.y += 0.3 * worldScale.y;

    return position;
  }

  getDigitMeshes() {
    return this.numberMeshes;
  }

  update(delta) {
    if (!this.shackleOpening) {
      return;
    }

    this.shackleOpenProgress += delta / 0.5;

    const t = Math.min(this.shackleOpenProgress, 1);

    const eased = t * t * (3 - 2 * t);

    this.shackle.position.y = THREE.MathUtils.lerp(0, 0.8, eased);

    this.shackle.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 8, eased);

    if (t >= 1) {
      this.shackleOpening = false;
    }
  }

  dispose() {
    this.object3D.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.geometry?.dispose();

      const materials = Array.isArray(child.material) ? child.material : [child.material];

      materials.forEach((material) => {
        material?.map?.dispose();
        material?.dispose();
      });
    });

    this.wheels = [];
    this.numberMeshes = [];

    this.object3D.clear();
  }
}

export { Lock };
