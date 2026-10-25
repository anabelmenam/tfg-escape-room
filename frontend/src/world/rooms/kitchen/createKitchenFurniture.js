import * as THREE from "three";
import { Chair, CooktopCounter, KitchenCounter, KitchenTallCabinet, Oven, Refrigerator, Table, applyAgedFurnitureAppearance } from "../../objects/index.js";

const woodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x6b4b35,
  darkWoodColor: 0x443126,
};

const createKitchenFurniture = ({ character, config }) => {
  const refrigerator = new Refrigerator({ id: `kitchen-${character}-refrigerator`, position: new THREE.Vector3(7.25, 0, -11.1), rotationY: -Math.PI / 2, color: config.applianceColor });
  const counter = new KitchenCounter({ id: `kitchen-${character}-counter`, position: new THREE.Vector3(7.75, 0, -2.1), rotationY: -Math.PI / 2, width: 8.5, cabinetColor: config.cabinetColor });
  const oven = new Oven({ id: `kitchen-${character}-oven`, position: new THREE.Vector3(7.55, 0, -7.85), rotationY: -Math.PI / 2, bodyColor: config.applianceColor, cabinetColor: config.cabinetColor });
  const cooktopCounter = new CooktopCounter({ id: `kitchen-${character}-cooktop-counter`, position: new THREE.Vector3(7.75, 0, 3.75), rotationY: -Math.PI / 2, width: 3, cabinetColor: config.cabinetColor });
  const smallCounter = new KitchenCounter({ id: `kitchen-${character}-small-counter`, position: new THREE.Vector3(7.75, 0, 5.95), rotationY: -Math.PI / 2, width: 1.2, cabinetColor: config.cabinetColor, hasSink: false });
  const firstTallCabinet = new KitchenTallCabinet({ id: `kitchen-${character}-tall-cabinet-1`, position: new THREE.Vector3(7.5, 0, 8.1), rotationY: -Math.PI / 2, color: config.cabinetColor, hingeSide: "left" });
  const secondTallCabinet = new KitchenTallCabinet({ id: `kitchen-${character}-tall-cabinet-2`, position: new THREE.Vector3(7.5, 0, 11.15), rotationY: -Math.PI / 2, color: config.cabinetColor, hingeSide: "right" });
  const diningTable = new Table({ id: `kitchen-${character}-table`, position: new THREE.Vector3(-4.5, 0, -1), rotationY: Math.PI / 2, width: 7, height: 2.6, depth: 3.5, hasShelf: false, createCollider: true, ...woodStyle });
  const chairs = [
    [-7.2, -2.7, Math.PI / 2], [-7.2, .7, Math.PI / 2],
    [-1.8, -2.7, -Math.PI / 2], [-1.8, .7, -Math.PI / 2],
  ].map(([x, z, rotationY], index) => new Chair({ id: `kitchen-${character}-chair-${index + 1}`, position: new THREE.Vector3(x, 0, z), rotationY, scale: .74, ...woodStyle }));
  const furniture = [refrigerator, oven, counter, cooktopCounter, smallCounter, firstTallCabinet, secondTallCabinet, diningTable, ...chairs];
  furniture.forEach((object) => applyAgedFurnitureAppearance(object.object3D, { intensity: .12, wearColor: 0x6d5c4b }));
  return {
    refrigerator, oven, counter, cooktopCounter, smallCounter, firstTallCabinet, secondTallCabinet, diningTable, chairs, furniture,
    openables: [refrigerator, oven, counter, cooktopCounter, smallCounter, firstTallCabinet, secondTallCabinet],
  };
};

export { createKitchenFurniture };
