import * as THREE from "three";
import { Bed, Cabinet, Carpet, Chair, Desk, Wardrobe, applyAgedFurnitureAppearance } from "../../objects/index.js";

const woodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x765137,
  darkWoodColor: 0x4c3225,
  interiorColor: 0x805c43,
  drawerInteriorColor: 0x805c43,
  handleColor: 0xb18b4f,
};

const createChildrenRoomFurniture = ({ config }) => {
  const beds = [-1, 1].map((side, index) => new Bed({
    id: `children-room-bed-${index + 1}`,
    position: new THREE.Vector3(side * 8.5, 0, -5.5),
    size: "single",
    ...woodStyle,
    blanketColor: config.blanketColors[index],
    pillowColor: 0xe8dfcd,
  }));
  const studyAreaZ = 2;
  const desks = [-0.7, 0.7].map((side, index) => new Desk({
    id: `children-room-desk-${index + 1}`,
    position: new THREE.Vector3(side * 9.2, 0, studyAreaZ),
    rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
    scale: 0.68,
    ...woodStyle,
  }));
  const chairs = [-1, 1].map((side, index) => new Chair({
    id: `children-room-chair-${index + 1}`,
    position: new THREE.Vector3(side * 6.7, 0, studyAreaZ),
    rotationY: side < 0 ? -Math.PI / 2 : Math.PI / 2,
    scale: 0.58,
    ...woodStyle,
  }));
  const wardrobes = [-1.2, 1.2].map((side, index) => new Wardrobe({
    id: `children-room-wardrobe-${index + 1}`,
    position: new THREE.Vector3(side * 5.4, 0, 8.4),
    rotationY: Math.PI,
    scale: 0.78,
    ...woodStyle,
  }));
  wardrobes.forEach((wardrobe) => { wardrobe.object3D.scale.y = 0.84; });
  const dresser = new Cabinet({
    id: "children-room-dresser",
    position: new THREE.Vector3(0, 0, -8.3),
    width: 7,
    height: 3,
    depth: 2,
    rows: 4,
    columns: 2,
    handleType: "knob",
    ...woodStyle,
  });
  const carpets = [-2, 2].map((side, index) => new Carpet({
    id: `children-room-carpet-${index + 1}`,
    position: new THREE.Vector3(side * 4.2, 0.02, 1.7),
    width: 4,
    depth: 6.5,
    color: config.blanketColors[index],
    texture: "/textures/furniture/carpet.jpg",
    textureRepeat: { x: 2, y: 2 },
  }));
  [...beds, ...desks, ...chairs, ...wardrobes, dresser, ...carpets].forEach((object) => {
    applyAgedFurnitureAppearance(object.object3D, { intensity: 0.12, wearColor: 0x745d49 });
  });
  return { beds, desks, chairs, wardrobes, dresser, carpets };
};

export { createChildrenRoomFurniture };
