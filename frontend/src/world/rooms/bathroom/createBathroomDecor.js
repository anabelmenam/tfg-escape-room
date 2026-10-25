import { createBottleSet, createPottedPlant, createSoapDish, createTrashBin } from "../../objects/index.js";

const createBathroomDecor = ({ vanity }) => {
  const toiletries = createBottleSet({ aged: false, scale: .62 }); toiletries.position.set(-1.35, 2.79, -.34); vanity.object3D.add(toiletries);
  const soapDish = createSoapDish({ aged: false, scale: .72 }); soapDish.position.set(1.38, 2.79, .05); vanity.object3D.add(soapDish);
  const trashBin = createTrashBin({ aged: false, scale: .88 }); trashBin.position.set(6.35, 0, 3.4);
  const plant = createPottedPlant({ aged: false, scale: .75 }); plant.position.set(6.25, 0, -3.75);
  return { trashBin, plant };
};
export { createBathroomDecor };
