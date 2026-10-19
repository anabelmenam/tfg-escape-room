import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import {
  Bed,
  Cabinet,
  Carpet,
  Chair,
  Desk,
  Lamp,
  Switch,
  Wardrobe,
  Window,
  applyAgedFurnitureAppearance,
  createArtSupplies,
  createBookStack,
  createDecorativeGlobe,
  createToyBasket,
  createWallFrameCluster,
} from "../objects/index.js";

const childrenRoomConfig = {
  past: {
    wallColor: 0xaaa69b,
    floorColor: 0x514640,
    ceilingColor: 0x918e86,
    blanketColors: [0x596572, 0x756064],
    carpetColor: 0x5c554c,
    accentColors: [0x76534e, 0x4f606d, 0x776b48, 0x52614f],
    ambientIntensity: 0.42,
  },
  present: {
    wallColor: 0xaaa69b,
    floorColor: 0x514640,
    ceilingColor: 0x918e86,
    blanketColors: [0x596572, 0x756064],
    carpetColor: 0x5c554c,
    accentColors: [0x76534e, 0x4f606d, 0x776b48, 0x52614f],
    ambientIntensity: 0.42,
  },
};

const woodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x765137,
  darkWoodColor: 0x4c3225,
  interiorColor: 0x805c43,
  drawerInteriorColor: 0x805c43,
  handleColor: 0xb18b4f,
};

const createToyBlocks = (colors) => {
  const group = new THREE.Group();
  group.name = "children-room-toy-blocks";
  [
    [-0.65, 0.32, 0, 0],
    [0, 0.32, 0.1, 1],
    [0.58, 0.32, -0.08, 2],
    [-0.22, 0.94, 0.02, 3],
    [0.42, 0.94, 0, 0],
  ].forEach(([x, y, z, colorIndex]) => {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.58, 0.58),
      new THREE.MeshStandardMaterial({ color: colors[colorIndex], roughness: 0.85 }),
    );
    block.position.set(x, y, z);
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
  });
  return group;
};

const createChildrenRoom = ({ timeline = "present", testMode = false } = {}) => {
  const config = childrenRoomConfig[timeline];
  if (!config) throw new Error(`Timeline no válido para ChildrenRoom: ${timeline}`);

  const width = 22;
  const depth = 20;
  const height = 12;
  const { room, roomColliders, bounds, windowOpenings, placeAgainstWall } = createRoom({
    width,
    depth,
    height,
    wallColor: config.wallColor,
    floorColor: config.floorColor,
    ceilingColor: config.ceilingColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 6, y: 5 },
    floorTextureRepeat: { x: 9, y: 9 },
    ceilingTextureRepeat: { x: 6, y: 5 },
    door: { wall: "front", position: 0, width: 5, height: 8 },
    omitWalls: ["front"],
    windows: [{ id: "children-room-window-1", wall: "back", position: 0, width: 7, height: 4.5, bottom: 4 }],
  });

  room.name = `Children Room-${timeline}`;
  room.userData.timeline = timeline;

  const ambientLight = new THREE.AmbientLight(0xb9c6d4, config.ambientIntensity);
  const lamps = [-5.5, 5.5].map((x, index) => {
    const lamp = new Lamp({
      id: `children-room-${timeline}-lamp-${index + 1}`,
      position: new THREE.Vector3(x, height, 0),
    });
    return lamp;
  });
  const setRoomLights = (active) => {
    lamps.forEach((lamp) => lamp.setActive(active));
  };
  setRoomLights(testMode);

  const lightSwitch = new Switch({
    id: `children-room-${timeline}-switch`,
    position: new THREE.Vector3(width / 2, 3.5, 7.2),
    scale: 0.75,
    onPress: (switchObject) => setRoomLights(switchObject.active),
  });
  lightSwitch.object3D.rotation.y = -Math.PI / 2;

  room.add(ambientLight, ...lamps.map((lamp) => lamp.object3D), lightSwitch.object3D);
  placeAgainstWall(lightSwitch, "right");

  const windows = windowOpenings.map(
    (opening) =>
      new Window({
        id: opening.id,
        position: opening.position.clone(),
        rotationY: opening.rotationY,
        width: opening.width,
        height: opening.height,
      }),
  );
  room.add(...windows.map((window) => window.object3D));

  const beds = [
    new Bed({
      id: "children-room-bed-1",
      position: new THREE.Vector3(-8.5, 0, -5.5),
      rotationY: 0,
      scale: 1,
      size: "single",
      ...woodStyle,
      blanketColor: config.blanketColors[0],
      pillowColor: 0xe8dfcd,
    }),
    new Bed({
      id: "children-room-bed-2",
      position: new THREE.Vector3(8.5, 0, -5.5),
      rotationY: 0,
      scale: 1,
      size: "single",
      ...woodStyle,
      blanketColor: config.blanketColors[1],
      pillowColor: 0xe8dfcd,
    }),
  ];

  // Keep the study area clear of the foot of the beds. The desks are later
  // snapped to the side walls, so only their Z coordinate controls this gap.
  const studyAreaZ = 2;
  const desks = [-0.7, 0.7].map(
    (side, index) =>
      new Desk({
        id: `children-room-desk-${index + 1}`,
        position: new THREE.Vector3(side * 9.2, 0, studyAreaZ),
        rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
        scale: 0.68,
        ...woodStyle,
      }),
  );

  const chairs = [-1, 1].map(
    (side, index) =>
      new Chair({
        id: `children-room-chair-${index + 1}`,
        position: new THREE.Vector3(side * 6.7, 0, studyAreaZ),
        rotationY: side < 0 ? -Math.PI / 2 : Math.PI / 2,
        scale: 0.58,
        ...woodStyle,
      }),
  );

  const wardrobes = [-1.2, 1.2].map(
    (side, index) =>
      new Wardrobe({
        id: `children-room-wardrobe-${index + 1}`,
        position: new THREE.Vector3(side * 5.4, 0, 8.4),
        rotationY: Math.PI,
        scale: 0.78,
        ...woodStyle,
      }),
  );
  const dresser = new Cabinet({
    id: "children-room-dresser",
    position: new THREE.Vector3(0, 0, -8.3),
    width: 7,
    height: 3,
    depth: 2,
    rows: 4,
    columns: 2,
    handleType: "knob",
    ...woodStyle,
  });

  const carpets = [-2, 2].map(
    (side, index) =>
      new Carpet({
        id: `children-room-carpet-${index + 1}`,
        position: new THREE.Vector3(side * 4.2, 0.02, 1.7),
        width: 4,
        depth: 6.5,
        color: index === 0 ? config.blanketColors[0] : config.blanketColors[1],
        texture: "/textures/furniture/carpet.jpg",
        textureRepeat: { x: 2, y: 2 },
      }),
  );
  const toyBlocks = createToyBlocks(config.accentColors);
  toyBlocks.position.set(1.8, 0, 4.8);

  const agedDecor = true;
  const deskBooks = createBookStack({ aged: agedDecor, scale: 0.72 });
  deskBooks.position.set(-1.2, 3.35, 0.05);
  deskBooks.rotation.y = 0.18;
  desks[0].object3D.add(deskBooks);
  const drawingSet = createArtSupplies({ aged: agedDecor, scale: 0.82, variant: "drawing" });
  drawingSet.position.set(0, 3.35, 0.05);
  drawingSet.rotation.y = -0.12;
  desks[1].object3D.add(drawingSet);
  const toyBasket = createToyBasket({ aged: agedDecor, scale: 0.95 });
  toyBasket.position.set(-1.7, 0, 6.2);
  toyBasket.rotation.y = -0.18;

  const globe = createDecorativeGlobe({ aged: agedDecor, scale: 0.72 });
  globe.position.set(2.1, 3.12, 0);
  dresser.object3D.add(globe);

  const wallArt = createWallFrameCluster({ aged: agedDecor, scale: 0.82 });
  wallArt.position.set(-7.1, 7.15, -9.78);

  room.add(
    ...beds.map((bed) => bed.object3D),
    ...desks.map((desk) => desk.object3D),
    ...chairs.map((chair) => chair.object3D),
    ...wardrobes.map((wardrobe) => wardrobe.object3D),
    dresser.object3D,
    ...carpets.map((carpet) => carpet.object3D),
    toyBlocks,
    toyBasket,
    wallArt,
  );

  beds.forEach((bed) => placeAgainstWall(bed, "back"));
  placeAgainstWall(desks[0], "left");
  placeAgainstWall(desks[1], "right");
  wardrobes.forEach((wardrobe) => placeAgainstWall(wardrobe, "front"));
  placeAgainstWall(dresser, "back");

  [...beds, ...desks, ...chairs, ...wardrobes, dresser, ...carpets].forEach((object) => {
    applyAgedFurnitureAppearance(object.object3D);
  });

  room.updateMatrixWorld(true);
  const furniture = [...beds, ...desks, ...chairs, ...wardrobes, dresser];
  const interactables = [
    lightSwitch,
    ...desks.flatMap((desk) => desk.getInteractables()),
    ...wardrobes.flatMap((wardrobe) => wardrobe.getInteractables()),
    ...dresser.getInteractables(),
  ];

  return {
    room,
    roomColliders,
    objectColliders: [
      ...furniture.map((object) => object.getCollider()),
      ...windows.map((window) => window.getCollider()),
    ],
    bounds,
    dimensions: { width, depth, height },
    interactables,
    entities: [lightSwitch, ...lamps, ...desks, ...wardrobes, dresser],
  };
};

export { createChildrenRoom };
