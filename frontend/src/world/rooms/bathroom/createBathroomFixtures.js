import * as THREE from "three";
import { Lamp, Switch, Window } from "../../objects/index.js";

const createBathroomFixtures = ({ timeline, config, dimensions, windowOpenings }) => {
  const lamp = new Lamp({ id: `bathroom-${timeline}-lamp`, position: new THREE.Vector3(0, dimensions.height, 0), intensityScale: .78 });
  lamp.setActive(false);
  const lightSwitch = new Switch({ id: `bathroom-${timeline}-switch`, position: new THREE.Vector3(dimensions.width / 2, 3.5, -3.4), scale: .75, onPress: (item) => lamp.setActive(item.active) });
  lightSwitch.object3D.rotation.y = -Math.PI / 2;
  const windows = windowOpenings.map((opening) => new Window({ id: opening.id, position: opening.position.clone(), rotationY: opening.rotationY, width: opening.width, height: opening.height, glassColor: 0xcfe4df, glassOpacity: .58, columns: 3, rows: 2 }));
  return { ambientLight: new THREE.AmbientLight(0xe8f3ed, config.ambientIntensity), lamp, lightSwitch, windows };
};
export { createBathroomFixtures };
