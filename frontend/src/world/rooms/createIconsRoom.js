import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import { Fuse } from "../objects/index.js";

const createIconsRoom = () => {
  const { room, colliders, bounds } = createRoom({
    wallColor: 0xdddddd,
    floorColor: 0xcccccc,
  });

  room.name = "Icon Studio";

  const objectPosition = new THREE.Vector3(0, 5.45, -4);

  const backgroundGeometry = new THREE.PlaneGeometry(12, 12);

  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: 0x9b8065,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

  background.position.set(0, 5, -5);
  room.add(background);

  const captureFrame = createCaptureFrame({
    width: 2,
    height: 2,
    depth: 0.05,
    thickness: 0.08,
    color: 0xffffff,
  });

  captureFrame.position.set(0, 5.37, -4.9);
  room.add(captureFrame);

  const centerMarkerGeometry = new THREE.CircleGeometry(0.05, 16);

  const centerMarkerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    depthTest: false,
  });

  const centerMarker = new THREE.Mesh(centerMarkerGeometry, centerMarkerMaterial);

  centerMarker.position.set(0, 5.5, -4.84);
  centerMarker.renderOrder = 10;

  const ambientLight = new THREE.AmbientLight(0xffffff, 2);

  room.add(ambientLight);

  const mainLight = new THREE.PointLight(0xffffff, 120, 50);

  mainLight.position.set(3, 8, 4);
  room.add(mainLight);

  const fillLight = new THREE.PointLight(0xffffff, 80, 50);

  fillLight.position.set(-3, 7, 2);
  room.add(fillLight);

  const topLight = new THREE.PointLight(0xffffff, 60, 40);

  topLight.position.set(0, 10, -1);
  room.add(topLight);

  const object = new Fuse({
    id: "red-key",
    position: objectPosition,
    color: 0xff0000,
    inventoryIcon: "/images/icons/key.png",
  });

  object.object3D.rotation.set(0, 0, 0);

  room.add(object.object3D);

  return {
    room,
    colliders,
    bounds,
    doorPassage: null,
    interactables: [],
    entities: [],
    spawnLookAt: objectPosition.clone(),
    spawnPosition: new THREE.Vector3(objectPosition.x, objectPosition.y, 4),
  };
};

const createCaptureFrame = ({ width, height, depth, thickness, color }) => {
  const frame = new THREE.Group();

  const material = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
  });

  const horizontalGeometry = new THREE.BoxGeometry(width, thickness, depth);
  const verticalGeometry = new THREE.BoxGeometry(thickness, height, depth);

  const top = new THREE.Mesh(horizontalGeometry, material);
  top.position.y = height / 2;
  const bottom = new THREE.Mesh(horizontalGeometry, material);
  bottom.position.y = -height / 2;

  const left = new THREE.Mesh(verticalGeometry, material);
  left.position.x = -width / 2;
  const right = new THREE.Mesh(verticalGeometry, material);
  right.position.x = width / 2;

  frame.add(top, bottom, left, right);
  return frame;
};

export { createIconsRoom };
