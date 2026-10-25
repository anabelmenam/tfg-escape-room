const assembleBedroom = ({
  room,
  placeAgainstWall,
  character,
  furniture,
  fixtures,
  decor,
  items,
  radioPuzzle,
  powerPuzzles,
}) => {
  const { bed, nightstand1, nightstand2, wardrobe, cabinet, desk, chair, carpet } = furniture;
  const { door, windows, lamp, lightSwitch1, lightSwitch2 } = fixtures;
  const { alarmClock, safe, familyPhoto, electricalPanel, lock } = powerPuzzles;

  room.add(alarmClock.object3D);
  if (character === "mum") room.add(safe.object3D);
  else room.add(familyPhoto.object3D, electricalPanel.object3D, radioPuzzle.radioNote.object3D);
  room.add(
    carpet.object3D,
    wardrobe.object3D,
    cabinet.object3D,
    lightSwitch1.object3D,
    lightSwitch2.object3D,
    lamp.object3D,
    door.object3D,
    desk.object3D,
    bed.object3D,
    nightstand1.object3D,
    nightstand2.object3D,
    chair.object3D,
    decor.landscape.object3D,
    ...windows.map((window) => window.object3D),
  );

  placeAgainstWall(lightSwitch1, "front");
  placeAgainstWall(lightSwitch2, "back");
  placeAgainstWall(bed, "back");
  placeAgainstWall(nightstand1, "back");
  alarmClock.object3D.position.add(placeAgainstWall(nightstand2, "back"));
  const wardrobeOffset = placeAgainstWall(wardrobe, "right");
  safe?.object3D.position.add(wardrobeOffset);
  placeAgainstWall(cabinet, "left");
  placeAgainstWall(desk, "right");
  if (familyPhoto) placeAgainstWall(familyPhoto, "right");
  if (electricalPanel) placeAgainstWall(electricalPanel, "left");
  room.updateMatrixWorld(true);

  const optional = (value) => (value ? [value] : []);
  return {
    objectColliders: [
      bed,
      nightstand1,
      nightstand2,
      wardrobe,
      desk,
      chair,
      cabinet,
      ...windows,
    ].map((object) => object.getCollider()),
    interactables: [
      door,
      lightSwitch1,
      lightSwitch2,
      ...optional(items.key),
      ...optional(items.radioDial),
      ...optional(items.clockHand),
      ...optional(items.fuse),
      ...optional(items.flashlight),
      ...items.paintingFragments,
      ...furniture.nightstand1Interactables,
      ...furniture.nightstand2Interactables,
      ...furniture.wardrobeInteractables,
      ...furniture.deskInteractables,
      ...furniture.cabinetInteractables,
      ...optional(lock),
      ...optional(safe),
      ...optional(familyPhoto),
      ...optional(radioPuzzle.sewingBox),
      ...optional(radioPuzzle.planPaper),
      ...optional(radioPuzzle.radio),
      ...optional(radioPuzzle.radioNote),
      ...optional(radioPuzzle.finalKey),
      ...optional(electricalPanel),
      carpet,
      decor.deskLamp,
    ],
    entities: [
      door,
      lamp,
      lightSwitch1,
      lightSwitch2,
      ...optional(items.key),
      ...optional(items.radioDial),
      ...optional(items.clockHand),
      ...optional(items.fuse),
      ...optional(items.flashlight),
      ...items.paintingFragments,
      nightstand1,
      nightstand2,
      wardrobe,
      desk,
      decor.deskPaper,
      decor.deskLamp,
      cabinet,
      carpet,
      ...optional(lock),
      ...optional(safe),
      ...optional(radioPuzzle.sewingBox),
      ...optional(radioPuzzle.planPaper),
      ...optional(radioPuzzle.radio),
      ...optional(radioPuzzle.radioNote),
      ...optional(radioPuzzle.finalKey),
      ...optional(electricalPanel),
    ],
  };
};

export { assembleBedroom };
