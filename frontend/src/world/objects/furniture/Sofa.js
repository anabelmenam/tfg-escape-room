import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Entity } from "../Entity.js";
import { loadTexture } from "../helpers/loadTexture.js";

class Sofa extends Entity {
  constructor({
    id = "sofa",
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    seats = 3,
    width = 5,
    height = 2.2,
    depth = 2,
    color = 0x7a6659,
    texture = null,
    textureRepeat = {
      x: 1,
      y: 1,
    },
    legColor = 0x352116,
    castShadow = true,
    receiveShadow = true,
    createCollider = true,
  } = {}) {
    super(id);

    if (!Number.isInteger(seats) || seats < 1) {
      throw new Error(`Sofa "${id}" necesita un número de plazas entero mayor que 0.`);
    }

    if (width <= 0 || height <= 0 || depth <= 0) {
      throw new Error(`Sofa "${id}" necesita dimensiones mayores que cero.`);
    }

    this.seats = seats;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.castShadow = castShadow;
    this.receiveShadow = receiveShadow;
    this.createColliderEnabled = createCollider;
    this.armrestWidth = width * 0.085;
    this.armrestHeight = height * 0.55;
    this.armrestDepth = depth * 0.9;
    this.totalSeatWidth = width - this.armrestWidth * 2;
    this.seatGap = this.totalSeatWidth * 0.015;
    this.seatWidth = (this.totalSeatWidth - this.seatGap * (seats - 1)) / seats;
    this.seatDepth = depth * 0.72;
    this.baseHeight = height * 0.17;
    this.baseDepth = depth * 0.82;
    this.cushionThickness = height * 0.14;
    this.backCushionHeight = height * 0.48;
    this.backCushionThickness = depth * 0.15;
    this.backCushionTilt = -0.08;
    this.backStructureHeight = height * 0.52;
    this.backStructureThickness = depth * 0.12;
    this.legHeight = height * 0.09;
    this.legThickness = Math.min(width, height, depth) * 0.065;
    this.legInsetX = this.armrestWidth * 0.7;
    this.legInsetZ = depth * 0.12;
    this.roundedSegments = 4;
    this.baseRadius = height * 0.045;
    this.cushionRadius = height * 0.055;
    this.backCushionRadius = height * 0.055;
    this.armrestRadius = height * 0.06;
    this.backStructureRadius = height * 0.04;

    this.texture = texture
      ? loadTexture({
          path: texture,
          repeat: textureRepeat,
          colorTexture: true,
        })
      : null;

    this.sofaMaterial = new THREE.MeshStandardMaterial({
      color,
      map: this.texture,
      roughness: 0.85,
      metalness: 0,
    });

    this.legMaterial = new THREE.MeshStandardMaterial({
      color: legColor,
      roughness: 0.75,
      metalness: 0,
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

    this.collider = null;

    this.createSofa();

    this.object3D.updateMatrixWorld(true);

    if (this.createColliderEnabled) {
      this.updateCollider();
    }
  }

  createSofa() {
    this.createBase();
    this.createBackStructure();
    this.createSeatCushions();
    this.createBackCushions();
    this.createArmrests();
    this.createLegs();
  }

  getValidRadius(width, height, depth, requestedRadius) {
    const maximumRadius = Math.min(width, height, depth) / 2;
    return Math.max(0.001, Math.min(requestedRadius, maximumRadius * 0.9));
  }

  createRoundedGeometry({ width, height, depth, radius }) {
    const validRadius = this.getValidRadius(width, height, depth, radius);
    return new RoundedBoxGeometry(width, height, depth, this.roundedSegments, validRadius);
  }

  createBase() {
    const geometry = this.createRoundedGeometry({
      width: this.totalSeatWidth,
      height: this.baseHeight,
      depth: this.baseDepth,
      radius: this.baseRadius,
    });

    const base = new THREE.Mesh(geometry, this.sofaMaterial);
    base.name = `${this.id}-base`;
    base.position.set(0, this.legHeight + this.baseHeight / 2, 0);
    this.configureMesh(base);
    this.object3D.add(base);
  }

  createBackStructure() {
    const geometry = this.createRoundedGeometry({
      width: this.totalSeatWidth,
      height: this.backStructureHeight,
      depth: this.backStructureThickness,
      radius: this.backStructureRadius,
    });

    const back = new THREE.Mesh(geometry, this.sofaMaterial);
    back.name = `${this.id}-back-structure`;

    const seatTop = this.legHeight + this.baseHeight + this.cushionThickness;
    back.position.set(
      0,
      seatTop + this.backStructureHeight / 2 - this.cushionThickness * 0.35,
      -this.baseDepth / 2 + this.backStructureThickness / 2,
    );

    this.configureMesh(back);
    this.object3D.add(back);
  }

  createSeatCushions() {
    const startX = -this.totalSeatWidth / 2 + this.seatWidth / 2;
    const cushionDepth = this.seatDepth - this.backCushionThickness * 0.15;
    const cushionWidth = this.seatWidth - this.seatGap * 0.35;

    for (let index = 0; index < this.seats; index++) {
      const geometry = this.createRoundedGeometry({
        width: cushionWidth,
        height: this.cushionThickness,
        depth: cushionDepth,
        radius: this.cushionRadius,
      });

      const cushion = new THREE.Mesh(geometry, this.sofaMaterial);
      cushion.name = `${this.id}-seat-cushion-${index + 1}`;
      cushion.position.set(
        startX + index * (this.seatWidth + this.seatGap),
        this.legHeight + this.baseHeight + this.cushionThickness / 2,
        depthOffset(this.baseDepth, cushionDepth),
      );

      this.configureMesh(cushion);
      this.object3D.add(cushion);
    }
  }

  createBackCushions() {
    const startX = -this.totalSeatWidth / 2 + this.seatWidth / 2;
    const cushionWidth = this.seatWidth - this.seatGap * 0.35;
    const seatTop = this.legHeight + this.baseHeight + this.cushionThickness;

    for (let index = 0; index < this.seats; index++) {
      const geometry = this.createRoundedGeometry({
        width: cushionWidth,
        height: this.backCushionHeight,
        depth: this.backCushionThickness,
        radius: this.backCushionRadius,
      });

      const cushion = new THREE.Mesh(geometry, this.sofaMaterial);
      cushion.name = `${this.id}-back-cushion-${index + 1}`;

      cushion.position.set(
        startX + index * (this.seatWidth + this.seatGap),
        seatTop + this.backCushionHeight / 2 - this.height * 0.025,
        -this.seatDepth / 2 + this.backCushionThickness / 2 + this.depth * 0.055,
      );

      cushion.rotation.x = this.backCushionTilt;

      this.configureMesh(cushion);
      this.object3D.add(cushion);
    }
  }

  createArmrests() {
    const geometry = this.createRoundedGeometry({
      width: this.armrestWidth,
      height: this.armrestHeight,
      depth: this.armrestDepth,
      radius: this.armrestRadius,
    });

    const x = this.width / 2 - this.armrestWidth / 2;
    const y = this.legHeight + this.armrestHeight / 2;
    const positions = [new THREE.Vector3(-x, y, 0), new THREE.Vector3(x, y, 0)];

    positions.forEach((armrestPosition, index) => {
      const armrest = new THREE.Mesh(geometry, this.sofaMaterial);
      armrest.name = `${this.id}-armrest-${index + 1}`;
      armrest.position.copy(armrestPosition);
      this.configureMesh(armrest);
      this.object3D.add(armrest);
    });
  }

  createLegs() {
    const geometry = new THREE.BoxGeometry(this.legThickness, this.legHeight, this.legThickness);
    const x = this.width / 2 - this.armrestWidth - this.legInsetX;
    const z = this.baseDepth / 2 - this.legInsetZ;
    const y = this.legHeight / 2;

    const positions = [
      new THREE.Vector3(-x, y, -z),
      new THREE.Vector3(x, y, -z),
      new THREE.Vector3(-x, y, z),
      new THREE.Vector3(x, y, z),
    ];

    positions.forEach((legPosition, index) => {
      const leg = new THREE.Mesh(geometry, this.legMaterial);
      leg.name = `${this.id}-leg-${index + 1}`;
      leg.position.copy(legPosition);
      this.configureMesh(leg);
      this.object3D.add(leg);
    });
  }

  configureMesh(mesh) {
    mesh.castShadow = this.castShadow;
    mesh.receiveShadow = this.receiveShadow;
    mesh.geometry?.computeBoundingBox();
    mesh.geometry?.computeBoundingSphere();
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

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getDepth() {
    return this.depth;
  }

  getSeatCount() {
    return this.seats;
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

    this.collider = null;
    this.texture = null;
  }
}

function depthOffset(baseDepth, cushionDepth) {
  return (baseDepth - cushionDepth) / 2 - baseDepth * 0.03;
}

export { Sofa };
