import * as THREE from "three";
import { BathroomVanity, Bathtub, Cabinet, Carpet, Mirror, Toilet, TowelRail, applyAgedFurnitureAppearance } from "../../objects/index.js";

const createBathroomFurniture = ({ timeline, config }) => {
  const vanity = new BathroomVanity({ id: `bathroom-${timeline}-vanity`, position: new THREE.Vector3(2.55, 0, -3.95), cabinetColor: config.cabinetColor, fixtureColor: config.fixtureColor, metalColor: config.metalColor, lockedDrawers: timeline === "present" ? [0] : [] });
  const linenCabinet = new Cabinet({ id: `bathroom-${timeline}-linen-cabinet`, position: new THREE.Vector3(-2.35, 0, -4.15), width: 2.5, height: 3.1, depth: 1.55, rows: 2, columns: 1, handleType: "knob", woodColor: config.cabinetColor, darkWoodColor: 0x4b3528, interiorColor: 0x684a36, drawerInteriorColor: 0x684a36, handleColor: config.metalColor });
  const toilet = new Toilet({ id: `bathroom-${timeline}-toilet`, position: new THREE.Vector3(4.8, 0, 3), scale: 1.18, heightScale: 1.12, fixtureColor: config.fixtureColor, metalColor: config.metalColor });
  const bathtub = new Bathtub({ id: `bathroom-${timeline}-bathtub`, position: new THREE.Vector3(-5.55, 0, .45), scale: 1.12, heightScale: 1.22, lengthScale: 1.14, fixtureColor: config.fixtureColor, metalColor: config.metalColor });
  const towelRail = new TowelRail({ id: `bathroom-${timeline}-towel-rail`, position: new THREE.Vector3(-1.2, 4.8, 4.77), metalColor: config.metalColor, towelColor: config.textileColor });
  const mirror = new Mirror({ id: `bathroom-${timeline}-mirror`, position: new THREE.Vector3(2.55, 5.35, -4.72), scale: 1.45 });
  const bathMat = new Carpet({ id: `bathroom-${timeline}-mat`, position: new THREE.Vector3(-2.7, .02, 1), width: 2.6, depth: 4.2, color: config.textileColor, sideColor: 0x384744, hasFringes: false });
  [vanity.object3D, linenCabinet.object3D, toilet.object3D, bathtub.object3D, towelRail.object3D, mirror.object3D].forEach((object) => applyAgedFurnitureAppearance(object, { intensity: .12, wearColor: 0x666860 }));
  return { vanity, linenCabinet, toilet, bathtub, towelRail, mirror, bathMat, solidFurniture: [vanity, linenCabinet, toilet, bathtub] };
};
export { createBathroomFurniture };
