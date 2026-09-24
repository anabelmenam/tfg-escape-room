import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { Door, Lamp, Key, Shelf, Window, Cabinet, Chest, Switch, Sofa, Table, Book } from "../objects/index.js";

import { BookPuzzle } from "../puzzles/index.js";

const livingRoomWoodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: {
    x: 1,
    y: 1,
  },
  woodColor: 0x5b3a29,
  darkWoodColor: 0x422a1e,
  interiorColor: 0x6b4734,
  drawerInteriorColor: 0x6b4734,
  handleColor: 0x9b773d,
};

const createLivingRoom = async ({ onSwitchPress, eventManager, onDoorOpenChange, entrance = null } = {}) => {
  const { room, roomColliders, bounds, doorOpening, windowOpenings } = createRoom({
    width: 30,
    depth: 30,
    wallColor: 0xb9aa91,
    floorColor: 0x594438,
    ceilingColor: 0x9e8f7c,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: {
      x: 7,
      y: 7,
    },
    floorTextureRepeat: {
      x: 15,
      y: 15,
    },
    ceilingTextureRepeat: {
      x: 7,
      y: 7,
    },
    windows: [
      {
        id: "living-room-window-1",
        wall: "back",
        position: -7,
        width: 6,
        height: 5,
        bottom: 4,
      },
      {
        id: "living-room-window-2",
        wall: "back",
        position: 7,
        width: 6,
        height: 5,
        bottom: 4,
      },
      {
        id: "living-room-window-3",
        wall: "right",
        position: -3,
        width: 8,
        height: 5,
        bottom: 4,
      },
    ],
    passages: entrance ? [entrance] : [],
    omitWalls: entrance ? [entrance.wall] : [],
  });

  room.name = "Living Room";

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
  room.add(ambientLight);

  const redKey = new Key({
    id: "red-key",
    position: new THREE.Vector3(0, 2, -2),
    color: 0xff0000,
    inventoryIcon: "/images/icons/red-key.png",
  });
  const blueKey = new Key({
    id: "blue-key",
    position: new THREE.Vector3(0, 2, -2),
    color: 0x0000ff,
    inventoryIcon: "/images/icons/blue-key.png",
  });

  const doorPosition = doorOpening.position.clone();
  doorPosition.x -= doorOpening.width / 2;
  doorPosition.y = doorOpening.height / 2;
  const door = new Door({
    id: "living-room-exit-door",
    position: doorPosition,
    requiredKey: "blue-key",
    onOpenChange: onDoorOpenChange,
  });

  const lightSwitch = new Switch({
    id: "living-room-switch",
    onPress: onSwitchPress,
    position: new THREE.Vector3(4, 5, 14.5),
  });
  lightSwitch.object3D.position.set(4, 5, 14.5);
  lightSwitch.object3D.rotation.y = Math.PI;

  const windows = windowOpenings.map((windowOpening) => {
    return new Window({
      id: windowOpening.id,
      position: windowOpening.position.clone(),
      rotationY: windowOpening.rotationY,
      width: windowOpening.width,
      height: windowOpening.height,
    });
  });
  const lamp1 = new Lamp({
    id: "living-room-lamp-1",
    position: new THREE.Vector3(0, 12, 0),
    eventManager,
    linkedButton: "living-room-switch",
  });

  const sofa = new Sofa({
    id: "living-room-sofa",
    position: new THREE.Vector3(-2, 0, -3),
    rotationY: Math.PI / 2,
    seats: 2,
    scale: 1.5,
    width: 6,
    height: 3,
    depth: 3,
  });

  const armchair1 = new Sofa({
    id: "living-room-armchair-1",
    position: new THREE.Vector3(3, 0, 4),
    rotationY: Math.PI,
    seats: 1,
    scale: 1.5,
    width: 3,
    height: 3,
    depth: 3,
  });

  const armchair2 = new Sofa({
    id: "living-room-armchair-2",
    position: new THREE.Vector3(3, 0, -10),
    seats: 1,
    scale: 1.5,
    width: 3,
    height: 3,
    depth: 3,
  });

  const table1 = new Table({
    id: "living-room-table",
    position: new THREE.Vector3(3, 0, -3),
    rotationY: Math.PI / 2,
    scale: 1,
    width: 6,
    height: 2,
    depth: 3,
    ...livingRoomWoodStyle,
    createCollider: true,
  });

  const table2 = new Table({
    id: "living-room-table-2",
    position: new THREE.Vector3(12, 0, 12),
    rotationY: Math.PI / 2,
    scale: 1,
    width: 5,
    height: 3,
    depth: 5,
    ...livingRoomWoodStyle,
    hasShelf: false,
    createCollider: true,
  });

  const shelf1 = new Shelf({
    id: "living-room-shelf-1",
    position: new THREE.Vector3(-13.5, 0, 9.5),
    rotationY: Math.PI / 2,
    backWall: true,
    width: 10,
    height: 7,
    depth: 2,
    shelves: 4,
    thickness: 0.3,
    ...livingRoomWoodStyle,
  });

  const shelf2 = new Shelf({
    id: "living-room-shelf-2",
    position: new THREE.Vector3(-13.5, 0, 0),
    rotationY: Math.PI / 2,
    backWall: true,
    width: 10,
    height: 7,
    depth: 2,
    shelves: 4,
    thickness: 0.3,
    ...livingRoomWoodStyle,
  });

  const shelf3 = new Shelf({
    id: "living-room-shelf-3",
    position: new THREE.Vector3(-13.5, 0, -9.5),
    rotationY: Math.PI / 2,
    backWall: true,
    width: 10,
    height: 7,
    depth: 2,
    shelves: 4,
    thickness: 0.3,
    ...livingRoomWoodStyle,
  });

  const cabinet = new Cabinet({
    id: "living-room-cabinet",
    position: new THREE.Vector3(13.5, 0, -3),
    rotationY: -Math.PI / 2,
    scale: 1,
    width: 10,
    height: 3,
    depth: 2,
    columns: 2,
    rows: 3,
    ...livingRoomWoodStyle,
  });
  const cabinetInteractables = cabinet.getInteractables();

  const chest = new Chest({
    id: "living-room-chest",
    position: new THREE.Vector3(17, 2, 12),
    scale: 1,
    width: 1.5,
    height: 1,
    depth: 1,
    locked: true,
    ...livingRoomWoodStyle,
  });

  const storageBench = new Chest({
    id: "living-room-storage-bench",
    position: new THREE.Vector3(-7, 0, -13),
    scale: 1,
    width: 7,
    height: 2.5,
    depth: 3,
    locked: true,
    requiredKey: "red-key",
    ...livingRoomWoodStyle,
  });

  chest.addItem(redKey, {
    position: new THREE.Vector3(-0.3, 0.25, 0),
    scale: 1.5,
  });

  storageBench.addItem(blueKey, {
    position: new THREE.Vector3(0, 0.25, 0),
    scale: 1.5,
  });

  shelf2.addToShelf(chest.object3D, {
    shelf: 1,
    x: 0,
    z: 2,
    placeOnSurface: false,
  });

  const book1 = new Book({
    id: "book-1",
    symbol: "cross",
    currentSlot: 0,
    correctSlot: 3,
    rotationY: Math.PI / 2,
  });
  shelf1.addToShelf(book1.object3D, {
    shelf: 1,
    x: 2.7,
    z: 0,
  });

  const book2 = new Book({
    id: "book-2",
    symbol: "triangle",
    currentSlot: 1,
    correctSlot: 0,
    rotationY: Math.PI / 2,
  });
  shelf1.addToShelf(book2.object3D, {
    shelf: 1,
    x: 3.2,
    z: 0,
  });
  const book3 = new Book({
    id: "book-3",
    symbol: "square",
    currentSlot: 2,
    correctSlot: 2,
    rotationY: Math.PI / 2,
  });
  shelf1.addToShelf(book3.object3D, {
    shelf: 1,
    x: 3.7,
    z: 0,
  });

  const book4 = new Book({
    id: "book-4",
    symbol: "circle",
    currentSlot: 3,
    correctSlot: 1,
    rotationY: Math.PI / 2,
  });
  shelf1.addToShelf(book4.object3D, {
    shelf: 1,
    x: 4.2,
    z: 0,
  });

  const bookPuzzle = new BookPuzzle({
    books: [book4, book2, book1, book3],
    onSolved: () => {
      chest.unlock();
      shelf1.openMechanism({
        angle: -Math.PI / 2,
        duration: 2,
        side: "left",
      });
    },
  });

  book4.setOnInteract(bookPuzzle.handleBookInteraction.bind(bookPuzzle));
  book2.setOnInteract(bookPuzzle.handleBookInteraction.bind(bookPuzzle));
  book3.setOnInteract(bookPuzzle.handleBookInteraction.bind(bookPuzzle));
  book1.setOnInteract(bookPuzzle.handleBookInteraction.bind(bookPuzzle));

  room.add(sofa.object3D);
  room.add(armchair1.object3D);
  room.add(armchair2.object3D);
  room.add(table1.object3D);
  room.add(door.object3D);
  room.add(lightSwitch.object3D);
  room.add(lamp1.object3D);
  room.add(table2.object3D);
  room.add(shelf1.object3D);
  room.add(shelf2.object3D);
  room.add(shelf3.object3D);
  room.add(cabinet.object3D);
  room.add(storageBench.object3D);
  windows.forEach((window) => {
    room.add(window.object3D);
  });

  const sofaCollider = sofa.getCollider();
  const armchair1Collider = armchair1.getCollider();
  const armchair2Collider = armchair2.getCollider();
  const table1Collider = table1.getCollider();
  const table2Collider = table2.getCollider();
  const chestCollider = chest.getCollider();
  const shelf1Collider = shelf1.getCollider();
  const shelf2Collider = shelf2.getCollider();
  const shelf3Collider = shelf3.getCollider();
  const storageBenchCollider = storageBench.getCollider();
  const cabinetCollider = cabinet.getCollider();
  const windowColliders = windows.map((window) => window.getCollider());

  return {
    room,
    roomColliders,
    objectColliders: [
      sofaCollider,
      armchair1Collider,
      armchair2Collider,
      table1Collider,
      table2Collider,
      chestCollider,
      shelf1Collider,
      shelf2Collider,
      shelf3Collider,
      storageBenchCollider,
      cabinetCollider,
      ...windowColliders,
    ],
    bounds,
    door,
    doorPassage: {
      minX: doorOpening.position.x - doorOpening.width / 2,
      maxX: doorOpening.position.x + doorOpening.width / 2,
    },
    interactables: [
      lightSwitch,
      redKey,
      blueKey,
      door,
      chest,
      cabinet,
      ...cabinetInteractables,
      storageBench,
      book4,
      book2,
      book1,
      book3,
    ],
    entities: [
      lightSwitch,
      door,
      lamp1,
      redKey,
      blueKey,
      chest,
      sofa,
      armchair1,
      armchair2,
      table1,
      table2,
      cabinet,
      storageBench,
      book4,
      book2,
      book1,
      book3,
      shelf1,
    ],
    spawnLookAt: new THREE.Vector3(0, 5.1, 0),
    spawnPosition: new THREE.Vector3(0, 5.1, 8),
  };
};

export { createLivingRoom };
