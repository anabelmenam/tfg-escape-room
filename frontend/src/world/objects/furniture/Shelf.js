import * as THREE from "three";
import { Entity } from "../Entity.js";
import { loadTexture } from "../helpers/loadTexture.js";

class Shelf extends Entity {
  constructor({
    id = "shelf",
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    width = 2.5,
    height = 2.2,
    depth = 0.4,
    shelves = 4,
    thickness = 0.06,
    color = 0x7a4b2a,
    woodTexture = null,
    woodTextureRepeat = {
      x: 1,
      y: 1,
    },
    castShadow = true,
    receiveShadow = true,
    createCollider = true,
    backWall = false,
  } = {}) {
    super(id);

    if (width <= 0 || height <= 0 || depth <= 0) {
      throw new Error(`Shelf "${id}" necesita dimensiones mayores que cero.`);
    }
    if (!Number.isInteger(shelves) || shelves < 1) {
      throw new Error(`Shelf "${id}" necesita al menos una balda.`);
    }
    if (thickness <= 0) {
      throw new Error(`Shelf "${id}" necesita un grosor mayor que cero.`);
    }
    if (thickness * 2 >= width) {
      throw new Error(`Shelf "${id}" tiene un grosor demasiado grande para su ancho.`);
    }
    if (thickness * 2 >= height) {
      throw new Error(`Shelf "${id}" tiene un grosor demasiado grande para su altura.`);
    }

    this.backWall = backWall;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.shelves = shelves;
    this.thickness = thickness;
    this.castShadow = castShadow;
    this.receiveShadow = receiveShadow;
    this.createColliderEnabled = createCollider;
    this.shelfLevels = [];
    this.shelfObjects = new Map();
    this.texture = woodTexture
      ? loadTexture({
          path: woodTexture,
          repeat: woodTextureRepeat,
          colorTexture: true,
        })
      : null;

    this.material = new THREE.MeshStandardMaterial({
      color,
      map: this.texture,
      roughness: 0.75,
      metalness: 0,
    });

    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.structureGroup = new THREE.Group();
    this.structureGroup.name = `${id}-structure`;
    this.contentGroup = new THREE.Group();
    this.contentGroup.name = `${id}-content`;
    this.object3D.add(this.structureGroup);
    this.object3D.add(this.contentGroup);
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }

    this.isMechanismMoving = false;
    this.mechanismProgress = 0;
    this.mechanismDuration = 1.5;
    this.mechanismStartRotation = 0;
    this.mechanismTargetRotation = 0;
    this.mechanismStartPosition = new THREE.Vector3();
    this.mechanismHingePosition = new THREE.Vector3();
    this.mechanismSide = "left";

    this.collider = null;
    this.createShelf();
    this.object3D.updateMatrixWorld(true);
    if (this.createColliderEnabled) {
      this.updateCollider();
    }
  }

  createShelf() {
    this.createSides();
    this.createBoards();
    if (this.backWall) {
      this.createBackWall();
    }
  }

  createSides() {
    const leftSide = this.createBoard({
      width: this.thickness,
      height: this.height,
      depth: this.depth,
      name: `${this.id}-left-side`,
    });
    leftSide.position.set(-this.width / 2 + this.thickness / 2, this.height / 2, 0);

    const rightSide = this.createBoard({
      width: this.thickness,
      height: this.height,
      depth: this.depth,
      name: `${this.id}-right-side`,
    });
    rightSide.position.set(this.width / 2 - this.thickness / 2, this.height / 2, 0);
    this.structureGroup.add(leftSide);
    this.structureGroup.add(rightSide);
  }

  createBoards() {
    const internalWidth = this.width - this.thickness * 2;
    const availableHeight = this.height - this.thickness;
    const distanceBetweenShelves = availableHeight / this.shelves;

    for (let index = 0; index <= this.shelves; index++) {
      const y =
        index === this.shelves ? this.height - this.thickness / 2 : this.thickness / 2 + distanceBetweenShelves * index;
      const board = this.createBoard({
        width: internalWidth,
        height: this.thickness,
        depth: this.depth,
        name: `${this.id}-board-${index}`,
      });

      board.position.set(0, y, 0);
      this.structureGroup.add(board);

      if (index < this.shelves) {
        const surfaceY = y + this.thickness / 2;
        this.shelfLevels.push(surfaceY);
        this.shelfObjects.set(index, []);
      }
    }
  }

  createBackWall() {
    const back = this.createBoard({
      width: this.width,
      height: this.height,
      depth: this.thickness,
      name: `${this.id}-back-wall`,
    });

    back.position.set(0, this.height / 2, -this.depth / 2 + this.thickness / 2);

    this.structureGroup.add(back);
  }

  createBoard({ width, height, depth, name }) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const board = new THREE.Mesh(geometry, this.material);
    board.name = name;
    board.userData.isShelfPart = true;
    this.configureMesh(board);
    return board;
  }

  configureMesh(mesh) {
    mesh.castShadow = this.castShadow;
    mesh.receiveShadow = this.receiveShadow;
    mesh.geometry?.computeBoundingBox();
    mesh.geometry?.computeBoundingSphere();
  }

  addToShelf(
    object,
    {
      shelf = 0,
      x = 0,
      z = 0,
      rotationX = object?.rotation?.x ?? 0,
      rotationY = object?.rotation?.y ?? 0,
      rotationZ = object?.rotation?.z ?? 0,
      placeOnSurface = true,
    } = {},
  ) {
    if (!object?.isObject3D) {
      console.warn(`Shelf "${this.id}": el objeto debe ser un THREE.Object3D.`);
      return null;
    }

    if (!this.isValidShelf(shelf)) {
      console.warn(`Shelf "${this.id}": la balda ${shelf} no existe. Debe estar entre 0 y ${this.shelves - 1}.`);
      return null;
    }

    this.removeObjectFromRegistry(object);
    this.contentGroup.add(object);
    object.rotation.set(rotationX, rotationY, rotationZ);
    object.position.set(0, 0, 0);
    object.updateMatrixWorld(true);

    const objectSize = this.getObjectLocalSize(object);
    const shelfY = this.getShelfHeight(shelf);
    const finalX = this.clampXPosition(x, objectSize.x);
    const finalZ = this.clampZPosition(z, objectSize.z);
    const finalY = placeOnSurface ? shelfY + objectSize.y / 2 : shelfY;

    object.position.set(finalX, finalY, finalZ);
    object.userData.shelfIndex = shelf;
    object.userData.shelfId = this.id;
    this.shelfObjects.get(shelf).push(object);
    object.updateMatrixWorld(true);

    return object;
  }

  getShelfHeight(shelf) {
    if (!this.isValidShelf(shelf)) {
      console.warn(`Shelf "${this.id}": la balda ${shelf} no existe. Debe estar entre 0 y ${this.shelves - 1}.`);
      return null;
    }
    return this.shelfLevels[shelf];
  }

  getObjectLocalSize(object) {
    object.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();

    box.getSize(size);

    const worldScale = this.contentGroup.getWorldScale(new THREE.Vector3());

    size.x /= Math.abs(worldScale.x) || 1;
    size.y /= Math.abs(worldScale.y) || 1;
    size.z /= Math.abs(worldScale.z) || 1;

    return size;
  }

  clampXPosition(x, objectWidth) {
    const internalHalfWidth = (this.width - this.thickness * 2) / 2;
    const maxX = Math.max(0, internalHalfWidth - objectWidth / 2);

    return THREE.MathUtils.clamp(x, -maxX, maxX);
  }

  clampZPosition(z, objectDepth) {
    const halfDepth = this.depth / 2;
    const maxZ = Math.max(0, halfDepth - objectDepth / 2);

    return THREE.MathUtils.clamp(z, -maxZ, maxZ);
  }

  isValidShelf(shelf) {
    return Number.isInteger(shelf) && shelf >= 0 && shelf < this.shelves;
  }

  removeObjectFromRegistry(object) {
    const previousShelf = object?.userData?.shelfIndex;

    if (previousShelf === undefined || !this.shelfObjects.has(previousShelf)) {
      return;
    }

    const objects = this.shelfObjects.get(previousShelf);
    const objectIndex = objects.indexOf(object);

    if (objectIndex !== -1) {
      objects.splice(objectIndex, 1);
    }
  }

  removeObject(object) {
    if (!object?.isObject3D) {
      return false;
    }

    this.removeObjectFromRegistry(object);

    delete object.userData.shelfIndex;
    delete object.userData.shelfId;

    this.contentGroup.remove(object);

    return true;
  }

  clearShelf(shelf) {
    if (!this.isValidShelf(shelf)) {
      console.warn(`Shelf "${this.id}": la balda ${shelf} no existe. Debe estar entre 0 y ${this.shelves - 1}.`);

      return;
    }

    const objects = [...this.shelfObjects.get(shelf)];

    objects.forEach((object) => {
      this.removeObject(object);
    });
  }

  getShelfObjects(shelf) {
    if (!this.isValidShelf(shelf)) {
      return [];
    }

    return [...this.shelfObjects.get(shelf)];
  }

  moveObjectToShelf(
    object,
    {
      shelf,
      x = 0,
      z = 0,
      rotationX = object?.rotation?.x ?? 0,
      rotationY = object?.rotation?.y ?? 0,
      rotationZ = object?.rotation?.z ?? 0,
      placeOnSurface = true,
    } = {},
  ) {
    if (!object?.isObject3D) {
      return null;
    }

    this.removeObject(object);

    return this.addToShelf(object, {
      shelf,
      x,
      z,
      rotationX,
      rotationY,
      rotationZ,
      placeOnSurface,
    });
  }

  openMechanism({ angle = Math.PI / 2, duration = 1.5, side = "left" } = {}) {
    if (this.isMechanismMoving) {
      return;
    }

    this.isMechanismMoving = true;
    this.mechanismProgress = 0;
    this.mechanismDuration = duration;
    this.mechanismSide = side;
    this.mechanismStartRotation = this.object3D.rotation.y;
    this.mechanismTargetRotation = this.mechanismStartRotation + angle;
    this.mechanismStartPosition.copy(this.object3D.position);

    const hingeX = side === "left" ? -this.width / 2 : this.width / 2;

    const hingeOffset = new THREE.Vector3(hingeX, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.mechanismStartRotation,
    );

    this.mechanismHingePosition.copy(this.mechanismStartPosition).add(hingeOffset);
  }

  updateCollider() {
    this.object3D.updateMatrixWorld(true);
    this.collider = new THREE.Box3().setFromObject(this.structureGroup);

    return this.collider;
  }

  getCollider() {
    if (!this.createColliderEnabled) {
      return null;
    }

    return this.updateCollider();
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getDepth() {
    return this.depth;
  }

  getShelfCount() {
    return this.shelves;
  }

  setVisible(visible) {
    this.object3D.visible = visible;
  }

  setPosition(position) {
    this.object3D.position.copy(position);
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

  getInteractionText() {
    return null;
  }

  interact() {}

  update(delta) {
    if (!this.enabled) {
      return;
    }

    if (!this.isMechanismMoving) {
      return;
    }

    this.mechanismProgress += delta / this.mechanismDuration;
    const t = Math.min(this.mechanismProgress, 1);
    const eased = t * t * (3 - 2 * t);
    const rotation = THREE.MathUtils.lerp(this.mechanismStartRotation, this.mechanismTargetRotation, eased);
    const hingeX = this.mechanismSide === "left" ? -this.width / 2 : this.width / 2;
    const hingeOffset = new THREE.Vector3(hingeX, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);

    this.object3D.rotation.y = rotation;
    this.object3D.position.copy(this.mechanismHingePosition).sub(hingeOffset);
    this.refreshCollider();

    if (t >= 1) {
      this.isMechanismMoving = false;
    }
  }

  dispose() {
    this.shelfObjects.forEach((objects) => {
      objects.forEach((object) => {
        this.contentGroup.remove(object);
      });
    });

    this.shelfObjects.clear();

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

    this.collider = null;
    this.texture = null;
    this.structureGroup = null;
    this.contentGroup = null;
  }
}

export { Shelf };
