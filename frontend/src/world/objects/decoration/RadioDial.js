import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const createRadioDialVisual = ({ index = null, brass = null, darkMaterial = null } = {}) => {
  const dialBrass = brass ?? new THREE.MeshStandardMaterial({ color: 0xa96e25, metalness: 0.78, roughness: 0.25 });
  const dialDark = darkMaterial ?? new THREE.MeshStandardMaterial({ color: 0x241007, roughness: 0.58 });
  const group = new THREE.Group();
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.13, 20), dialBrass);
  dial.rotation.x = Math.PI / 2;
  const indicator = new THREE.Group();
  indicator.position.z = 0.08;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const center = canvas.width / 2;
  context.fillStyle = "#d9bc80";
  context.beginPath();
  context.arc(center, center, 108, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#3a1b0c";
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = "#261208";
  context.font = "bold 28px serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let value = 0; value < 10; value += 1) {
    const angle = (value * Math.PI * 2) / 10 - Math.PI / 2;
    context.fillText(String(value), center + Math.cos(angle) * 83, center + Math.sin(angle) * 83);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  indicator.add(face);
  for (let mark = 0; mark < 10; mark += 1) {
    const angle = -(mark * Math.PI * 2) / 10;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.065, 0.018), dialDark);
    tick.position.set(Math.sin(angle) * 0.165, Math.cos(angle) * 0.165, 0.01);
    tick.rotation.z = -angle;
    indicator.add(tick);
  }
  const needlePivot = new THREE.Group();
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.19, 0.03), dialDark);
  needle.position.set(0, 0.075, 0.025);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 12), dialBrass);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.03;
  needlePivot.add(needle, hub);
  indicator.add(needlePivot);
  group.add(dial, indicator);
  if (index !== null) {
    group.traverse((piece) => {
      if (piece.isMesh) piece.userData.radioDialIndex = index;
    });
    needlePivot.userData.radioDialIndex = index;
  }
  return { object3D: group, needlePivot };
};

class RadioDial extends Entity {
  constructor({ id = "radio-dial", scale = 1 } = {}) {
    super(id);
    const visual = createRadioDialVisual();
    this.object3D = visual.object3D;
    this.needlePivot = visual.needlePivot;
    this.object3D.scale.setScalar(scale);
    this.inventoryIcon = "/images/icons/radio-dial.png";
  }

  setDialIndex(index) {
    this.object3D.traverse((piece) => {
      if (piece.isMesh) piece.userData.radioDialIndex = index;
    });
    this.needlePivot.userData.radioDialIndex = index;
  }

  getInteractionText() {
    return this.object3D.visible ? tInteraction("pickUp", tItem(this.id)) : null;
  }

  interact(player) {
    if (!player.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
  }
}

export { RadioDial, createRadioDialVisual };
