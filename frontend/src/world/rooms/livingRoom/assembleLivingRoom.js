const optional = (value) => (value ? [value] : []);

const assembleLivingRoom = ({
  room,
  placeAgainstWall,
  character,
  fixtures,
  furniture,
  decor,
  paintingPuzzle,
  fireplacePuzzle,
  chestPuzzle,
}) => {
  const { windows, door, kitchenDoor, lightSwitch, entranceLightSwitch, lamp } = fixtures;
  const { sofa, armchairs, table, shelves, cabinet, cabinetInteractables } = furniture;
  const [armchair1, armchair2] = armchairs;
  const [shelf1, shelf2, shelf3] = shelves;
  const { plant, frames } = decor;
  const { rainbowDrawing, fallenPainting, paintingSlot, rainbowBooks } = paintingPuzzle;
  const { fireplace, displayCase, vitrineLetter, emberPuzzle, cushion, match, decorativeCushions } = fireplacePuzzle;
  const { chest, lock, studyKey, finalKey } = chestPuzzle;

  if (character === "mum") room.add(fallenPainting.object3D);
  room.add(
    paintingSlot.object3D,
    sofa.object3D,
    armchair1.object3D,
    armchair2.object3D,
    ...windows.map((window) => window.object3D),
    table.object3D,
    lightSwitch.object3D,
    entranceLightSwitch.object3D,
    lamp.object3D,
    fireplace.object3D,
    shelf1.object3D,
    shelf2.object3D,
    shelf3.object3D,
    cabinet.object3D,
    plant,
  );
  if (door) room.add(door.object3D);
  if (kitchenDoor) room.add(kitchenDoor.object3D);
  if (frames) room.add(frames);

  placeAgainstWall(lightSwitch, "right");
  placeAgainstWall(entranceLightSwitch, "back");
  shelves.forEach((shelf) => placeAgainstWall(shelf, "left"));
  placeAgainstWall(cabinet, "right");
  placeAgainstWall(paintingSlot, "right");
  room.updateMatrixWorld(true);

  return {
    objectColliders: [
      sofa,
      armchair1,
      armchair2,
      table,
      ...optional(chest),
      fireplace,
      shelf1,
      shelf2,
      shelf3,
      cabinet,
      ...windows,
    ].map((object) => object.getCollider()),
    interactables: [
      lightSwitch,
      entranceLightSwitch,
      ...(fixtures.blueKey ? [fixtures.blueKey] : []),
      ...(door ? [door] : []),
      ...(kitchenDoor ? [kitchenDoor] : []),
      ...optional(chest),
      ...(lock ? [lock] : []),
      ...(studyKey ? [studyKey] : []),
      ...(finalKey ? [finalKey] : []),
      cabinet,
      ...cabinetInteractables,
      shelf1,
      ...rainbowBooks,
      ...(rainbowDrawing ? [rainbowDrawing] : []),
      ...(character === "mum" ? [fallenPainting] : []),
      paintingSlot,
      ...(paintingSlot.hiddenScissors ? [paintingSlot.hiddenScissors] : []),
      ...(cushion ? [cushion, match] : []),
      fireplace,
      ...(displayCase ? [displayCase] : []),
      ...(vitrineLetter ? [vitrineLetter] : []),
      ...(emberPuzzle ? [emberPuzzle] : []),
    ],
    entities: [
      lightSwitch,
      entranceLightSwitch,
      ...(door ? [door] : []),
      ...(kitchenDoor ? [kitchenDoor] : []),
      lamp,
      ...(fixtures.blueKey ? [fixtures.blueKey] : []),
      ...optional(chest),
      ...(lock ? [lock] : []),
      ...(studyKey ? [studyKey] : []),
      ...(finalKey ? [finalKey] : []),
      sofa,
      armchair1,
      armchair2,
      table,
      cabinet,
      ...rainbowBooks,
      ...(character === "mum" ? [fallenPainting] : []),
      ...(paintingSlot.hiddenScissors ? [paintingSlot.hiddenScissors] : []),
      ...(cushion ? [cushion, match] : []),
      fireplace,
      ...(displayCase ? [displayCase] : []),
      ...(vitrineLetter ? [vitrineLetter] : []),
      ...(emberPuzzle ? [emberPuzzle] : []),
      ...decorativeCushions,
      shelf1,
      paintingSlot,
    ],
  };
};

export { assembleLivingRoom };
