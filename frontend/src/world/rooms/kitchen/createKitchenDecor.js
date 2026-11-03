import {
  createFruitBowl,
  createKitchenCanisterSet,
  createKitchenPrepSet,
  createPottedPlant,
  createUtensilCrock,
  createWallFrameCluster,
} from "../../objects/index.js";

const createKitchenDecor = ({ character, depth, furniture }) => {
  const fruitBowl = createFruitBowl({ aged: false, scale: 1.05 });
  fruitBowl.position.set(0, 2.61, 0);
  furniture.diningTable.object3D.add(fruitBowl);
  const utensils = createUtensilCrock({ aged: false, scale: 0.9 });
  utensils.position.set(-3.75, 2.8, -0.35);
  const canisters = createKitchenCanisterSet({ aged: false, scale: 0.9 });
  canisters.position.set(3.35, 2.8, -0.65);
  furniture.counter.object3D.add(utensils, canisters);
  const prepSet = createKitchenPrepSet({ aged: false, scale: 0.72 });
  prepSet.position.set(0, 2.8, 0);
  furniture.smallCounter.object3D.add(prepSet);
  const plant = createPottedPlant({ aged: false, scale: 1.05 });
  plant.position.set(-3.65, 0, -11.75);
  const frames = createWallFrameCluster({
    aged: false,
    scale: 0.8,
    imagePaths: [
      "/images/decor/family-breakfast.png",
      "/images/decor/family-picnic.png",
      "/images/decor/family-photo-1980s.png",
    ],
  });
  frames.position.set(-6.35, 7, depth / 2 - 0.22);
  frames.rotation.y = Math.PI;
  frames.visible = character !== "mum";
  return { plant, frames };
};

export { createKitchenDecor };
