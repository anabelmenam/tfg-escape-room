import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

const STEAM_SEQUENCE = "3816";

class BathroomSteamPuzzle extends Entity {
  constructor({ faucet, vanity, onSolved = null } = {}) {
    super("bathroom-hot-water");
    this.onSolved = onSolved;
    this.vanity = vanity;
    this.isSolved = false;
    this.isRunning = false;
    this.object3D = faucet;
    this.effects3D = new THREE.Group();
    this.effects3D.name = `${this.id}-effects`;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 640;
    const context = canvas.getContext("2d");

    // Overlapping translucent patches give the mirror an uneven, natural fog.
    for (let index = 0; index < 46; index += 1) {
      const x = 28 + ((index * 83) % 456);
      const y = 35 + ((index * 137) % 570);
      const radius = 70 + ((index * 29) % 85);
      const stretch = 0.65 + ((index * 17) % 45) / 100;
      context.save();
      context.translate(x, y);
      context.scale(1, stretch);
      const haze = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius);
      haze.addColorStop(0, `rgba(205, 219, 217, ${0.12 + (index % 4) * 0.025})`);
      haze.addColorStop(0.62, "rgba(210, 224, 222, 0.09)");
      haze.addColorStop(1, "rgba(220, 232, 229, 0)");
      context.fillStyle = haze;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const fogMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      roughness: 1,
    });
    this.clue = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 2.85), fogMaterial);
    this.clue.position.set(2.55, 5.35, -4.61);
    this.clue.visible = false;

    const numbersCanvas = document.createElement("canvas");
    numbersCanvas.width = 512;
    numbersCanvas.height = 640;
    const numbersContext = numbersCanvas.getContext("2d");
    numbersContext.fillStyle = "rgba(55, 67, 64, 0.82)";
    numbersContext.font = '600 54px "Trebuchet MS", sans-serif';
    numbersContext.textAlign = "center";
    numbersContext.textBaseline = "middle";
    numbersContext.fillText(STEAM_SEQUENCE.split("").join("   "), 256, 328);
    const numbersTexture = new THREE.CanvasTexture(numbersCanvas);
    numbersTexture.colorSpace = THREE.SRGBColorSpace;
    this.numbers = new THREE.Mesh(
      new THREE.PlaneGeometry(2.25, 2.85),
      new THREE.MeshStandardMaterial({
        map: numbersTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        roughness: 1,
      }),
    );
    this.numbers.position.set(2.55, 5.35, -4.595);
    this.numbers.visible = false;
    this.effects3D.add(this.clue, this.numbers);
  }

  activate({ notify = true } = {}) {
    if (this.isRunning) return;
    const firstActivation = !this.isSolved;
    this.isSolved = true;
    this.isRunning = true;
    const lever = this.object3D?.userData.lever;
    if (lever) lever.rotation.x = -Math.PI / 5;
    this.vanity?.setWaterRunning(true);
    this.clue.visible = true;
    this.numbers.visible = true;
    if (firstActivation && notify) this.onSolved?.();
  }

  deactivate() {
    if (!this.isRunning) return;
    this.isRunning = false;
    const lever = this.object3D?.userData.lever;
    if (lever) lever.rotation.x = 0;
    this.vanity?.setWaterRunning(false);
  }

  interact() {
    if (this.isRunning) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  getInteractionText() {
    return this.isRunning ? tInteraction("turnOff", tItem("tap")) : tInteraction("turnOn", tItem("tap"));
  }

  update(deltaTime) {
    const fogTarget = this.isRunning ? 1 : 0;
    this.clue.material.opacity = THREE.MathUtils.damp(this.clue.material.opacity, fogTarget, 1.05, deltaTime);

    const numbersTarget = this.isRunning && this.clue.material.opacity > 0.28 ? 1 : 0;
    const numbersFadeSpeed = this.isRunning ? 0.42 : 1.25;
    this.numbers.material.opacity = THREE.MathUtils.damp(
      this.numbers.material.opacity,
      numbersTarget,
      numbersFadeSpeed,
      deltaTime,
    );

    if (!this.isRunning && this.clue.material.opacity < 0.01 && this.numbers.material.opacity < 0.01) {
      this.clue.visible = false;
      this.numbers.visible = false;
    }
  }
}

export { BathroomSteamPuzzle, STEAM_SEQUENCE };
