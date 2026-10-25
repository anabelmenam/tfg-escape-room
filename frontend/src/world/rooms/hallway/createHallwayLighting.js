import * as THREE from "three";
import { Lamp, Switch } from "../../objects/index.js";

const createHallwayLighting = ({ timeline, connectionX, dimensions }) => {
  const lamps = [connectionX + 10, connectionX + 30].map((x, index) => new Lamp({ id: `hallway-${timeline}-lamp-${index + 1}`, position: new THREE.Vector3(x, dimensions.height, 0) }));
  lamps.forEach((lamp) => lamp.setActive(false));
  const switches = [];
  const onPress = (pressed) => {
    lamps.forEach((lamp) => lamp.setActive(pressed.active));
    switches.forEach((item) => { if (item !== pressed) item.setActive(pressed.active); });
  };
  const hallwaySwitch = new Switch({ id: `hallway-${timeline}-switch`, position: new THREE.Vector3(connectionX + 3, 4, -dimensions.depth / 2 + .48), scale: .75, onPress });
  const exitSwitch = new Switch({ id: `hallway-${timeline}-exit-switch`, position: new THREE.Vector3(0, 4, 3.5), scale: .75, onPress });
  exitSwitch.object3D.rotation.y = -Math.PI / 2;
  switches.push(hallwaySwitch, exitSwitch);
  return { ambientLight: new THREE.AmbientLight(0xfff4df, .3), lamps, hallwaySwitch, exitSwitch };
};
export { createHallwayLighting };
