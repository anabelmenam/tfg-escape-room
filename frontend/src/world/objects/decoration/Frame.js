import * as THREE from "three";
import { Entity } from "../Entity.js";

class Frame extends Entity {
  constructor({
    id = "frame",
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    rotationY = 0,
    scale = 1,
    width = 1.6,
    height = 2.1,
    imagePath = null,
    mount = "wall",
    frameColor = 0x2d160b,
    matColor = 0xe3d3ad,
  } = {}) {
    super(id);
    this.width = width;
    this.height = height;
    this.mount = mount;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.userData.ambientDescriptionKey = "framedPicture";
    this.object3D.position.copy(position);
    this.object3D.rotation.copy(rotation);
    this.object3D.rotation.y += rotationY;
    this.object3D.scale.setScalar(scale);
    this.createFrame({ imagePath, frameColor, matColor });
  }

  createFrame({ imagePath, frameColor, matColor }) {
    const frameDepth = 0.12;
    const border = 0.12;
    const wood = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.48, metalness: 0.05 });
    const mat = new THREE.MeshStandardMaterial({ color: matColor, roughness: 0.82 });
    const texture = imagePath ? new THREE.TextureLoader().load(imagePath) : null;
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    const image = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width - border * 2.6, this.height - border * 2.6),
      new THREE.MeshStandardMaterial({ map: texture, color: texture ? 0xffffff : 0x3a2c24, roughness: 0.9, side: THREE.DoubleSide }),
    );
    const mount = new THREE.Mesh(
      new THREE.BoxGeometry(this.width - border * 1.5, this.height - border * 1.5, 0.035),
      mat,
    );
    mount.position.z = frameDepth / 2;

    image.position.z = mount.position.z + mount.geometry.parameters.depth / 2 + 0.002;
    const pieces = [
      [this.width, border, 0, this.height / 2 - border / 2],
      [this.width, border, 0, -this.height / 2 + border / 2],
      [border, this.height, -this.width / 2 + border / 2, 0],
      [border, this.height, this.width / 2 - border / 2, 0],
    ].map(([pieceWidth, pieceHeight, x, y]) => {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(pieceWidth, pieceHeight, frameDepth), wood);
      piece.position.set(x, y, 0);
      piece.castShadow = true;
      piece.receiveShadow = true;
      return piece;
    });
    this.object3D.add(mount, image, ...pieces);
    if (this.mount === "surface") {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.46, 0.04, this.height * 0.42), wood);
      stand.position.set(0, -this.height * 0.32, -this.height * 0.19);
      stand.rotation.x = Math.PI / 5;
      this.object3D.add(stand);
    }
  }
}

export { Frame };
