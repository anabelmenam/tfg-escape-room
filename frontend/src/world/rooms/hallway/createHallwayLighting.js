import * as THREE from "three";
import { Lamp, Switch } from "../../objects/index.js";

const createHallwayLighting = ({ character, connectionX, dimensions }) => {
  const lamps = [connectionX + 10, connectionX + 30].map(
    (x, index) =>
      new Lamp({ id: `hallway-${character}-lamp-${index + 1}`, position: new THREE.Vector3(x, dimensions.height, 0) }),
  );
  lamps.forEach((lamp) => lamp.setActive(false));
  const switches = [];
  const onPress = (pressed) => {
    lamps.forEach((lamp) => lamp.setActive(pressed.active));
    switches.forEach((item) => {
      if (item !== pressed) item.setActive(pressed.active);
    });
  };
  const hallwaySwitch = new Switch({
    id: `hallway-${character}-switch`,
    position: new THREE.Vector3(connectionX + 3, 4, -dimensions.depth / 2 + 0.48),
    scale: 0.75,
    onPress,
  });
  const exitSwitch = new Switch({
    id: `hallway-${character}-exit-switch`,
    position: new THREE.Vector3(0, 4, 3.5),
    scale: 0.75,
    onPress,
  });
  exitSwitch.object3D.rotation.y = -Math.PI / 2;
  switches.push(hallwaySwitch, exitSwitch);
  return { ambientLight: new THREE.AmbientLight(0xfff4df, 0.3), lamps, hallwaySwitch, exitSwitch };
};
export { createHallwayLighting };
