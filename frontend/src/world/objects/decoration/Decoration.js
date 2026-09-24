import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { loadTexture } from "../helpers/loadTexture.js";
import { Entity } from "../Entity.js";

const gltfLoader = new GLTFLoader();
const modelCache = new Map();

class Decoration extends Entity {
  constructor({
    id,
    modelPath,

    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    rotationY = 0,
    scale = 1,

    color = null,
    texture = null,
    textureRepeat = { x: 1, y: 1 },

    roughness = null,
    metalness = null,

    castShadow = true,
    receiveShadow = true,

    createCollider = false,
  } = {}) {
    super(id);

    if (!modelPath) {
      throw new Error(`Decoration "${id ?? "sin id"}" necesita un modelPath.`);
    }

    this.modelPath = modelPath;

    this.color = color;
    this.texture = texture;
    this.textureRepeat = textureRepeat;
    this.roughness = roughness;
    this.metalness = metalness;

    this.castShadow = castShadow;
    this.receiveShadow = receiveShadow;
    this.createColliderEnabled = createCollider;

    this.object3D = new THREE.Group();
    this.object3D.name = id ?? "decoration";

    this.object3D.position.copy(position);

    this.object3D.rotation.copy(rotation);
    this.object3D.rotation.y += rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }

    this.model = null;
    this.collider = null;
    this.loaded = false;

    this.loadPromise = this.loadModel();
  }

  async loadModel() {
    try {
      const model = await this.getModel(this.modelPath);

      this.model = model;
      this.model.name = `${this.id ?? "decoration"}-model`;

      this.configureModel(this.model);

      this.object3D.add(this.model);
      this.object3D.updateMatrixWorld(true);

      if (this.createColliderEnabled) {
        this.updateCollider();
      }

      this.loaded = true;

      return this;
    } catch (error) {
      console.error(`No se pudo cargar la decoración "${this.id}" desde ${this.modelPath}`, error);

      throw error;
    }
  }

  async getModel(path) {
    if (!modelCache.has(path)) {
      modelCache.set(path, gltfLoader.loadAsync(path));
    }

    const gltf = await modelCache.get(path);

    return gltf.scene.clone(true);
  }

  configureModel(model) {
    const customTexture = loadTexture({
      path: this.texture,
      repeat: this.textureRepeat,

      flipY: false,
    });

    model.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = this.castShadow;
      child.receiveShadow = this.receiveShadow;

      child.material = this.configureMaterials(child.material, customTexture);

      if (child.geometry) {
        child.geometry.computeBoundingBox();
        child.geometry.computeBoundingSphere();
      }
    });
  }

  configureMaterials(material, customTexture) {
    if (Array.isArray(material)) {
      return material.map((currentMaterial) => this.configureMaterial(currentMaterial, customTexture));
    }

    return this.configureMaterial(material, customTexture);
  }

  configureMaterial(material, customTexture) {
    if (!material) {
      return new THREE.MeshStandardMaterial({
        color: this.color ?? 0xffffff,
        map: customTexture,
        roughness: this.roughness ?? 0.8,
        metalness: this.metalness ?? 0,
      });
    }

    const configuredMaterial = material.clone();

    if (this.color !== null && configuredMaterial.color) {
      configuredMaterial.color.set(this.color);
    }

    if (customTexture) {
      configuredMaterial.map = customTexture;
    }

    if (this.roughness !== null && "roughness" in configuredMaterial) {
      configuredMaterial.roughness = this.roughness;
    }

    if (this.metalness !== null && "metalness" in configuredMaterial) {
      configuredMaterial.metalness = this.metalness;
    }

    configuredMaterial.needsUpdate = true;

    return configuredMaterial;
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

  async load() {
    return this.loadPromise;
  }

  isLoaded() {
    return this.loaded;
  }

  setVisible(visible) {
    this.object3D.visible = visible;
  }

  setPosition(position) {
    this.object3D.position.copy(position);

    if (this.createColliderEnabled && this.loaded) {
      this.updateCollider();
    }
  }

  setRotation({ x = this.object3D.rotation.x, y = this.object3D.rotation.y, z = this.object3D.rotation.z } = {}) {
    this.object3D.rotation.set(x, y, z);

    if (this.createColliderEnabled && this.loaded) {
      this.updateCollider();
    }
  }

  setScale(scale) {
    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }

    if (this.createColliderEnabled && this.loaded) {
      this.updateCollider();
    }
  }
}

export { Decoration };
