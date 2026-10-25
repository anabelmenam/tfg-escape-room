import {
  createBookStack,
  createCandleCluster,
  createPottedPlant,
  createVase,
  createWallFrameCluster,
} from "../../objects/index.js";

const shelfDecorLayout = [
  [
    { kind: "books", shelf: 0, x: -2.7, scale: 1.05, variant: 0, rotationY: -.08 },
    { kind: "vase", shelf: 0, x: 2.55, scale: .8 },
    { kind: "candles", shelf: 2, x: -2.7, scale: .95 },
  ],
  [
    { kind: "candles", shelf: 0, x: 2.65, scale: .9 },
    { kind: "vase", shelf: 2, x: -2.75, scale: .72 },
    { kind: "books", shelf: 2, x: 2.35, scale: 1.02, variant: 1, rotationY: .11 },
    { kind: "candles", shelf: 3, x: 0, scale: .92 },
  ],
  [
    { kind: "books", shelf: 0, x: -2.55, scale: .96, variant: 2, rotationY: -.04 },
    { kind: "vase", shelf: 0, x: 2.65, scale: .76 },
    { kind: "candles", shelf: 2, x: -2.65, scale: .9 },
    { kind: "vase", shelf: 3, x: 0, scale: .68 },
  ],
];

const createShelfDecoration = ({ kind, scale, variant }) => {
  if (kind === "books") return createBookStack({ aged: false, scale, variant });
  if (kind === "vase") return createVase({ aged: false, scale });
  if (kind === "candles") return createCandleCluster({ aged: false, scale, count: 2 });
  return null;
};

const decorateShelves = (shelves) => {
  shelves.forEach((shelf, shelfIndex) => {
    shelfDecorLayout[shelfIndex].forEach(({ kind, shelf: level, x, z = 0, scale = 1, variant = 0, rotationY = 0 }) => {
      const decoration = createShelfDecoration({ kind, scale, variant });
      if (decoration) shelf.addToShelf(decoration, { shelf: level, x, z, rotationY });
    });
  });
};

const createLivingRoomDecor = ({ shelves, cabinet, hasEntrance }) => {
  decorateShelves(shelves);

  const cabinetVase = createVase({ aged: false, scale: .82 });
  cabinetVase.position.set(0, 3.01, 0);
  cabinet.object3D.add(cabinetVase);

  const plant = createPottedPlant({ aged: false, scale: 1.2 });
  plant.position.set(11.55, 0, -9.35);

  const frames = hasEntrance
    ? createWallFrameCluster({
        aged: false,
        scale: .95,
        imagePaths: [
          "/images/decor/family-breakfast.png",
          "/images/decor/family-picnic.png",
          "/images/decor/couple-photo-1980s.png",
        ],
      })
    : null;
  if (frames) {
    frames.position.set(0, 7.1, 14.78);
    frames.rotation.y = Math.PI;
  }

  return { plant, frames };
};

export { createLivingRoomDecor };
