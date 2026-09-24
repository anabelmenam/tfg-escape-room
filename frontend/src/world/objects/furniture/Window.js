import * as THREE from "three";
import { Entity } from "../Entity.js";
import createBox from "../helpers/createBox.js";

class Window extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,

    width = 5,
    height = 4,
    depth = 0.45,

    frameThickness = 0.18,

    columns = 2,
    rows = 1,

    frameColor = 0x5a321d,
    glassColor = 0xa8d8e8,
    glassOpacity = 0.25,

    hasGlass = true,
    hasCrossbars = true,
  } = {}) {
    super(id);

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.frameThickness = frameThickness;

    this.columns = Math.max(1, columns);
    this.rows = Math.max(1, rows);

    this.hasGlass = hasGlass;
    this.hasCrossbars = hasCrossbars;

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.createMaterials({
      frameColor,
      glassColor,
      glassOpacity,
    });

    this.createWindow();
  }

  createMaterials({ frameColor, glassColor, glassOpacity }) {
    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.72,
      metalness: 0.02,
    });

    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: glassColor,

      transparent: true,
      opacity: glassOpacity,

      roughness: 0.08,
      metalness: 0,

      transmission: 0.65,
      thickness: 0.05,

      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  createWindow() {
    this.createOuterFrame();

    if (this.hasCrossbars) {
      this.createCrossbars();
    }

    if (this.hasGlass) {
      this.createGlass();
    }
  }

  createOuterFrame() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    const leftFrame = createBox({
      width: this.frameThickness,
      height: this.height,
      depth: this.depth,
      position: new THREE.Vector3(-halfWidth + this.frameThickness / 2, 0, 0),
      material: this.frameMaterial,
    });

    const rightFrame = createBox({
      width: this.frameThickness,
      height: this.height,
      depth: this.depth,
      position: new THREE.Vector3(halfWidth - this.frameThickness / 2, 0, 0),
      material: this.frameMaterial,
    });

    const topFrame = createBox({
      width: this.width - this.frameThickness * 2,
      height: this.frameThickness,
      depth: this.depth,
      position: new THREE.Vector3(0, halfHeight - this.frameThickness / 2, 0),
      material: this.frameMaterial,
    });

    const bottomFrame = createBox({
      width: this.width - this.frameThickness * 2,
      height: this.frameThickness,
      depth: this.depth,
      position: new THREE.Vector3(0, -halfHeight + this.frameThickness / 2, 0),
      material: this.frameMaterial,
    });

    this.object3D.add(leftFrame, rightFrame, topFrame, bottomFrame);
  }

  createCrossbars() {
    const innerWidth = this.width - this.frameThickness * 2;

    const innerHeight = this.height - this.frameThickness * 2;

    for (let column = 1; column < this.columns; column += 1) {
      const x = -innerWidth / 2 + (innerWidth / this.columns) * column;

      const verticalBar = createBox({
        width: this.frameThickness,
        height: innerHeight,
        depth: this.depth,
        position: new THREE.Vector3(x, 0, 0),
        material: this.frameMaterial,
      });

      this.object3D.add(verticalBar);
    }

    for (let row = 1; row < this.rows; row += 1) {
      const y = -innerHeight / 2 + (innerHeight / this.rows) * row;

      const horizontalBar = createBox({
        width: innerWidth,
        height: this.frameThickness,
        depth: this.depth,
        position: new THREE.Vector3(0, y, 0),
        material: this.frameMaterial,
      });

      this.object3D.add(horizontalBar);
    }
  }

  createGlass() {
    const glassWidth = this.width - this.frameThickness * 2;

    const glassHeight = this.height - this.frameThickness * 2;

    const glassGeometry = new THREE.BoxGeometry(glassWidth, glassHeight, 0.04);

    this.glass = new THREE.Mesh(glassGeometry, this.glassMaterial);

    this.glass.name = `${this.id}-glass`;

    this.glass.position.z = 0.01;

    this.glass.castShadow = false;
    this.glass.receiveShadow = false;

    this.glass.renderOrder = 1;

    this.object3D.add(this.glass);
  }

  setGlassVisible(visible) {
    if (this.glass) {
      this.glass.visible = visible;
    }
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);

    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Window };
