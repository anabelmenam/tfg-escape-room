import * as THREE from "three";
import { Lamp, Switch, Window } from "../../objects/index.js";

const createChildrenRoomFixtures = ({ character, config, dimensions, windowOpenings }) => {
  const lamps = [-5.5, 5.5].map((x, index) => new Lamp({
    id: `children-room-${character}-lamp-${index + 1}`,
    position: new THREE.Vector3(x, dimensions.height, 0),
  }));
  const setRoomLights = (active) => lamps.forEach((lamp) => lamp.setActive(active));
  setRoomLights(false);
  const lightSwitch = new Switch({
    id: `children-room-${character}-switch`,
    position: new THREE.Vector3(3.55, 3.5, dimensions.depth / 2),
    scale: 0.75,
    onPress: (switchObject) => setRoomLights(switchObject.active),
  });
  lightSwitch.object3D.rotation.y = Math.PI;
  const windows = windowOpenings.map((opening) => new Window({
    id: opening.id,
    position: opening.position.clone(),
    rotationY: opening.rotationY,
    width: opening.width,
    height: opening.height,
  }));
  return {
    ambientLight: new THREE.AmbientLight(0xfff1d1, config.ambientIntensity),
    lamps,
    lightSwitch,
    windows,
  };
};

export { createChildrenRoomFixtures };
