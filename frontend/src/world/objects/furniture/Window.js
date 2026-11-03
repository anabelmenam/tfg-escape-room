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
    hasCurtains = true,
    curtainColor = 0x9a745f,
    curtainRodColor = 0x554438,
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
    this.hasCurtains = hasCurtains;

    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.userData.ambientDescriptionKey = "window";
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.createMaterials({
      frameColor,
      glassColor,
      glassOpacity,
      curtainColor,
      curtainRodColor,
    });

    this.createWindow();
  }

  createMaterials({ frameColor, glassColor, glassOpacity, curtainColor, curtainRodColor }) {
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

    this.curtainMaterial = new THREE.MeshStandardMaterial({
      color: curtainColor,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    this.curtainRodMaterial = new THREE.MeshStandardMaterial({
      color: curtainRodColor,
      roughness: 0.36,
      metalness: 0.5,
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

    if (this.hasCurtains) {
      this.createCurtains();
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

  createCurtains() {
    const insideZ = this.depth / 2 + 0.13;
    const rodY = this.height / 2 + 0.34;
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, this.width + 1.05, 18),
      this.curtainRodMaterial,
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, rodY, insideZ);
    rod.castShadow = true;
    this.object3D.add(rod);

    [-1, 1].forEach((side) => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), this.curtainRodMaterial);
      finial.position.set(side * (this.width / 2 + 0.52), rodY, insideZ);
      finial.castShadow = true;
      this.object3D.add(finial);
    });

    const panelWidth = Math.max(0.75, this.width * 0.24);
    const panelHeight = this.height + 0.48;
    [-1, 1].forEach((side) => {
      const geometry = new THREE.PlaneGeometry(panelWidth, panelHeight, 12, 18);
      const positions = geometry.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        const localX = positions.getX(index);
        const wave = Math.cos((localX / panelWidth + 0.5) * Math.PI * 7) * 0.075;
        positions.setZ(index, wave);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      const panel = new THREE.Mesh(geometry, this.curtainMaterial);
      const panelX = side * (this.width / 2 - panelWidth / 2 + 0.06);
      panel.position.set(panelX, 0.22, insideZ + 0.04);
      panel.castShadow = true;
      panel.receiveShadow = true;
      this.object3D.add(panel);
    });
  }

  setGlassVisible(visible) {
    if (this.glass) {
      this.glass.visible = visible;
    }
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3(
      new THREE.Vector3(-this.width / 2, -this.height / 2, -this.depth / 2),
      new THREE.Vector3(this.width / 2, this.height / 2, this.depth / 2),
    ).applyMatrix4(this.object3D.matrixWorld);
  }
}

export { Window };
