import * as THREE from "three";
import createBox from "../helpers/createBox.js";
import { loadTexture } from "../helpers/loadTexture.js";
import { createAmbientMaterial as material } from "./ambientDecorHelpers.js";

const createArtworkTexture = ({ index, aged }) => {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 520;
  const context = canvas.getContext("2d");
  const palettes = aged
    ? [
        ["#777067", "#4f5d58", "#8a745e"],
        ["#74695e", "#665d68", "#8b806c"],
        ["#6d716a", "#556267", "#8a725c"],
      ]
    : [
        ["#d9c7a1", "#5d877f", "#a46f58"],
        ["#d9c9ad", "#7186a0", "#b08463"],
        ["#d8c49b", "#80905f", "#a56658"],
      ];
  const [background, primary, accent] = palettes[index % palettes.length];
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (index % 3 === 0) {
    context.fillStyle = "#a9b7ad";
    context.fillRect(0, 295, canvas.width, 225);
    context.fillStyle = primary;
    context.beginPath();
    context.moveTo(0, 330);
    context.lineTo(105, 175);
    context.lineTo(190, 300);
    context.lineTo(285, 115);
    context.lineTo(420, 330);
    context.closePath();
    context.fill();
    context.fillStyle = accent;
    context.beginPath();
    context.arc(326, 108, 45, 0, Math.PI * 2);
    context.fill();
  } else if (index % 3 === 1) {
    context.strokeStyle = primary;
    context.lineWidth = 18;
    context.beginPath();
    context.moveTo(210, 470);
    context.bezierCurveTo(165, 340, 275, 245, 205, 80);
    context.stroke();
    [
      [135, 310, -0.6],
      [272, 245, 0.7],
      [150, 175, -0.8],
      [265, 125, 0.65],
    ].forEach(([x, y, rotation]) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.fillStyle = accent;
      context.beginPath();
      context.ellipse(0, 0, 58, 25, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  } else {
    context.fillStyle = primary;
    context.fillRect(62, 74, 128, 286);
    context.fillStyle = accent;
    context.beginPath();
    context.arc(290, 210, 92, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,245,220,.7)";
    context.lineWidth = 20;
    context.strokeRect(118, 270, 218, 168);
  }
  context.fillStyle = aged ? "rgba(44,36,30,.22)" : "rgba(255,244,214,.08)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createWallFrameCluster = ({ aged = false, scale = 1, imagePaths = [] } = {}) => {
  const group = new THREE.Group();
  group.name = "ambient-family-frames";
  group.userData.ambientDescriptionKey = "familyFrames";
  const frameMaterial = material(aged ? 0x453d37 : 0x65472f, 0.78);
  [
    [-1.15, 0.25, 1.25, 1.65],
    [0.15, -0.05, 1.05, 1.3],
    [1.25, 0.35, 0.9, 1.15],
  ].forEach(([x, y, width, height], index) => {
    const frame = createBox({
      width,
      height,
      depth: 0.1,
      position: new THREE.Vector3(x, y, 0),
      material: frameMaterial,
    });
    const imagePath = imagePaths.length ? imagePaths[index % imagePaths.length] : null;
    const artwork = imagePath ? loadTexture({ path: imagePath }) : createArtworkTexture({ index, aged });
    const artMaterial = new THREE.MeshStandardMaterial({
      map: artwork,
      color: aged ? 0xb0aaa0 : 0xffffff,
      roughness: 0.9,
    });
    const art = createBox({
      width: width - 0.16,
      height: height - 0.16,
      depth: 0.035,
      position: new THREE.Vector3(x, y, 0.07),
      material: artMaterial,
    });
    group.add(frame, art);
  });
  group.scale.setScalar(scale);
  return group;
};

export { createWallFrameCluster };
