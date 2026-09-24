import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Entity } from "../Entity.js";
import { loadTexture } from "../helpers/loadTexture.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Carpet extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,

    width = 5,
    depth = 7,
    thickness = 0.08,
    cornerRadius = 0.15,

    color = 0xffffff,
    sideColor = 0x6b4226,

    texture = null,
    textureRepeat = {
      x: 1,
      y: 1,
    },

    normalMap = null,
    roughnessMap = null,

    roughness = 0.95,
    metalness = 0,

    hasFringes = false,
    fringeColor = null,
    fringeLength = 0.25,
    fringeThickness = 0.025,
    fringeSpacing = 0.12,
    onLift = null,
  } = {}) {
    super(id);

    this.width = width;
    this.depth = depth;
    this.thickness = thickness;
    this.cornerRadius = cornerRadius;

    this.hasFringes = hasFringes;
    this.fringeColor = fringeColor ?? sideColor;
    this.fringeLength = fringeLength;
    this.fringeThickness = fringeThickness;
    this.fringeSpacing = fringeSpacing;
    this.onLift = onLift;
    this.isLifted = false;
    this.liftProgress = 0;

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.textureLoader = new THREE.TextureLoader();

    this.createMaterials({
      color,
      sideColor,

      texture,
      textureRepeat,

      normalMap,
      roughnessMap,

      roughness,
      metalness,
    });

    this.createRug();
  }

  createMaterials({
    color,
    sideColor,

    texture,
    textureRepeat,

    normalMap,
    roughnessMap,

    roughness,
    metalness,
  }) {
    const colorTexture = loadTexture({
      path: texture,
      repeat: textureRepeat,
      colorSpace: THREE.SRGBColorSpace,
    });

    const loadedNormalMap = loadTexture({
      path: normalMap,
      repeat: textureRepeat,
    });

    const loadedRoughnessMap = loadTexture({
      path: roughnessMap,
      repeat: textureRepeat,
    });

    this.topMaterial = new THREE.MeshStandardMaterial({
      color,
      map: colorTexture,
      normalMap: loadedNormalMap,
      roughnessMap: loadedRoughnessMap,
      roughness,
      metalness,
      side: THREE.DoubleSide,
    });

    this.sideMaterial = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 1,
      metalness: 0,
    });

    this.fringeMaterial = new THREE.MeshStandardMaterial({
      color: this.fringeColor,
      roughness: 1,
      metalness: 0,
    });
  }

  createRug() {

    this.rugPivot = new THREE.Group();
    this.rugPivot.position.set(-this.width / 2, 0, -this.depth / 2);
    this.object3D.add(this.rugPivot);
    this.createTop();

    if (this.hasFringes) {
      this.createFringes();
    }
  }

  interact() {
    this.isLifted = !this.isLifted;
    this.onLift?.(this.isLifted, this);
  }

  update(delta) {
    this.liftProgress = THREE.MathUtils.damp(this.liftProgress, this.isLifted ? 1 : 0, 7, delta);
    this.deformLiftedCorner();
  }

  deformLiftedCorner() {
    if (!this.topGeometry || !this.topBasePositions) {
      return;
    }

    const positions = this.topGeometry.attributes.position;
    const halfWidth = (this.width - 0.02) / 2;
    const halfDepth = (this.depth - 0.02) / 2;

    for (let index = 0; index < positions.count; index += 1) {
      const x = this.topBasePositions[index * 3];
      const z = this.topBasePositions[index * 3 + 1];
      const nearLiftedCornerX = THREE.MathUtils.clamp((x + halfWidth) / (halfWidth * 2), 0, 1);
      const nearLiftedCornerZ = THREE.MathUtils.clamp((z + halfDepth) / (halfDepth * 2), 0, 1);

      const cornerWeight = nearLiftedCornerX ** 3 * nearLiftedCornerZ ** 3;

      positions.setZ(index, this.liftProgress * 1.05 * cornerWeight);
    }

    positions.needsUpdate = true;
    this.topGeometry.computeVertexNormals();
  }

  getInteractionText() {
    return this.isLifted ? tInteraction("lower", tItem("carpet")) : tInteraction("lift", tItem("carpet"));
  }

  createBase() {
    const maximumRadius = Math.min(this.width, this.depth, this.thickness) / 2;

    const resolvedRadius = Math.min(this.cornerRadius, maximumRadius);

    const geometry = new RoundedBoxGeometry(this.width, this.thickness, this.depth, 4, resolvedRadius);

    const base = new THREE.Mesh(geometry, this.sideMaterial);

    base.name = `${this.id}-base`;

    base.position.set(this.width / 2, this.thickness / 2, this.depth / 2);

    base.castShadow = true;
    base.receiveShadow = true;

    this.rugPivot.add(base);
  }

  createTop() {

    const geometry = new THREE.PlaneGeometry(this.width - 0.02, this.depth - 0.02, 24, 24);

    const top = new THREE.Mesh(geometry, this.topMaterial);

    top.name = `${this.id}-top`;

    top.rotation.x = -Math.PI / 2;

    top.position.set(this.width / 2, this.thickness + 0.003, this.depth / 2);

    top.receiveShadow = true;

    this.topGeometry = geometry;
    this.topBasePositions = geometry.attributes.position.array.slice();
    this.rugPivot.add(top);
  }

  createFringes() {
    const numberOfFringes = Math.max(2, Math.floor(this.width / this.fringeSpacing));

    const actualSpacing = this.width / numberOfFringes;

    for (let index = 0; index < numberOfFringes; index += 1) {
      const x = -this.width / 2 + actualSpacing / 2 + index * actualSpacing;

      const frontFringe = this.createFringe({
        x,
        z: this.depth / 2 + this.fringeLength / 2,
      });

      const rearFringe = this.createFringe({
        x,
        z: -this.depth / 2 - this.fringeLength / 2,
      });

      this.rugPivot.add(frontFringe, rearFringe);
    }
  }

  createFringe({ x, z }) {
    const geometry = new THREE.BoxGeometry(this.fringeThickness, this.fringeThickness, this.fringeLength);

    const fringe = new THREE.Mesh(geometry, this.fringeMaterial);

    fringe.position.set(x + this.width / 2, this.fringeThickness / 2, z + this.depth / 2);

    fringe.castShadow = true;
    fringe.receiveShadow = true;

    return fringe;
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);

    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Carpet };
