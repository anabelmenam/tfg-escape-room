import * as THREE from "three";
import { Lamp, Switch, Window } from "../../objects/index.js";

const createKitchenFixtures = ({ character, config, dimensions, windowOpenings }) => {
  const lamps = [-6, 6].map(
    (z, index) =>
      new Lamp({
        id: `kitchen-${character}-lamp-${index + 1}`,
        position: new THREE.Vector3(0, dimensions.height, z),
      }),
  );
  lamps.forEach((lamp) => lamp.setActive(false));
  const switches = [];
  const setLights = (active) => {
    lamps.forEach((lamp) => lamp.setActive(active));
    switches.forEach((item) => item.setActive(active));
  };
  const lightSwitch = new Switch({
    id: `kitchen-${character}-switch`,
    position: new THREE.Vector3(-3.8, 3.5, -dimensions.depth / 2),
    scale: 0.75,
    onPress: (item) => setLights(item.active),
  });
  const livingRoomDoorSwitch = new Switch({
    id: `kitchen-${character}-living-room-switch`,
    position: new THREE.Vector3(-dimensions.width / 2, 3.5, 5),
    scale: 0.75,
    onPress: (item) => setLights(item.active),
  });
  livingRoomDoorSwitch.object3D.rotation.y = Math.PI / 2;
  switches.push(lightSwitch, livingRoomDoorSwitch);
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
      }),
  );
  return {
    ambientLight: new THREE.AmbientLight(0xffefd2, config.ambientIntensity),
    lamps,
    lightSwitch,
    livingRoomDoorSwitch,
    windows,
  };
};

export { createKitchenFixtures };
