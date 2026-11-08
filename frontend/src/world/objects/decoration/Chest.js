import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Entity } from "../Entity.js";
import { loadTexture } from "../helpers/loadTexture.js";
import { tInteraction, tItem } from "../../../translations/index.js";
class Chest extends Entity {
  constructor({
    id = "chest",
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    width = 2.5,
    height = 1.5,
    depth = 1.5,
    color = 0x76502f,
    texture = null,
    textureRepeat = {
      x: 1,
      y: 1,
    },
    initiallyOpen = false,
    locked = false,
    requiredKey = null,
    requiredPassword = null,
    castShadow = true,
    receiveShadow = true,
    createCollider = true,
    onOpenChange = null,
  } = {}) {
    super(id);

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.bodyHeight = height * 0.68;
    this.lidHeight = height - this.bodyHeight;
    this.wallThickness = Math.min(width, height, depth) * 0.06;
    this.bandWidth = width * 0.055;
    this.bandThickness = Math.min(this.width, this.height, this.depth) * 0.025;
    this.openAngle = Math.PI * 0.32;
    this.openingSpeed = 5;
    this.isOpen = initiallyOpen;
    this.targetOpen = initiallyOpen;
    this.locked = locked;
    this.requiredKey = requiredKey;
    this.requiredPassword = requiredPassword;
    this.castShadow = castShadow;
    this.receiveShadow = receiveShadow;
    this.createColliderEnabled = createCollider;
    this.onOpenChange = onOpenChange;
    this.contents = new Map();

    this.texture = texture
      ? loadTexture({
          path: texture,
          repeat: textureRepeat,
          colorTexture: true,
        })
      : null;

    this.woodMaterial = new THREE.MeshStandardMaterial({
      color,
      map: this.texture,
      roughness: 0.75,
      metalness: 0,
    });

    this.interiorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f2118,
      roughness: 0.9,
      metalness: 0,
    });

    this.metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x292725,
      roughness: 0.45,
      metalness: 0.75,
    });

    this.lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xa17c35,
      roughness: 0.4,
      metalness: 0.8,
    });

    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.name = `${id}-body`;
    this.lidPivot = new THREE.Group();
    this.lidPivot.name = `${id}-lid-pivot`;
    this.lidGroup = new THREE.Group();
    this.lidGroup.name = `${id}-lid`;

    this.contentContainer = new THREE.Group();
    this.contentContainer.name = `${id}-content-container`;

    this.collider = null;

    this.createChest();

    this.lidPivot.rotation.x = this.isOpen ? -this.openAngle : 0;
    this.object3D.updateMatrixWorld(true);

    if (this.createColliderEnabled) {
      this.updateCollider();
    }
  }

  createChest() {
    this.createBody();
    this.createInterior();
    this.createLid();
    this.createBodyBands();
    this.createHinges();
    this.createLock();

    this.object3D.add(this.bodyGroup);
    this.object3D.add(this.lidPivot);

    this.contentContainer.position.y = this.wallThickness + 0.02;
    this.object3D.add(this.contentContainer);
  }

  createRoundedGeometry(width, height, depth, radius) {
    const maximumRadius = Math.min(width, height, depth) / 2;
    const validRadius = Math.max(0.001, Math.min(radius, maximumRadius * 0.9));
    return new RoundedBoxGeometry(width, height, depth, 4, validRadius);
  }

  createBody() {
    const radius = Math.min(this.width, this.bodyHeight, this.depth) * 0.04;
    const bottom = new THREE.Mesh(
      this.createRoundedGeometry(this.width, this.wallThickness, this.depth, radius),
      this.woodMaterial,
    );
    bottom.name = `${this.id}-bottom`;
    bottom.position.y = this.wallThickness / 2;
    this.configureMesh(bottom);
    this.bodyGroup.add(bottom);

    const wallHeight = this.bodyHeight - this.wallThickness;
    const wallY = this.wallThickness + wallHeight / 2;
    const sideDepth = this.depth - this.wallThickness * 2;
    const sideGeometry = this.createRoundedGeometry(this.wallThickness, wallHeight, sideDepth, radius);
    const leftWall = new THREE.Mesh(sideGeometry, this.woodMaterial);
    leftWall.name = `${this.id}-left-wall`;
    leftWall.position.set(-this.width / 2 + this.wallThickness / 2, wallY, 0);

    const rightWall = new THREE.Mesh(sideGeometry, this.woodMaterial);
    rightWall.name = `${this.id}-right-wall`;
    rightWall.position.set(this.width / 2 - this.wallThickness / 2, wallY, 0);

    const frontBackGeometry = this.createRoundedGeometry(this.width, wallHeight, this.wallThickness, radius);

    const frontWall = new THREE.Mesh(frontBackGeometry, this.woodMaterial);
    frontWall.name = `${this.id}-front-wall`;
    frontWall.position.set(0, wallY, this.depth / 2 - this.wallThickness / 2);

    const backWall = new THREE.Mesh(frontBackGeometry, this.woodMaterial);
    backWall.name = `${this.id}-back-wall`;
    backWall.position.set(0, wallY, -this.depth / 2 + this.wallThickness / 2);

    [leftWall, rightWall, frontWall, backWall].forEach((wall) => {
      this.configureMesh(wall);
      this.bodyGroup.add(wall);
    });
  }

  createInterior() {
    const width = this.width - this.wallThickness * 2;
    const depth = this.depth - this.wallThickness * 2;
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floor = new THREE.Mesh(floorGeometry, this.interiorMaterial);

    floor.name = `${this.id}-interior-floor`;
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = this.wallThickness + 0.005;

    this.configureMesh(floor);
    this.bodyGroup.add(floor);

    const innerHeight = this.bodyHeight - this.wallThickness;
    const innerY = this.wallThickness + innerHeight / 2;

    const sideGeometry = new THREE.PlaneGeometry(depth, innerHeight);
    const leftInterior = new THREE.Mesh(sideGeometry, this.interiorMaterial);
    leftInterior.name = `${this.id}-interior-left`;
    leftInterior.rotation.y = Math.PI / 2;
    leftInterior.position.set(-this.width / 2 + this.wallThickness + 0.005, innerY, 0);

    const rightInterior = new THREE.Mesh(sideGeometry, this.interiorMaterial);
    rightInterior.name = `${this.id}-interior-right`;
    rightInterior.rotation.y = -Math.PI / 2;
    rightInterior.position.set(this.width / 2 - this.wallThickness - 0.005, innerY, 0);

    const frontBackGeometry = new THREE.PlaneGeometry(width, innerHeight);
    const frontInterior = new THREE.Mesh(frontBackGeometry, this.interiorMaterial);
    frontInterior.name = `${this.id}-interior-front`;
    frontInterior.rotation.y = Math.PI;
    frontInterior.position.set(0, innerY, this.depth / 2 - this.wallThickness - 0.005);

    const backInterior = new THREE.Mesh(frontBackGeometry, this.interiorMaterial);
    backInterior.name = `${this.id}-interior-back`;
    backInterior.position.set(0, innerY, -this.depth / 2 + this.wallThickness + 0.005);

    [leftInterior, rightInterior, frontInterior, backInterior].forEach((interiorWall) => {
      this.configureMesh(interiorWall);
      this.bodyGroup.add(interiorWall);
    });
  }

  createCurvedLidGeometry() {
    const radius = this.depth / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-radius, 0);
    shape.lineTo(radius, 0);
    shape.absarc(0, 0, radius, 0, Math.PI, false);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: this.width,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 3,
    });

    geometry.rotateY(Math.PI / 2);
    geometry.computeBoundingBox();

    const boundingBox = geometry.boundingBox;

    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    geometry.translate(-center.x, -boundingBox.min.y, -center.z);

    return geometry;
  }

  createLid() {
    this.lidPivot.position.set(0, this.bodyHeight, -this.depth / 2);
    this.lidGroup.position.z = this.depth / 2;

    const geometry = this.createCurvedLidGeometry();

    const lid = new THREE.Mesh(geometry, this.woodMaterial);
    lid.name = `${this.id}-lid`;
    lid.scale.y = this.lidHeight / (this.depth / 2);
    this.configureMesh(lid);
    this.lidGroup.add(lid);
    this.lidPivot.add(this.lidGroup);
    this.lid = lid;
  }

  createBodyBands() {
    const positions = [-this.width * 0.32, this.width * 0.32];
    const bandDepth = this.bandThickness;
    const frontZ = this.depth / 2 + bandDepth / 2;
    const backZ = -this.depth / 2 - bandDepth / 2;
    const bottomY = -bandDepth / 2;

    positions.forEach((x, index) => {
      const frontGeometry = new THREE.BoxGeometry(this.bandWidth, this.bodyHeight, bandDepth);
      const frontBand = new THREE.Mesh(frontGeometry, this.metalMaterial);
      frontBand.name = `${this.id}-body-band-front-${index + 1}`;
      frontBand.position.set(x, this.bodyHeight / 2, frontZ);

      const backGeometry = new THREE.BoxGeometry(this.bandWidth, this.bodyHeight, bandDepth);
      const backBand = new THREE.Mesh(backGeometry, this.metalMaterial);
      backBand.name = `${this.id}-body-band-back-${index + 1}`;
      backBand.position.set(x, this.bodyHeight / 2, backZ);

      const bottomGeometry = new THREE.BoxGeometry(this.bandWidth, bandDepth, this.depth + bandDepth * 2);
      const bottomBand = new THREE.Mesh(bottomGeometry, this.metalMaterial);
      bottomBand.name = `${this.id}-body-band-bottom-${index + 1}`;
      bottomBand.position.set(x, bottomY, 0);

      [frontBand, backBand, bottomBand].forEach((band) => {
        this.configureMesh(band);
        this.bodyGroup.add(band);
      });
    });
  }

  createHinges() {
    const width = this.width * 0.13;
    const height = this.height * 0.05;
    const depth = this.depth * 0.07;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const positions = [-this.width * 0.28, this.width * 0.28];

    positions.forEach((x, index) => {
      const hinge = new THREE.Mesh(geometry, this.metalMaterial);
      hinge.name = `${this.id}-hinge-${index + 1}`;
      hinge.position.set(x, this.bodyHeight - height / 2, -this.depth / 2 - depth / 2);
      this.configureMesh(hinge);
      this.bodyGroup.add(hinge);
    });
  }

  createLock() {
    const width = this.width * 0.16;
    const height = this.bodyHeight * 0.28;
    const depth = this.depth * 0.045;

    const geometry = this.createRoundedGeometry(width, height, depth, Math.min(width, height) * 0.1);
    const lock = new THREE.Mesh(geometry, this.lockMaterial);
    lock.name = `${this.id}-lock`;
    lock.position.set(0, this.bodyHeight * 0.72, this.depth / 2 + depth / 2);

    this.configureMesh(lock);
    this.bodyGroup.add(lock);

    const keyholeGeometry = new THREE.CircleGeometry(width * 0.09, 12);
    const keyholeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 1,
      metalness: 0,
    });

    const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial);
    keyhole.name = `${this.id}-keyhole`;
    keyhole.position.set(0, this.bodyHeight * 0.72, this.depth / 2 + depth + 0.003);
    this.configureMesh(keyhole);
    this.bodyGroup.add(keyhole);
  }

  configureMesh(mesh) {
    mesh.castShadow = this.castShadow;
    mesh.receiveShadow = this.receiveShadow;
    mesh.geometry?.computeBoundingBox();
    mesh.geometry?.computeBoundingSphere();
  }

  interact(context = {}) {
    return this.toggle(context);
  }

  toggle({ inventory = null } = {}) {
    if (this.targetOpen) {
      return this.close();
    }

    return this.open({ inventory });
  }

  open({ inventory = null } = {}) {
    if (this.locked) {
      const hasKey = this.inventoryHasItem(inventory, this.requiredKey);

      if (!hasKey) {
        return {
          success: false,
          reason: "locked",
          requiredKey: this.requiredKey,
        };
      }

      inventory.remove(this.requiredKey);
      this.unlock();
    }

    this.targetOpen = true;

    return {
      success: true,
      action: "opening",
    };
  }

  close() {
    this.targetOpen = false;

    return {
      success: true,
      action: "closing",
    };
  }

  inventoryHasItem(inventory, itemId) {
    if (!inventory || !itemId) {
      return false;
    }

    return inventory.hasSelected(itemId);
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
    const nextAngle = THREE.MathUtils.damp(this.lidPivot.rotation.x, targetAngle, this.openingSpeed, delta);
    this.lidPivot.rotation.x = nextAngle;

    if (Math.abs(nextAngle - targetAngle) > 0.001) {
      return;
    }

    this.lidPivot.rotation.x = targetAngle;

    const previousState = this.isOpen;
    this.isOpen = this.targetOpen;

    if (previousState !== this.isOpen) {
      this.onOpenChange?.({
        chest: this,
        isOpen: this.isOpen,
      });
    }
  }

  addItem(
    item,
    {
      position = new THREE.Vector3(0, this.wallThickness + 0.15, 0),
      rotation = null,
      scale = null,
      visible = true,
    } = {},
  ) {
    if (!item) {
      return false;
    }

    const object3D = item.object3D ?? (item.isObject3D ? item : null);

    if (!object3D) {
      return false;
    }

    const itemId = item.id ?? object3D.name;

    if (!itemId) {
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

      if (targetParent) {
        targetParent.add(object3D);
      }
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

  getInteractionText() {
    if (this.isOpen) {
      return tInteraction("close", tItem("chest"));
    }
    if (this.locked && (this.requiredKey || this.requiredPassword)) {
      return tInteraction("needItem", tItem(this.requiredKey ? this.requiredKey : this.requiredPassword));
    } else if (this.locked) {
      return tInteraction("locked");
    }
    return tInteraction("open", tItem("chest"));
  }

  updateCollider() {
    this.object3D.updateMatrixWorld(true);

    const lidVisible = this.lidPivot.visible;

    const contentVisible = this.contentContainer.visible;
    this.lidPivot.visible = false;
    this.contentContainer.visible = false;
    this.object3D.updateMatrixWorld(true);
    this.collider = new THREE.Box3().setFromObject(this.object3D);
    this.lidPivot.visible = lidVisible;
    this.contentContainer.visible = contentVisible;
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
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    this.object3D.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      if (child.geometry && !geometries.has(child.geometry)) {
        child.geometry.dispose();
        geometries.add(child.geometry);
      }

      const childMaterials = Array.isArray(child.material) ? child.material : [child.material];

      childMaterials.forEach((material) => {
        if (!material || materials.has(material)) {
          return;
        }

        if (material.map && !textures.has(material.map)) {
          material.map.dispose();
          textures.add(material.map);
        }

        material.dispose();
        materials.add(material);
      });
    });

    this.object3D.clear();
    this.contents.clear();

    this.collider = null;
    this.texture = null;
  }
}

export { Chest };
