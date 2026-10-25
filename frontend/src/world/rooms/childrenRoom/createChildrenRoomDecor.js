import { createBookStack, createWallFrameCluster } from "../../objects/index.js";

const createChildrenRoomDecor = ({ desks }) => {
  const deskBooks = createBookStack({ aged: false, scale: 0.72 });
  deskBooks.position.set(-2.6, 3.31, 0.05);
  deskBooks.rotation.y = 0.18;
  desks[0].object3D.add(deskBooks);
  const wallArt = createWallFrameCluster({
    aged: false,
    scale: 0.82,
    imagePaths: [
      "/images/decor/family-picnic.png",
      "/images/decor/family-breakfast.png",
      "/images/decor/family-photo-1980s.png",
    ],
  });
  wallArt.position.set(6.9, 8.65, -9.78);
  return { wallArt };
};

export { createChildrenRoomDecor };
