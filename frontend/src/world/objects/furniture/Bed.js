import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Entity } from "../Entity.js";
class Bed extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    size = "double",
    woodColor = 0x5b3a29,
    headboardColor = woodColor,
    mattressColor = 0xe8e8e8,
    blanketColor = 0x556b8d,
    pillowColor = 0xffffff,
    woodTexture = null,
    headboardTexture = null,
    mattressTexture = null,
    blanketTexture = null,
    pillowTexture = null,
    woodTextureRepeat = { x: 1, y: 1 },
    headboardTextureRepeat = { x: 1, y: 1 },
    mattressTextureRepeat = { x: 1, y: 1 },
    blanketTextureRepeat = { x: 2, y: 2 },
    pillowTextureRepeat = { x: 1, y: 1 },
  } = {}) {
    super(id);
    if (!["single", "double"].includes(size)) {
      throw new Error(`Tamaño de cama no válido: ${size}`);
    }
    this.bedSize = size;
    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.setScalar(scale);

    this.textureLoader = new THREE.TextureLoader();

    this.settings = {
      woodColor,
      headboardColor,
      mattressColor,
      blanketColor,
      pillowColor,

      woodTexture,
      headboardTexture,
      mattressTexture,
      blanketTexture,
      pillowTexture,

      woodTextureRepeat,
      headboardTextureRepeat,
      mattressTextureRepeat,
      blanketTextureRepeat,
      pillowTextureRepeat,
    };

    this.createMaterials();
    this.create();
  }

  loadTexture(path, repeat = { x: 1, y: 1 }) {
    if (!path) {
      return null;
    }

    const texture = this.textureLoader.load(path, undefined, undefined, (error) => {
      console.error(`No se pudo cargar la textura de la cama: ${path}`, error);
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat.x ?? 1, repeat.y ?? 1);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
  }

  createMaterials() {
    const {
      woodColor,
      headboardColor,
      mattressColor,
      blanketColor,
      pillowColor,
      woodTexture,
      headboardTexture,
      mattressTexture,
      blanketTexture,
      pillowTexture,
      woodTextureRepeat,
      headboardTextureRepeat,
      mattressTextureRepeat,
      blanketTextureRepeat,
      pillowTextureRepeat,
    } = this.settings;

    this.woodMaterial = new THREE.MeshStandardMaterial({
      color: woodColor,
      map: this.loadTexture(woodTexture, woodTextureRepeat),
      roughness: 0.8,
    });

    this.headboardMaterial = new THREE.MeshStandardMaterial({
      color: headboardColor,
      map: this.loadTexture(
        headboardTexture ?? woodTexture,
        headboardTexture ? headboardTextureRepeat : woodTextureRepeat,
      ),
      roughness: 0.8,
    });

    this.mattressMaterial = new THREE.MeshStandardMaterial({
      color: mattressColor,
      map: this.loadTexture(mattressTexture, mattressTextureRepeat),
      roughness: 0.9,
    });

    this.blanketMaterial = new THREE.MeshStandardMaterial({
      color: blanketColor,
      map: this.loadTexture(blanketTexture, blanketTextureRepeat),
      roughness: 0.95,
    });

    this.pillowMaterial = new THREE.MeshStandardMaterial({
      color: pillowColor,
      map: this.loadTexture(pillowTexture, pillowTextureRepeat),
      roughness: 1,
    });
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);

    return new THREE.Box3().setFromObject(this.object3D);
  }

  createBox({ name, size, position, material }) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);

    mesh.name = name;
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  createRoundedBox({ name, size, position, material, radius = 0.08 }) {
    const geometry = new RoundedBoxGeometry(size.x, size.y, size.z, 4, radius);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  create() {
    const single = this.bedSize === "single";
    const baseWidth = single ? 3.4 : 6.2;
    const mattressWidth = single ? 3.1 : 5.9;
    const blanketWidth = single ? 3.4 : 6.2;
    const blanketSideX = single ? 1.62 : 3.02;
    const headboardWidth = single ? 3.8 : 6.6;
    const legX = single ? 1.25 : 2.65;

    const base = this.createBox({
      name: "bed-base",
      size: new THREE.Vector3(baseWidth, 0.55, 7.8),
      position: new THREE.Vector3(0, 1, 0),
      material: this.woodMaterial,
    });

    this.object3D.add(base);

    const mattress = this.createRoundedBox({
      name: "bed-mattress",
      size: new THREE.Vector3(mattressWidth, 0.75, 7.45),
      position: new THREE.Vector3(0, 1.65, 0),
      material: this.mattressMaterial,
      radius: 0.16,
    });

    this.object3D.add(mattress);

    const blanketTop = this.createRoundedBox({
      name: "bed-blanket-top",
      size: new THREE.Vector3(blanketWidth, 0.16, 5.45),
      position: new THREE.Vector3(0, 2.12, 1.03),
      material: this.blanketMaterial,
      radius: 0.1,
    });

    this.object3D.add(blanketTop);

    const blanketLeftSide = this.createRoundedBox({
      name: "bed-blanket-left-side",
      size: new THREE.Vector3(0.18, 0.78, 5.45),
      position: new THREE.Vector3(-blanketSideX, 1.8, 1.05),
      material: this.blanketMaterial,
      radius: 0.07,
    });

    this.object3D.add(blanketLeftSide);

    const blanketRightSide = this.createRoundedBox({
      name: "bed-blanket-right-side",
      size: new THREE.Vector3(0.18, 0.78, 5.45),
      position: new THREE.Vector3(blanketSideX, 1.8, 1.05),
      material: this.blanketMaterial,
      radius: 0.07,
    });

    this.object3D.add(blanketRightSide);

    const blanketFoot = this.createRoundedBox({
      name: "bed-blanket-foot",
      size: new THREE.Vector3(blanketWidth - 0.15, 0.78, 0.18),
      position: new THREE.Vector3(0, 1.8, 3.68),
      material: this.blanketMaterial,
      radius: 0.07,
    });

    this.object3D.add(blanketFoot);

    const pillowPositions = single ? [0] : [-1.45, 1.45];
    pillowPositions.forEach((x, index) => {
      const pillow = this.createRoundedBox({
        name: single ? "bed-pillow" : `bed-pillow-${index === 0 ? "left" : "right"}`,
        size: new THREE.Vector3(single ? 2.35 : 2.5, 0.45, 1.35),
        position: new THREE.Vector3(x, 2.15, -2.8),
        material: this.pillowMaterial,
        radius: 0.16,
      });
      this.object3D.add(pillow);
    });

    const headboard = this.createRoundedBox({
      name: "bed-headboard",
      size: new THREE.Vector3(headboardWidth, 3.8, 0.35),
      position: new THREE.Vector3(0, 2.5, -3.75),
      material: this.headboardMaterial,
      radius: 0.18,
    });

    this.object3D.add(headboard);

    const legPositions = [
      [-legX, 0.4, -3],
      [legX, 0.4, -3],
      [-legX, 0.4, 3],
      [legX, 0.4, 3],
    ];

    for (const [x, y, z] of legPositions) {
      const leg = this.createBox({
        name: "bed-leg",
        size: new THREE.Vector3(0.35, 0.8, 0.35),
        position: new THREE.Vector3(x, y, z),
        material: this.woodMaterial,
      });

      this.object3D.add(leg);
    }
  }
}

export { Bed };
