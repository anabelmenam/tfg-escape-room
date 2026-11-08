import * as THREE from "three";
import { Entity } from "../Entity.js";
import { createWoodMaterials } from "../helpers/createWoodMaterials.js";

class Table extends Entity {
  constructor({
    id = "table",
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    rotationY = 0,
    scale = 1,
    width = 4,
    height = 1.6,
    depth = 2.5,
    topThickness = 0.18,
    legThickness = 0.22,
    legInset = 0.2,
    hasShelf = true,
    shelfHeight = 0.45,
    shelfThickness = 0.12,
    shelfInset = 0.25,
    woodColor = 0x8a5a35,
    darkWoodColor = 0x51321f,
    interiorColor = 0x6e4429,
    woodTexture = null,
    woodTextureRepeat = {
      x: 1,
      y: 1,
    },
    castShadow = true,
    receiveShadow = true,
    createCollider = true,
  } = {}) {
    super(id);

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.topThickness = topThickness;
    this.legThickness = legThickness;
    this.legInset = legInset;
    this.hasShelf = hasShelf;
    this.shelfHeight = shelfHeight;
    this.shelfThickness = shelfThickness;
    this.shelfInset = shelfInset;
    this.castShadow = castShadow;
    this.receiveShadow = receiveShadow;
    this.createColliderEnabled = createCollider;

    const materials = createWoodMaterials({
      woodColor,
      darkWoodColor,
      interiorColor,
      woodTexture,
      woodTextureRepeat,
    });

    this.woodMaterial = materials.wood;
    this.darkWoodMaterial = materials.darkWood;
    this.interiorMaterial = materials.interior;

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

    this.collider = null;

    this.createTable();

    this.object3D.updateMatrixWorld(true);

    if (this.createColliderEnabled) {
      this.updateCollider();
    }
  }

  createTable() {
    this.createTop();
    this.createLegs();

    if (this.hasShelf) {
      this.createShelf();
    }
  }

  createTop() {
    const geometry = new THREE.BoxGeometry(this.width, this.topThickness, this.depth);

    const top = new THREE.Mesh(geometry, this.woodMaterial);
    top.name = `${this.id}-top`;
    top.position.y = this.height - this.topThickness / 2;

    this.configureMesh(top);
    this.object3D.add(top);
  }

  createLegs() {
    const legHeight = this.height - this.topThickness;
    const legGeometry = new THREE.BoxGeometry(this.legThickness, legHeight, this.legThickness);
    const x = this.width / 2 - this.legInset - this.legThickness / 2;
    const z = this.depth / 2 - this.legInset - this.legThickness / 2;
    const y = legHeight / 2;

    const legPositions = [
      new THREE.Vector3(-x, y, -z),
      new THREE.Vector3(x, y, -z),
      new THREE.Vector3(-x, y, z),
      new THREE.Vector3(x, y, z),
    ];

    legPositions.forEach((legPosition, index) => {
      const leg = new THREE.Mesh(legGeometry, this.darkWoodMaterial);
      leg.name = `${this.id}-leg-${index + 1}`;
      leg.position.copy(legPosition);

      this.configureMesh(leg);

      this.object3D.add(leg);
    });
  }

  createShelf() {
    const shelfWidth = this.width - this.shelfInset * 2;
    const shelfDepth = this.depth - this.shelfInset * 2;
    const geometry = new THREE.BoxGeometry(shelfWidth, this.shelfThickness, shelfDepth);

    const shelf = new THREE.Mesh(geometry, this.interiorMaterial ?? this.woodMaterial);
    shelf.name = `${this.id}-shelf`;
    shelf.position.y = this.shelfHeight + this.shelfThickness / 2;

    this.configureMesh(shelf);

    this.object3D.add(shelf);
  }

  configureMesh(mesh) {
    mesh.castShadow = this.castShadow;
    mesh.receiveShadow = this.receiveShadow;

    if (mesh.geometry) {
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }
  }

  updateCollider() {
    this.object3D.updateMatrixWorld(true);
    this.collider = new THREE.Box3().setFromObject(this.object3D);

    return this.collider;
  }

  getCollider() {
    if (!this.createColliderEnabled) {
      return null;
    }

    return this.updateCollider();
  }

  setVisible(visible) {
    this.object3D.visible = visible;
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

        material.dispose();
        disposedMaterials.add(material);
      });
    });

    this.object3D.clear();
    this.collider = null;
  }
}

export { Table };
