import * as THREE from "three";
import { Door, Key, Lamp, Switch, Window } from "../../objects/index.js";

const createLivingRoomFixtures = ({
  character,
  testMode,
  entrance,
  kitchenEntrance,
  doorOpening,
  passageOpenings,
  windowOpenings,
  eventManager,
  onSwitchPress,
  onDoorOpenChange,
  onAction,
}) => {
  const kitchenOpening = kitchenEntrance
    ? passageOpenings.find((opening) => opening.id === kitchenEntrance.id)
    : null;
  const kitchenDoor = kitchenOpening
    ? new Door({
        id: "living-room-kitchen-door",
        position: kitchenOpening.position.clone().add(
          new THREE.Vector3(-kitchenOpening.width / 2, 0, 0).applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            kitchenOpening.rotationY,
          ),
        ),
        rotationY: kitchenOpening.rotationY,
        requiredKey: testMode ? null : character === "mum" ? "crowbar" : null,
        locked: !testMode,
        onUnlock: () => onAction?.("object.interact", "living-room-kitchen-door"),
      })
    : null;

  const windows = windowOpenings.map(
    (opening) =>
      new Window({
        id: opening.id,
        position: opening.position.clone(),
        rotationY: opening.rotationY,
        width: opening.width,
        height: opening.height,
        columns: 2,
        rows: 2,
        curtainColor: 0xa47b63,
      }),
  );

  const blueKey = doorOpening
    ? new Key({ id: "blue-key", position: new THREE.Vector3(0, 2, -2) })
    : null;
  const door = doorOpening
    ? new Door({
        id: "living-room-exit-door",
        position: doorOpening.position.clone().add(new THREE.Vector3(-doorOpening.width / 2, 0, 0)),
        requiredKey: "blue-key",
        onOpenChange: onDoorOpenChange,
      })
    : null;

  const lightSwitch = new Switch({
    id: "living-room-switch",
    onPress: onSwitchPress,
    position: new THREE.Vector3(13, 3.5, 3.5),
  });
  lightSwitch.object3D.rotation.y = -Math.PI / 2;

  const entranceLightSwitch = new Switch({
    id: "living-room-entrance-switch",
    onPress: onSwitchPress,
    position: new THREE.Vector3((entrance?.position ?? 0) + (entrance?.width ?? 5) / 2 + 1.5, 3.5, -14.5),
  });
  const lamp = new Lamp({
    id: "living-room-lamp-1",
    position: new THREE.Vector3(0, 12, 0),
    eventManager,
    linkedButton: ["living-room-switch", "living-room-entrance-switch"],
  });
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);

  const applyState = (state) => {
    const kitchenDoorUnlocked = ["mum", "dad"].some((era) =>
      state.characters?.[era]?.objects?.["living-room-kitchen-door"]?.locked === false
      || state.characters?.[era]?.objects?.["hallway-kitchen-door"]?.locked === false,
    );
    if (kitchenDoorUnlocked) kitchenDoor?.unlock({ notify: false });
  };

  return {
    ambientLight,
    windows,
    blueKey,
    door,
    kitchenDoor,
    lightSwitch,
    entranceLightSwitch,
    lamp,
    applyState,
  };
};

export { createLivingRoomFixtures };
