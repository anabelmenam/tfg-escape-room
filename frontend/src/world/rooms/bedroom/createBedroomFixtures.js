import * as THREE from "three";
import { Door, Lamp, Switch, Window } from "../../objects/index.js";

const createBedroomFixtures = ({
  timeline,
  testMode,
  timelineConfig,
  doorOpening,
  windowOpenings,
  onDoorOpenChange,
  onDoorUnlocked,
}) => {
  const doorPosition = doorOpening.position.clone();
  doorPosition.x -= doorOpening.width / 2;
  doorPosition.y = doorOpening.height / 2;
  const door = new Door({
    id: "bedroom-exit-door",
    position: doorPosition,
    requiredKey: testMode ? null : timeline === "past" ? "bedroom-key" : null,
    locked: !testMode,
    onOpenChange: onDoorOpenChange,
    onUnlock: onDoorUnlocked,
  });
  const windows = windowOpenings.map((opening) => new Window({
    id: opening.id,
    position: opening.position.clone(),
    rotationY: opening.rotationY,
    width: opening.width,
    height: opening.height,
  }));

  const lamp = new Lamp({ id: "bedroom-lamp", position: new THREE.Vector3(0, 12, 0) });
  const lightSwitch1 = new Switch({
    id: `bedroom-${timeline}-switch1`,
    position: new THREE.Vector3(0, 4, 12),
    scale: 0.75,
    powerAvailable: timeline !== "present",
    onPress: () => lamp.setActive(!lamp.getActive()),
  });
  lightSwitch1.object3D.rotation.y = Math.PI;
  const lightSwitch2 = new Switch({
    id: `bedroom-${timeline}-switch2`,
    position: new THREE.Vector3(3, 3.5, -12),
    scale: 0.75,
    powerAvailable: timeline !== "present",
    onPress: () => lamp.setActive(!lamp.getActive()),
  });

  const lights = [new THREE.AmbientLight(0xffffff, timelineConfig.ambientLightIntensity)];
  if (windowOpenings[0]) {
    const exteriorLight = new THREE.SpotLight(0xa9c6f0, 100, 32, Math.PI / 3.1, 0.9, 1.2);
    const exteriorTarget = new THREE.Object3D();
    exteriorLight.position.copy(windowOpenings[0].position).add(new THREE.Vector3(-2.8, 1.4, 0));
    exteriorTarget.position.set(1.5, 1.2, windowOpenings[0].position.z);
    exteriorLight.target = exteriorTarget;
    lights.push(exteriorLight, exteriorTarget);
  }

  return { door, windows, lamp, lightSwitch1, lightSwitch2, lights };
};

export { createBedroomFixtures };
