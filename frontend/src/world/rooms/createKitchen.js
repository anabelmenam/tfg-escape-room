import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import {
  Chair,
  CooktopCounter,
  KitchenCounter,
  KitchenTallCabinet,
  Lamp,
  Oven,
  Refrigerator,
  Switch,
  Table,
  Window,
  applyAgedFurnitureAppearance,
  createFruitBowl,
  createHangingPanRack,
  createKitchenCanisterSet,
  createKitchenPrepSet,
  createPottedPlant,
  createUtensilCrock,
  createWallFrameCluster,
} from "../objects/index.js";

const kitchenConfig = {
  past: {
    wallColor: 0xa7a49c,
    floorColor: 0x504b46,
    cabinetColor: 0x51443b,
    applianceColor: 0xaaa9a1,
    ambientIntensity: 0.26,
  },
  present: {
    wallColor: 0xa7a49c,
    floorColor: 0x504b46,
    cabinetColor: 0x51443b,
    applianceColor: 0xaaa9a1,
    ambientIntensity: 0.26,
  },
};

const kitchenWoodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x6b4b35,
  darkWoodColor: 0x443126,
};

const createKitchen = ({ timeline = "present", testMode = false } = {}) => {
  const config = kitchenConfig[timeline];
  if (!config) throw new Error(`Timeline no válido para Kitchen: ${timeline}`);

  const width = 18;
  const depth = 26;
  const height = 12;
  const { room, roomColliders, bounds, windowOpenings, placeAgainstWall } = createRoom({
    width,
    depth,
    height,
    wallColor: config.wallColor,
    floorColor: config.floorColor,
    ceilingColor: config.wallColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 7, y: 7 },
    floorTextureRepeat: { x: 9, y: 13 },
    ceilingTextureRepeat: { x: 5, y: 8 },
    door: null,
    passages: [
      { id: "kitchen-hallway-connection", wall: "back", position: 0, width: 5, height: 8 },
      { id: "kitchen-living-room-connection", wall: "left", position: 9, width: 5, height: 8 },
    ],
    omitWalls: ["back", "left"],
    windows: [
      { id: `kitchen-${timeline}-window`, wall: "front", position: 0, width: 8, height: 6, bottom: 3.2 },
      { id: `kitchen-${timeline}-sink-window`, wall: "right", position: -2.1, width: 5.4, height: 6, bottom: 3.2 },
    ],
  });
  room.name = `Kitchen-${timeline}`;
  room.userData.timeline = timeline;

  const ambientLight = new THREE.AmbientLight(0xc0c6c4, config.ambientIntensity);
  const lamps = [-6, 6].map((z, index) =>
    new Lamp({ id: `kitchen-${timeline}-lamp-${index + 1}`, position: new THREE.Vector3(0, height, z) }),
  );
  lamps.forEach((lamp) => lamp.setActive(testMode));
  const kitchenSwitches = [];
  const setKitchenLights = (active) => {
    lamps.forEach((lamp) => lamp.setActive(active));
    kitchenSwitches.forEach((switchObject) => switchObject.setActive(active));
  };
  const lightSwitch = new Switch({
    id: `kitchen-${timeline}-switch`,
    position: new THREE.Vector3(-3.8, 3.5, -depth / 2),
    scale: 0.75,
    onPress: (switchObject) => setKitchenLights(switchObject.active),
  });
  const livingRoomDoorSwitch = new Switch({
    id: `kitchen-${timeline}-living-room-switch`,
    position: new THREE.Vector3(-width / 2, 3.5, 5),
    scale: 0.75,
    onPress: (switchObject) => setKitchenLights(switchObject.active),
  });
  livingRoomDoorSwitch.object3D.rotation.y = Math.PI / 2;
  kitchenSwitches.push(lightSwitch, livingRoomDoorSwitch);

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

  const refrigerator = new Refrigerator({
    id: `kitchen-${timeline}-refrigerator`,
    position: new THREE.Vector3(7.25, 0, -11.1),
    rotationY: -Math.PI / 2,
    color: config.applianceColor,
  });
  const counter = new KitchenCounter({
    id: `kitchen-${timeline}-counter`,
    position: new THREE.Vector3(7.75, 0, -2.1),
    rotationY: -Math.PI / 2,
    width: 8.5,
    cabinetColor: config.cabinetColor,
  });
  const oven = new Oven({
    id: `kitchen-${timeline}-oven`,
    position: new THREE.Vector3(7.55, 0, -7.85),
    rotationY: -Math.PI / 2,
    bodyColor: config.applianceColor,
    cabinetColor: config.cabinetColor,
  });
  const cooktopCounter = new CooktopCounter({
    id: `kitchen-${timeline}-cooktop-counter`,
    position: new THREE.Vector3(7.75, 0, 3.75),
    rotationY: -Math.PI / 2,
    width: 3,
    cabinetColor: config.cabinetColor,
  });
  const smallCounter = new KitchenCounter({
    id: `kitchen-${timeline}-small-counter`,
    position: new THREE.Vector3(7.75, 0, 5.95),
    rotationY: -Math.PI / 2,
    width: 1.2,
    cabinetColor: config.cabinetColor,
    hasSink: false,
  });
  const firstTallCabinet = new KitchenTallCabinet({
    id: `kitchen-${timeline}-tall-cabinet-1`,
    position: new THREE.Vector3(7.5, 0, 8.1),
    rotationY: -Math.PI / 2,
    color: config.cabinetColor,
    hingeSide: "left",
  });
  const secondTallCabinet = new KitchenTallCabinet({
    id: `kitchen-${timeline}-tall-cabinet-2`,
    position: new THREE.Vector3(7.5, 0, 11.15),
    rotationY: -Math.PI / 2,
    color: config.cabinetColor,
    hingeSide: "right",
  });
  const diningTable = new Table({
    id: `kitchen-${timeline}-table`,
    position: new THREE.Vector3(-4.5, 0, -1),
    rotationY: Math.PI / 2,
    width: 7,
    height: 2.6,
    depth: 3.5,
    hasShelf: false,
    createCollider: true,
    ...kitchenWoodStyle,
  });
  const chairs = [
    new Chair({ id: `kitchen-${timeline}-chair-1`, position: new THREE.Vector3(-7.2, 0, -2.7), rotationY: Math.PI / 2, scale: 0.74, ...kitchenWoodStyle }),
    new Chair({ id: `kitchen-${timeline}-chair-2`, position: new THREE.Vector3(-7.2, 0, 0.7), rotationY: Math.PI / 2, scale: 0.74, ...kitchenWoodStyle }),
    new Chair({ id: `kitchen-${timeline}-chair-3`, position: new THREE.Vector3(-1.8, 0, -2.7), rotationY: -Math.PI / 2, scale: 0.74, ...kitchenWoodStyle }),
    new Chair({ id: `kitchen-${timeline}-chair-4`, position: new THREE.Vector3(-1.8, 0, 0.7), rotationY: -Math.PI / 2, scale: 0.74, ...kitchenWoodStyle }),
  ];
  const agedDecor = true;
  const fruitBowl = createFruitBowl({ aged: agedDecor, scale: 1.05 });
  fruitBowl.position.set(0, 2.78, 0);
  diningTable.object3D.add(fruitBowl);
  const utensils = createUtensilCrock({ aged: agedDecor, scale: 0.9 });
  utensils.position.set(-3.25, 2.8, 0.15);
  const canisters = createKitchenCanisterSet({ aged: agedDecor, scale: 0.9 });
  canisters.position.set(3.05, 2.8, 0.05);
  counter.object3D.add(utensils, canisters);
  const prepSet = createKitchenPrepSet({ aged: agedDecor, scale: 0.72 });
  prepSet.position.set(0, 2.8, 0);
  smallCounter.object3D.add(prepSet);
  const kitchenPlant = createPottedPlant({ aged: agedDecor, scale: 1.05 });
  kitchenPlant.position.set(-7.2, 0, 10.8);
  const panRack = createHangingPanRack({ aged: agedDecor, scale: 0.82 });
  panRack.position.set(width / 2 - 0.2, 6.35, 3.75);
  panRack.rotation.y = -Math.PI / 2;
  const kitchenFrames = createWallFrameCluster({
    aged: agedDecor,
    scale: 0.8,
    imagePaths: ["/images/decor/kitchen-still-life.png", "", ""],
  });
  kitchenFrames.position.set(-6.35, 7, depth / 2 - 0.22);
  kitchenFrames.rotation.y = Math.PI;
  room.add(
    ambientLight,
    ...lamps.map((lamp) => lamp.object3D),
    lightSwitch.object3D,
    livingRoomDoorSwitch.object3D,
    ...windows.map((window) => window.object3D),
    refrigerator.object3D,
    oven.object3D,
    counter.object3D,
    cooktopCounter.object3D,
    smallCounter.object3D,
    firstTallCabinet.object3D,
    secondTallCabinet.object3D,
    kitchenPlant,
    panRack,
    kitchenFrames,
    diningTable.object3D,
    ...chairs.map((chair) => chair.object3D),
  );
  placeAgainstWall(lightSwitch, "back");
  placeAgainstWall(livingRoomDoorSwitch, "left");

  [refrigerator, oven, counter, cooktopCounter, smallCounter, firstTallCabinet, secondTallCabinet, diningTable, ...chairs].forEach((object) => {
    applyAgedFurnitureAppearance(object.object3D, { intensity: 0.42, wearColor: 0x575650 });
  });

  room.updateMatrixWorld(true);
  const furniture = [
    refrigerator,
    oven,
    counter,
    cooktopCounter,
    smallCounter,
    firstTallCabinet,
    secondTallCabinet,
    diningTable,
    ...chairs,
  ];
  const kitchenOpenables = [refrigerator, oven, counter, cooktopCounter, smallCounter, firstTallCabinet, secondTallCabinet];

  return {
    room,
    roomColliders,
    objectColliders: [
      ...furniture.map((object) => object.getCollider()),
      ...windows.map((window) => window.getCollider()),
    ],
    bounds,
    dimensions: { width, depth, height },
    interactables: [
      lightSwitch,
      livingRoomDoorSwitch,
      ...kitchenOpenables.flatMap((object) => object.getInteractables()),
    ],
    entities: [lightSwitch, livingRoomDoorSwitch, ...lamps, ...furniture],
    lightSwitch,
    livingRoomDoorSwitch,
    lamps,
  };
};

export { createKitchen };
