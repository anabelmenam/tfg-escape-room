import * as THREE from "three";
import { Entity } from "../Entity.js";

class AlarmClock extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,

    time = "03:28",
    isBroken = false,

    bodyColor = 0x1f1f1f,
    frameColor = 0x111111,
    screenColor = 0x090909,
    digitColor = "#ff3b30",
    buttonColor = 0x242424,
  } = {}) {
    super(id);

    this.time = time;
    this.isBroken = isBroken;

    this.bodyColor = bodyColor;
    this.frameColor = frameColor;
    this.screenColor = screenColor;
    this.digitColor = digitColor;
    this.buttonColor = buttonColor;

    this.object3D = this.createClock();

    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }
  }

  createClock() {
    const group = new THREE.Group();
    group.name = this.id;

    this.createBody(group);
    this.createFrontFrame(group);
    this.createScreen(group);
    this.createButtons(group);
    this.createFeet(group);

    return group;
  }

  createBody(group) {
    const geometry = new THREE.BoxGeometry(1.6, 0.75, 0.7);

    const material = new THREE.MeshStandardMaterial({
      color: this.bodyColor,
      roughness: 0.65,
      metalness: 0.15,
    });

    const body = new THREE.Mesh(geometry, material);

    body.position.y = 0.42;

    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);
  }

  createFrontFrame(group) {
    const geometry = new THREE.BoxGeometry(1.5, 0.62, 0.06);

    const material = new THREE.MeshStandardMaterial({
      color: this.frameColor,
      roughness: 0.5,
      metalness: 0.25,
    });

    const frame = new THREE.Mesh(geometry, material);

    frame.position.set(0, 0.42, 0.38);

    frame.castShadow = true;
    frame.receiveShadow = true;

    group.add(frame);
  }

  createScreen(group) {
    const geometry = new THREE.PlaneGeometry(1.28, 0.45);

    this.screenTexture = this.createScreenTexture();

    const material = new THREE.MeshStandardMaterial({
      map: this.screenTexture,
      roughness: 0.5,
    });

    this.screen = new THREE.Mesh(geometry, material);

    this.screen.position.set(0, 0.42, 0.412);

    group.add(this.screen);
  }

  createScreenTexture() {
    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 180;

    const context = canvas.getContext("2d");

    context.fillStyle = `#${this.screenColor.toString(16).padStart(6, "0")}`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (this.isBroken) {
      context.fillStyle = "#131b22";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = "#465560";
      context.lineWidth = 2;
      context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

      context.strokeStyle = "#8fa2ae";
      context.lineWidth = 2;
      context.shadowColor = "#5f7280";
      context.shadowBlur = 3;

      context.beginPath();
      context.moveTo(85, 12);
      context.lineTo(205, 72);
      context.lineTo(160, 128);
      context.lineTo(275, 168);
      context.lineTo(240, 180);
      context.moveTo(410, 8);
      context.lineTo(330, 68);
      context.lineTo(445, 112);
      context.lineTo(385, 178);
      context.moveTo(330, 68);
      context.lineTo(285, 24);
      context.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      return texture;
    }

    context.fillStyle = this.digitColor;

    context.font = "bold 110px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.shadowColor = this.digitColor;
    context.shadowBlur = 14;

    context.fillText(this.time, canvas.width / 2, canvas.height / 2 + 5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
  }

  createButtons(group) {
    const material = new THREE.MeshStandardMaterial({
      color: this.buttonColor,
      roughness: 0.55,
      metalness: 0.25,
    });

    const mainButton = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.16), material);

    mainButton.position.set(0, 0.84, 0);

    mainButton.castShadow = true;
    mainButton.receiveShadow = true;

    group.add(mainButton);

    const smallButtonGeometry = new THREE.BoxGeometry(0.18, 0.07, 0.14);

    const leftButton = new THREE.Mesh(smallButtonGeometry, material);

    leftButton.position.set(-0.55, 0.84, 0);

    leftButton.castShadow = true;
    leftButton.receiveShadow = true;

    group.add(leftButton);

    const rightButton = leftButton.clone();

    rightButton.position.x = 0.55;

    group.add(rightButton);
  }

  createFeet(group) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x101010,
      roughness: 0.8,
    });

    const geometry = new THREE.BoxGeometry(0.28, 0.08, 0.38);

    const leftFoot = new THREE.Mesh(geometry, material);

    leftFoot.position.set(-0.5, 0.04, 0);

    leftFoot.castShadow = true;
    leftFoot.receiveShadow = true;

    group.add(leftFoot);

    const rightFoot = leftFoot.clone();

    rightFoot.position.x = 0.5;

    group.add(rightFoot);
  }

  setTime(time) {
    this.time = time;

    if (this.screenTexture) {
      this.screenTexture.dispose();
    }

    this.screenTexture = this.createScreenTexture();

    this.screen.material.map = this.screenTexture;
    this.screen.material.needsUpdate = true;
  }

  setBroken(isBroken) {
    this.isBroken = isBroken;
    this.setTime(this.time);
  }

  dispose() {
    this.object3D.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.geometry?.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          material.map?.dispose();
          material.dispose();
        });
      } else {
        child.material?.map?.dispose();
        child.material?.dispose();
      }
    });
  }
}

export { AlarmClock };
