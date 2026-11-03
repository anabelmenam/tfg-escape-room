const optional = (value) => (value ? [value] : []);
const assembleBathroom = ({ room, placeAgainstWall, furniture, fixtures, decor, puzzles }) => {
  room.add(
    fixtures.ambientLight,
    fixtures.lamp.object3D,
    fixtures.lightSwitch.object3D,
    ...fixtures.windows.map((window) => window.object3D),
    furniture.vanity.object3D,
    furniture.toilet.object3D,
    furniture.bathtub.object3D,
    furniture.towelRail.object3D,
    furniture.mirror.object3D,
    furniture.bathMat.object3D,
    decor.trashBin,
    decor.plant,
    puzzles.mosaic.object3D,
    ...optional(puzzles.steam?.effects3D),
  );
  placeAgainstWall(fixtures.lightSwitch, "right");
  room.updateMatrixWorld(true);
  return {
    objectColliders: [
      ...furniture.solidFurniture.map((object) => object.getCollider()),
      ...fixtures.windows.map((window) => window.getCollider()),
    ],
    interactables: [
      fixtures.lightSwitch,
      ...furniture.vanity.getInteractables(),
      ...furniture.toilet.getInteractables(),
      ...furniture.bathtub.getInteractables(),
      ...optional(puzzles.steam),
      ...optional(puzzles.sinkWaterControl),
      ...optional(puzzles.sequenceLock),
      ...optional(puzzles.screwdriver),
      puzzles.mosaic,
      ...optional(puzzles.finalKey),
    ],
    entities: [
      fixtures.lightSwitch,
      fixtures.lamp,
      furniture.vanity,
      furniture.toilet,
      furniture.bathtub,
      furniture.towelRail,
      furniture.bathMat,
      ...optional(puzzles.steam),
      ...optional(puzzles.sequenceLock),
      ...optional(puzzles.screwdriver),
      puzzles.mosaic,
      ...optional(puzzles.finalKey),
    ],
  };
};
export { assembleBathroom };
