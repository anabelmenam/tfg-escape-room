const optional = (value) => (value ? [value] : []);

const assembleKitchen = ({ room, placeAgainstWall, furniture, fixtures, decor, foodPuzzles, appliancePuzzles }) => {
  const { lightSwitch, livingRoomDoorSwitch, ambientLight, lamps, windows } = fixtures;
  room.add(
    ambientLight,
    ...lamps.map((lamp) => lamp.object3D),
    lightSwitch.object3D,
    livingRoomDoorSwitch.object3D,
    ...windows.map((window) => window.object3D),
    ...furniture.furniture.map((object) => object.object3D),
    decor.plant,
    decor.frames,
  );
  placeAgainstWall(lightSwitch, "back");
  placeAgainstWall(livingRoomDoorSwitch, "left");
  room.updateMatrixWorld(true);
  return {
    objectColliders: [
      ...furniture.furniture.map((object) => object.getCollider()),
      ...windows.map((window) => window.getCollider()),
    ],
    interactables: [
      lightSwitch,
      livingRoomDoorSwitch,
      ...furniture.openables.flatMap((object) => object.getInteractables()),
      foodPuzzles.recipe,
      appliancePuzzles.stove,
      foodPuzzles.table,
      appliancePuzzles.ovenControls,
      ...foodPuzzles.ingredients,
      ...foodPuzzles.napkins,
      ...optional(appliancePuzzles.mosaicTile),
    ],
    entities: [
      lightSwitch,
      livingRoomDoorSwitch,
      ...lamps,
      ...furniture.furniture,
      foodPuzzles.recipe,
      appliancePuzzles.stove,
      foodPuzzles.table,
      appliancePuzzles.ovenControls,
      ...foodPuzzles.ingredients,
      ...foodPuzzles.napkins,
      ...optional(appliancePuzzles.mosaicTile),
    ],
  };
};

export { assembleKitchen };
