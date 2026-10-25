import * as THREE from "three";
import { Carpet, Frame, Table, createKeyBowl, createUmbrellaStand, createVase } from "../../objects/index.js";

const woodStyle = { woodTexture: "/textures/furniture/wood2.jpg", woodTextureRepeat: { x: 1, y: 1 }, woodColor: 0x5b3a29, darkWoodColor: 0x422a1e, interiorColor: 0x6b4734, drawerInteriorColor: 0x6b4734, handleColor: 0x9b773d };
const createHallwayDecor = ({ character, config }) => {
  const consoleTable = new Table({ id: `hallway-${character}-console`, position: new THREE.Vector3(16, 0, 0), rotationY: Math.PI, width: 4, height: 2.5, depth: 1, hasShelf: true, ...woodStyle, createCollider: false });
  const carpet = new Carpet({ id: `hallway-${character}-carpet`, position: new THREE.Vector3(0, .03, 0), width: 34, depth: 5, color: config.carpetColor, texture: "/textures/furniture/carpet.jpg", textureRepeat: { x: 8, y: 1 }, hasFringes: false });
  const vase = createVase({ aged: false, scale: .72, flowers: true }); vase.position.set(-.72, 2.51, 0); consoleTable.object3D.add(vase);
  const bowl = createKeyBowl({ aged: false, scale: .82 }); bowl.position.set(.9, 2.51, 0); consoleTable.object3D.add(bowl);
  const umbrellaStand = createUmbrellaStand({ aged: false, scale: .95 }); umbrellaStand.position.set(23.8, 0, 4.3);
  const daughterFrame = new Frame({ id: `hallway-${character}-daughter-frame`, position: new THREE.Vector3(-13, 5.7, -4.42), width: 1.65, height: 2.2, scale: 2, imagePath: "/images/family/daughter-portrait.png", mount: "wall" });
  const sonFrame = new Frame({ id: `hallway-${character}-son-frame`, position: new THREE.Vector3(-7.5, 5.7, -4.42), width: 1.65, height: 2.2, scale: 2, imagePath: "/images/family/son-portrait.png", mount: "wall" });
  return { consoleTable, carpet, umbrellaStand, daughterFrame, sonFrame };
};
export { createHallwayDecor };
