import * as THREE from "three";
import { Cabinet, Shelf, Sofa, Table } from "../../objects/index.js";

const livingRoomWoodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x5b3a29,
  darkWoodColor: 0x422a1e,
  interiorColor: 0x6b4734,
  drawerInteriorColor: 0x6b4734,
  handleColor: 0x9b773d,
};

const createLivingRoomFurniture = () => {
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

  const armchairs = [
    new Sofa({
      id: "living-room-armchair-1",
      position: new THREE.Vector3(3, 0, 4),
      rotationY: Math.PI,
      seats: 1,
      scale: 1.5,
      width: 3,
      height: 3,
      depth: 3,
    }),
    new Sofa({
      id: "living-room-armchair-2",
      position: new THREE.Vector3(3, 0, -10),
      seats: 1,
      scale: 1.5,
      width: 3,
      height: 3,
      depth: 3,
    }),
  ];

  const table = new Table({
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

  const shelfOptions = {
    position: new THREE.Vector3(-13.5, 0, 0),
    rotationY: Math.PI / 2,
    backWall: true,
    height: 7,
    depth: 2,
    shelves: 4,
    thickness: 0.3,
    ...livingRoomWoodStyle,
  };
  const shelves = [
    new Shelf({ ...shelfOptions, id: "living-room-shelf-1", position: new THREE.Vector3(-13.5, 0, 9.75), width: 9.5 }),
    new Shelf({ ...shelfOptions, id: "living-room-shelf-2", width: 10 }),
    new Shelf({ ...shelfOptions, id: "living-room-shelf-3", position: new THREE.Vector3(-13.5, 0, -9.75), width: 9.5 }),
  ];

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

  return {
    sofa,
    armchairs,
    table,
    shelves,
    cabinet,
    cabinetInteractables: cabinet.getInteractables(),
    woodStyle: livingRoomWoodStyle,
  };
};

export { createLivingRoomFurniture };
