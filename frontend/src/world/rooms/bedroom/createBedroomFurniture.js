import * as THREE from "three";
import { Bed, Cabinet, Carpet, Chair, Desk, Wardrobe, applyAgedFurnitureAppearance } from "../../objects/index.js";

const bedroomWoodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x5b3a29,
  darkWoodColor: 0x422a1e,
  interiorColor: 0x6b4734,
  drawerInteriorColor: 0x6b4734,
  handleColor: 0x9b773d,
};

const createBedroomFurniture = ({ character, characterConfig, testMode = false }) => {
  const bed = new Bed({
    id: "bed1",
    position: new THREE.Vector3(-1.75, 0, -8),
    ...bedroomWoodStyle,
    blanketColor: characterConfig.blanketColor,
    mattressColor: 0xd8e0e4,
    pillowColor: characterConfig.pillowColor,
  });

  const nightstand1 = new Cabinet({
    id: "nightstand1",
    position: new THREE.Vector3(-6.5, 0, -11),
    width: 2.8,
    height: 2.8,
    depth: 2.2,
    rows: 2,
    columns: 1,
    drawerOpenDistance: 1.2,
    handleType: "knob",
    ...bedroomWoodStyle,
  });
  const nightstand2 = new Cabinet({
    id: "nightstand2",
    position: new THREE.Vector3(3, 0, -11),
    width: 2.8,
    height: 2.8,
    depth: 2.2,
    rows: 2,
    columns: 1,
    drawerOpenDistance: 1.2,
    handleType: "knob",
    ...bedroomWoodStyle,
  });

  const wardrobe = new Wardrobe({
    id: "wardrobe1",
    position: new THREE.Vector3(6.5, 0, -3),
    ...bedroomWoodStyle,
  });
  wardrobe.object3D.rotation.y = -Math.PI / 2;

  const cabinet = new Cabinet({
    id: "cabinet1",
    position: new THREE.Vector3(-7, 0, 3),
    height: 3,
    columns: 2,
    rows: 3,
    width: 8,
    handleType: "bar",
    ...bedroomWoodStyle,
  });
  cabinet.object3D.rotation.y = Math.PI / 2;

  const desk = new Desk({
    id: "desk1",
    position: new THREE.Vector3(6.5, 0, 8),
    lockedDrawers: character === "dad" && !testMode ? [0] : [],
    ...bedroomWoodStyle,
  });
  desk.object3D.rotation.y = -Math.PI / 2;
  const chair = new Chair({
    id: "chair1",
    position: new THREE.Vector3(4.5, 0, 9.5),
    ...bedroomWoodStyle,
  });
  chair.object3D.rotation.y = Math.PI / 2;

  const carpet = new Carpet({
    id: "carpet1",
    position: new THREE.Vector3(-1.5, 0.01, -5),
    width: 6,
    depth: 10,
    color: characterConfig.carpetColor,
    texture: "/textures/furniture/carpet.jpg",
    textureRepeat: { x: 2, y: 3 },
  });
  carpet.object3D.rotation.y = -Math.PI / 2;

  [bed, nightstand1, nightstand2, wardrobe, cabinet, desk, chair, carpet].forEach((furniture) => {
    applyAgedFurnitureAppearance(furniture.object3D, { intensity: 0.14, wearColor: 0x6f5b4b });
  });

  return {
    bed,
    nightstand1,
    nightstand2,
    wardrobe,
    cabinet,
    desk,
    chair,
    carpet,
    nightstand1Interactables: nightstand1.getInteractables(),
    nightstand2Interactables: nightstand2.getInteractables(),
    wardrobeInteractables: wardrobe.getInteractables(),
    cabinetInteractables: cabinet.getInteractables(),
    deskInteractables: desk.getInteractables(),
  };
};

export { createBedroomFurniture };
