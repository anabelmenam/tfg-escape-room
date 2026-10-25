const optional = (value) => (value ? [value] : []);

const assembleChildrenRoom = ({ room, placeAgainstWall, character, furniture, fixtures, decor, blockPuzzle, photoPuzzle, musicPuzzle, wardrobePuzzle }) => {
  const { beds, desks, chairs, wardrobes, dresser, carpets } = furniture;
  const { ambientLight, lamps, lightSwitch, windows } = fixtures;
  room.add(
    ambientLight,
    ...lamps.map((lamp) => lamp.object3D),
    lightSwitch.object3D,
    ...windows.map((window) => window.object3D),
    ...beds.map((bed) => bed.object3D),
    ...desks.map((desk) => desk.object3D),
    ...chairs.map((chair) => chair.object3D),
    ...wardrobes.map((wardrobe) => wardrobe.object3D),
    dresser.object3D,
    ...carpets.map((carpet) => carpet.object3D),
    decor.wallArt,
  );
  if (character === "mum") room.add(photoPuzzle.puzzle.object3D);

  placeAgainstWall(lightSwitch, "front");
  beds.forEach((bed) => placeAgainstWall(bed, "back"));
  placeAgainstWall(desks[0], "left");
  placeAgainstWall(desks[1], "right");
  wardrobes.forEach((wardrobe) => placeAgainstWall(wardrobe, "front"));
  placeAgainstWall(dresser, "back");
  room.updateMatrixWorld(true);

  const collidableFurniture = [...beds, ...desks, ...chairs, ...wardrobes, dresser];
  return {
    objectColliders: [
      ...collidableFurniture.map((object) => object.getCollider()),
      ...windows.map((window) => window.getCollider()),
    ],
    interactables: [
      lightSwitch,
      ...desks.flatMap((desk) => desk.getInteractables()),
      ...wardrobes.flatMap((wardrobe) => wardrobe.getInteractables()),
      ...dresser.getInteractables(),
      blockPuzzle.puzzle,
      musicPuzzle.puzzle,
      photoPuzzle.puzzle,
      ...optional(musicPuzzle.boltCutters),
      ...optional(wardrobePuzzle.chains),
      ...photoPuzzle.photos,
      ...optional(photoPuzzle.musicBoxKey),
      ...optional(blockPuzzle.pushpin),
      ...optional(wardrobePuzzle.crowbar),
      ...optional(wardrobePuzzle.finalKey),
    ],
    entities: [
      lightSwitch,
      ...lamps,
      ...desks,
      ...wardrobes,
      dresser,
      blockPuzzle.puzzle,
      musicPuzzle.puzzle,
      photoPuzzle.puzzle,
      ...optional(musicPuzzle.boltCutters),
      ...optional(wardrobePuzzle.chains),
      ...photoPuzzle.photos,
      ...optional(photoPuzzle.musicBoxKey),
      ...optional(blockPuzzle.pushpin),
      ...optional(wardrobePuzzle.crowbar),
      ...optional(wardrobePuzzle.finalKey),
    ],
  };
};

export { assembleChildrenRoom };
