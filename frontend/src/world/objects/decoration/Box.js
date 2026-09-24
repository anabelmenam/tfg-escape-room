import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Entity } from "../Entity.js";
import { loadTexture } from "../helpers/loadTexture.js";

class Box extends Entity {
  constructor({
    id = "box",

    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    rotationY = 0,
    scale = 1,

    width = 2,
    height = 1.4,
    depth = 1.5,

    wallThickness = 0.12,
    lidThickness = 0.14,

    cornerRadius = 0.08,
    roundedSegments = 4,

    boxColor = 0x7a4f2b,
    interiorColor = 0x4f321f,
    lidColor = null,

    texture = null,
    textureRepeat = {
      x: 1,
      y: 1,
    },

    roughness = 0.75,
    metalness = 0,

    openAngle = Math.PI / 2,
    openingSpeed = 3,

    initiallyOpen = false,
    locked = false,
    requiredKey = null,

    capacity = Infinity,

    castShadow = true,
    receiveShadow = true,

    createCollider = true,

    onOpenChange = null,
    onItemAdded = null,
    onItemRemoved = null,
  } = {}) {
    super(id);

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.wallThickness = wallThickness;
    this.lidThickness = lidThickness;

    this.cornerRadius = cornerRadius;
    this.roundedSegments = Math.max(1, Math.floor(roundedSegments));

    this.openAngle = openAngle;
    this.openingSpeed = openingSpeed;

    this.isOpen = initiallyOpen;
    this.targetOpen = initiallyOpen;

    this.locked = locked;
    this.requiredKey = requiredKey;

    this.capacity = capacity;

    this.castShadow = castShadow;
    this.receiveShadow = receiveShadow;

    this.createColliderEnabled = createCollider;

    this.onOpenChange = onOpenChange;
    this.onItemAdded = onItemAdded;
    this.onItemRemoved = onItemRemoved;

    this.contents = new Map();

    this.texture = texture
      ? loadTexture({
          path: texture,
          repeat: textureRepeat,
          colorTexture: true,
        })
      : null;

    this.boxMaterial = new THREE.MeshStandardMaterial({
      color: boxColor,
      map: this.texture,
      roughness,
      metalness,
    });

    this.lidMaterial = new THREE.MeshStandardMaterial({
      color: lidColor ?? boxColor,
      map: this.texture,
      roughness,
      metalness,
    });

    this.interiorMaterial = new THREE.MeshStandardMaterial({
      color: interiorColor,
      roughness,
      metalness,
    });

    this.object3D = new THREE.Group();
    this.object3D.name = id;

    this.object3D.position.copy(position);

    this.object3D.rotation.copy(rotation);
    this.object3D.rotation.y += rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }

    this.contentContainer = new THREE.Group();
    this.contentContainer.name = `${this.id}-content-container`;

    this.contentContainer.position.y = this.wallThickness;

    this.object3D.add(this.contentContainer);

    this.lidPivot = new THREE.Group();
    this.lidPivot.name = `${this.id}-lid-pivot`;

    this.collider = null;

    this.createBox();

    this.lidPivot.rotation.x = this.isOpen ? -this.openAngle : 0;

    this.object3D.updateMatrixWorld(true);

    if (this.createColliderEnabled) {
      this.updateCollider();
    }
  }

  createBox() {
    this.createBottom();
    this.createWalls();
    this.createLid();
  }

  createRoundedGeometry({ width, height, depth, radius = this.cornerRadius }) {
    const maximumRadius = Math.min(width, height, depth) / 2;

    const validRadius = Math.max(0.001, Math.min(radius, maximumRadius * 0.95));

    return new RoundedBoxGeometry(width, height, depth, this.roundedSegments, validRadius);
  }

  createBottom() {
    const geometry = this.createRoundedGeometry({
      width: this.width,
      height: this.wallThickness,
      depth: this.depth,
    });

    const bottom = new THREE.Mesh(geometry, this.boxMaterial);

    bottom.name = `${this.id}-bottom`;

    bottom.position.y = this.wallThickness / 2;

    this.configureMesh(bottom);
    this.object3D.add(bottom);
  }

  createWalls() {
    const wallHeight = this.height - this.lidThickness;

    const wallY = this.wallThickness + wallHeight / 2;

    const sideDepth = this.depth - this.wallThickness * 2;

    const frontBackWidth = this.width;

    const sideGeometry = this.createRoundedGeometry({
      width: this.wallThickness,
      height: wallHeight,
      depth: sideDepth,
    });

    const frontBackGeometry = this.createRoundedGeometry({
      width: frontBackWidth,
      height: wallHeight,
      depth: this.wallThickness,
    });

    const leftWall = new THREE.Mesh(sideGeometry, this.boxMaterial);

    leftWall.name = `${this.id}-left-wall`;

    leftWall.position.set(-this.width / 2 + this.wallThickness / 2, wallY, 0);

    const rightWall = new THREE.Mesh(sideGeometry, this.boxMaterial);

    rightWall.name = `${this.id}-right-wall`;

    rightWall.position.set(this.width / 2 - this.wallThickness / 2, wallY, 0);

    const frontWall = new THREE.Mesh(frontBackGeometry, this.boxMaterial);

    frontWall.name = `${this.id}-front-wall`;

    frontWall.position.set(0, wallY, this.depth / 2 - this.wallThickness / 2);

    const backWall = new THREE.Mesh(frontBackGeometry, this.boxMaterial);

    backWall.name = `${this.id}-back-wall`;

    backWall.position.set(0, wallY, -this.depth / 2 + this.wallThickness / 2);

    [leftWall, rightWall, frontWall, backWall].forEach((wall) => {
      this.configureMesh(wall);
      this.object3D.add(wall);
    });

    this.createInteriorBottom();
  }

  createInteriorBottom() {
    const interiorWidth = this.width - this.wallThickness * 2;

    const interiorDepth = this.depth - this.wallThickness * 2;

    const geometry = new THREE.PlaneGeometry(interiorWidth, interiorDepth);

    const interior = new THREE.Mesh(geometry, this.interiorMaterial);

    interior.name = `${this.id}-interior-bottom`;

    interior.rotation.x = -Math.PI / 2;

    interior.position.y = this.wallThickness + 0.002;

    this.configureMesh(interior);
    this.object3D.add(interior);
  }

  createLid() {

    this.lidPivot.position.set(0, this.height - this.lidThickness, -this.depth / 2);

    const geometry = this.createRoundedGeometry({
      width: this.width,
      height: this.lidThickness,
      depth: this.depth,
    });

    const lid = new THREE.Mesh(geometry, this.lidMaterial);

    lid.name = `${this.id}-lid`;

    lid.position.set(0, this.lidThickness / 2, this.depth / 2);

    this.configureMesh(lid);

    this.lidPivot.add(lid);
    this.object3D.add(this.lidPivot);

    this.lid = lid;
  }

  configureMesh(mesh) {
    mesh.castShadow = this.castShadow;
    mesh.receiveShadow = this.receiveShadow;

    if (mesh.geometry) {
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }
  }

  interact(context = {}) {
    return this.toggle(context);
  }

  toggle({ inventory = null } = {}) {
    if (this.isOpen || this.targetOpen) {
      return this.close();
    }

    return this.open({ inventory });
  }

  open({ inventory = null } = {}) {
    if (this.locked) {
      const canUnlock = this.requiredKey && this.inventoryHasKey(inventory, this.requiredKey);

      if (!canUnlock) {
        return {
          success: false,
          reason: "locked",
          requiredKey: this.requiredKey,
        };
      }

      inventory.remove(this.requiredKey);
      this.unlock();
    }

    if (this.targetOpen) {
      return {
        success: false,
        reason: "already-open",
      };
    }

    this.targetOpen = true;

    return {
      success: true,
      action: "opening",
    };
  }

  close() {
    if (!this.targetOpen && !this.isOpen) {
      return {
        success: false,
        reason: "already-closed",
      };
    }

    this.targetOpen = false;

    return {
      success: true,
      action: "closing",
    };
  }

  inventoryHasKey(inventory, keyId) {
    if (!inventory || !keyId) {
      return false;
    }

    return inventory.hasSelected(keyId);
  }

  lock(requiredKey = this.requiredKey) {
    this.locked = true;
    this.requiredKey = requiredKey;
  }

  unlock() {
    this.locked = false;
  }

  update(delta) {
    const targetAngle = this.targetOpen ? -this.openAngle : 0;

    const currentAngle = this.lidPivot.rotation.x;

    const nextAngle = THREE.MathUtils.damp(currentAngle, targetAngle, this.openingSpeed, delta);

    this.lidPivot.rotation.x = nextAngle;

    const completed = Math.abs(nextAngle - targetAngle) < 0.001;

    if (!completed) {
      return;
    }

    this.lidPivot.rotation.x = targetAngle;

    const previousState = this.isOpen;
    this.isOpen = this.targetOpen;

    if (previousState !== this.isOpen) {
      this.onOpenChange?.({
        box: this,
        isOpen: this.isOpen,
      });

      this.refreshCollider();
    }
  }

  addItem(item, { position = null, rotation = null, scale = null, visibleInside = true } = {}) {
    if (!item) {
      return {
        success: false,
        reason: "invalid-item",
      };
    }

    if (this.contents.size >= this.capacity) {
      return {
        success: false,
        reason: "full",
      };
    }

    const object3D = item.object3D ?? (item.isObject3D ? item : null);

    if (!object3D) {
      return {
        success: false,
        reason: "invalid-object3D",
      };
    }

    const itemId = item.id ?? object3D.name;

    if (!itemId) {
      return {
        success: false,
        reason: "missing-id",
      };
    }

    if (this.contents.has(itemId)) {
      return {
        success: false,
        reason: "already-stored",
      };
    }

    this.contents.set(itemId, item);

    this.contentContainer.add(object3D);

    object3D.visible = visibleInside;

    if (position) {
      object3D.position.copy(position);
    } else {
      object3D.position.copy(this.getNextItemPosition());
    }

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

    this.onItemAdded?.({
      box: this,
      item,
      itemId,
    });

    return {
      success: true,
      item,
      itemId,
    };
  }

  removeItem(itemId, targetParent = null) {
    if (!this.contents.has(itemId)) {
      return {
        success: false,
        reason: "not-found",
      };
    }

    const item = this.contents.get(itemId);

    const object3D = item.object3D ?? (item.isObject3D ? item : null);

    this.contents.delete(itemId);

    if (object3D) {
      this.contentContainer.remove(object3D);

      if (targetParent) {
        targetParent.add(object3D);
      }
    }

    this.onItemRemoved?.({
      box: this,
      item,
      itemId,
    });

    return {
      success: true,
      item,
      itemId,
    };
  }

  getItem(itemId) {
    return this.contents.get(itemId) ?? null;
  }

  hasItem(itemId) {
    return this.contents.has(itemId);
  }

  getItems() {
    return Array.from(this.contents.values());
  }

  getItemIds() {
    return Array.from(this.contents.keys());
  }

  getItemCount() {
    return this.contents.size;
  }

  isFull() {
    return this.contents.size >= this.capacity;
  }

  clearItems(targetParent = null) {
    const removedItems = [];

    for (const itemId of this.getItemIds()) {
      const result = this.removeItem(itemId, targetParent);

      if (result.success) {
        removedItems.push(result.item);
      }
    }

    return removedItems;
  }

  getNextItemPosition() {
    const index = this.contents.size - 1;

    const columns = 3;
    const spacing = 0.3;

    const column = index % columns;
    const row = Math.floor(index / columns);

    return new THREE.Vector3((column - 1) * spacing, this.wallThickness + 0.1, -row * spacing);
  }

  updateCollider() {
    this.object3D.updateMatrixWorld(true);

    const originalVisibility = this.lidPivot.visible;

    this.lidPivot.visible = false;
    this.object3D.updateMatrixWorld(true);

    this.collider = new THREE.Box3().setFromObject(this.object3D);

    this.lidPivot.visible = originalVisibility;

    this.object3D.updateMatrixWorld(true);

    return this.collider;
  }

  getCollider() {
    if (!this.createColliderEnabled) {
      return null;
    }

    return this.updateCollider();
  }

  setPosition(position) {
    this.object3D.position.copy(position);
    this.refreshCollider();
  }

  setRotation({ x = this.object3D.rotation.x, y = this.object3D.rotation.y, z = this.object3D.rotation.z } = {}) {
    this.object3D.rotation.set(x, y, z);
    this.refreshCollider();
  }

  setRotationY(rotationY) {
    this.object3D.rotation.y = rotationY;
    this.refreshCollider();
  }

  setScale(scale) {
    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }

    this.refreshCollider();
  }

  refreshCollider() {
    if (this.createColliderEnabled) {
      this.updateCollider();
    }
  }

  dispose() {
    const disposedGeometries = new Set();
    const disposedMaterials = new Set();
    const disposedTextures = new Set();

    this.object3D.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      if (child.geometry && !disposedGeometries.has(child.geometry)) {
        child.geometry.dispose();
        disposedGeometries.add(child.geometry);
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];

      materials.forEach((material) => {
        if (!material || disposedMaterials.has(material)) {
          return;
        }

        if (material.map && !disposedTextures.has(material.map)) {
          material.map.dispose();
          disposedTextures.add(material.map);
        }

        material.dispose();
        disposedMaterials.add(material);
      });
    });

    this.object3D.clear();
    this.contents.clear();

    this.collider = null;
    this.texture = null;
  }
}

export { Box };
