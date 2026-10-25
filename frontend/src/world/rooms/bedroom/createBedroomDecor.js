import * as THREE from "three";
import { DeskLamp, Frame, Paper, createCandleCluster, createPerfumeTray } from "../../objects/index.js";

const createBedroomDecor = ({ timeline, desk, cabinet }) => {
  const deskPaper = new Paper({
    id: `bedroom-${timeline}-desk-paper`,
    position: new THREE.Vector3(1.5, 3.322, 0.78),
    rotation: new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2 + 0.08),
    width: 1.15,
    height: 0.82,
  });
  if (timeline === "present") desk.object3D.add(deskPaper.object3D);

  [
    { x: 1.43, z: 0.82, angle: -0.12, width: 1.28, height: 0.9 },
    { x: 1.57, z: 0.72, angle: 0.11, width: 1.18, height: 0.84 },
    { x: 1.46, z: 0.85, angle: -0.05, width: 1.32, height: 0.88 },
    { x: 1.55, z: 0.77, angle: 0.16, width: 1.12, height: 0.8 },
  ].forEach(({ x, z, angle, width, height }, index) => {
    const paper = new Paper({
      id: `bedroom-${timeline}-loose-desk-paper-${index + 1}`,
      position: new THREE.Vector3(x, 3.33 + index * 0.018, z),
      rotation: new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2 + angle),
      width,
      height,
      paperColor: "#c7b68f",
    });
    desk.object3D.add(paper.object3D);
  });

  const deskLamp = new DeskLamp({
    id: `bedroom-${timeline}-desk-lamp`,
    position: new THREE.Vector3(-3, 3.32, -0.7),
    rotation: new THREE.Euler(0, -Math.PI / 4, 0),
    targetOffset: new THREE.Vector3(0.84, 0.02, 0),
    powerAvailable: timeline !== "present",
    ...(timeline === "past" ? {
      lightColor: 0xffd89a,
      bulbColor: 0xffedc2,
      emissiveColor: 0xffb34f,
      lightIntensity: 190,
    } : {}),
  });
  desk.object3D.add(deskLamp.object3D);

  const dresserCandles = createCandleCluster({ aged: false, scale: 1.05, count: 2 });
  dresserCandles.position.set(-3.12, 3.01, 0.18);
  dresserCandles.rotation.y = -0.28;
  cabinet.object3D.add(dresserCandles);
  const perfumeTray = createPerfumeTray({ aged: false, scale: 0.78 });
  perfumeTray.position.set(2.75, 3.01, -0.25);
  cabinet.object3D.add(perfumeTray);

  const landscape = new Frame({
    id: `bedroom-${timeline}-landscape`,
    position: new THREE.Vector3(-1.75, 7.45, -12.34),
    width: 5.8,
    height: 3.35,
    imagePath: "/images/decor/family-breakfast.png",
    mount: "wall",
    frameColor: 0x5d402b,
    matColor: 0xd8c7a3,
  });

  return { deskPaper, deskLamp, landscape };
};

export { createBedroomDecor };
