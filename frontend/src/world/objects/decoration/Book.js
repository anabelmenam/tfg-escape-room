import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tItem, tInteraction } from "../../../translations/index.js";

class Book extends Entity {
  constructor({
    id,
    color = 0x6b4a2f,
    pageColor = 0xd8c7a3,
    width = 0.8,
    height = 1.2,
    depth = 0.3,
    position = new THREE.Vector3(),
    rotationY = 0,
    symbol = null,
    onInteract = null,
    currentSlot = 0,
    correctSlot = 0,
    blockInteraction = false,
  } = {}) {
    super(id);

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.onInteract = onInteract;
    this.currentSlot = currentSlot;
    this.correctSlot = correctSlot;
    this.symbol = symbol;
    this.color = color;
    this.pageColor = pageColor;
    this.blockInteraction = blockInteraction;

    this.isAnimating = false;
    this.animationProgress = 0;
    this.animationDuration = 0.25;
    this.animationStart = new THREE.Vector3();
    this.animationTarget = new THREE.Vector3();
    this.basePosition = new THREE.Vector3();

    this.object3D = this.createBook();
    this.object3D.position.copy(position);
    this.basePosition.copy(this.object3D.position);
    this.object3D.rotation.y = rotationY;
  }

  createBook() {
    const group = new THREE.Group();
    group.name = this.id;

    const coverMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.75,
      metalness: 0,
    });

    const pagesMaterial = new THREE.MeshStandardMaterial({
      color: this.pageColor,
      roughness: 0.9,
      metalness: 0,
    });

    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(this.width * 0.82, this.height * 0.9, this.depth),
      pagesMaterial,
    );

    pages.castShadow = true;
    pages.receiveShadow = true;

    const frontCover = new THREE.Mesh(new THREE.BoxGeometry(this.width, this.height, 0.05), coverMaterial);

    frontCover.position.z = this.depth / 2 + 0.025;
    frontCover.castShadow = true;
    frontCover.receiveShadow = true;

    const backCover = frontCover.clone();
    backCover.position.z = -this.depth / 2 - 0.025;

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, this.height, this.depth + 0.1), coverMaterial);

    spine.position.x = -this.width / 2 + 0.03;
    spine.castShadow = true;
    spine.receiveShadow = true;

    group.add(pages);
    group.add(frontCover);
    group.add(backCover);
    group.add(spine);

    if (this.symbol) {
      const symbol = this.createSymbol();
      group.add(symbol);
    }

    return group;
  }

  createSymbol() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#f2e6c9";
    context.lineWidth = 18;
    context.lineCap = "round";
    context.lineJoin = "round";

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 65;

    if (this.symbol === "triangle") {
      context.beginPath();
      context.moveTo(centerX, centerY - size);
      context.lineTo(centerX - size, centerY + size);
      context.lineTo(centerX + size, centerY + size);
      context.closePath();
      context.stroke();
    }

    if (this.symbol === "circle") {
      context.beginPath();
      context.arc(centerX, centerY, size, 0, Math.PI * 2);
      context.stroke();
    }

    if (this.symbol === "square") {
      context.beginPath();
      context.rect(centerX - size, centerY - size, size * 2, size * 2);
      context.stroke();
    }

    if (this.symbol === "cross") {
      context.beginPath();
      context.moveTo(centerX - size, centerY - size);
      context.lineTo(centerX + size, centerY + size);
      context.moveTo(centerX + size, centerY - size);
      context.lineTo(centerX - size, centerY + size);
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(this.depth * 0.7, this.height * 0.35);

    const symbol = new THREE.Mesh(geometry, material);
    symbol.rotation.y = -Math.PI / 2;
    symbol.position.set(-this.width / 2 - 0.002, 0, 0);

    return symbol;
  }

  interact() {
    if (!this.enabled) {
      return;
    }

    if (this.onInteract) {
      this.onInteract(this);
    }
  }

  getInteractionText() {
    return this.enabled ? tInteraction("move", tItem("book")) : null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setOnInteract(onInteract) {
    this.onInteract = onInteract;
  }

  dispose() {
    this.object3D.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.geometry?.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material?.dispose();
      }
    });
  }

  animateTo(position, duration = 0.25) {
    this.animationStart.copy(this.object3D.position);
    this.animationTarget.copy(position);

    this.animationProgress = 0;
    this.animationDuration = duration;
    this.isAnimating = true;
  }

  setSelected(selected, offset = 0.5) {
    const target = this.object3D.position.clone();
    if (selected) {
      target.z += offset;
    } else {
      target.z -= offset;
    }
    this.animateTo(target, 0.18);
  }

  update(delta) {
    if (!this.isAnimating) {
      return;
    }

    this.animationProgress += delta / this.animationDuration;
    const t = Math.min(this.animationProgress, 1);
    const eased = t * t * (3 - 2 * t);
    this.object3D.position.lerpVectors(this.animationStart, this.animationTarget, eased);

    if (t >= 1) {
      this.object3D.position.copy(this.animationTarget);
      this.isAnimating = false;
    }
  }
}

export { Book };
