import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import {
  Door,
  Lamp,
  Switch,
  Cabinet,
  Carpet,
  Key,
  Bed,
  Window,
  Decoration,
  Chair,
  Wardrobe,
  Desk,
  Lock,
  Safe,
  AlarmClock,
  Cobweb,
  Fuse,
  Paper,
  DeskLamp,
  Flashlight,
  RadioDial,
} from "../objects/index.js";

import {
  ElectricalPanelPuzzle,
  FamilyPhotoPuzzle,
  LightRevealPuzzle,
  RadioPuzzle,
  SewingBoxPuzzle,
} from "../puzzles/index.js";
import { applyAgedFurnitureAppearance } from "../objects/helpers/applyAgedFurnitureAppearance.js";

const bedroomWoodStyle = {
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

const bedroomTimelineConfig = {
  past: {
    wallColor: 0xc8b89d,
    floorColor: 0x6a4d3c,
    ceilingColor: 0xb0a18c,
    blanketColor: 0xa89305,
    pillowColor: 0xa89305,
    carpetColor: 0x762d34,
    ambientLightIntensity: 0.55,
  },
  present: {
    wallColor: 0xa7a49c,
    floorColor: 0x4e4541,
    ceilingColor: 0x8b8983,
    blanketColor: 0x5f6670,
    pillowColor: 0x5f6670,
    carpetColor: 0x51484c,

    ambientLightIntensity: 0.48,
  },
};

const createBedroom = async ({ timeline = "present", onDoorOpenChange, onDoorUnlocked, onObjectFocus } = {}) => {
  const timelineConfig = bedroomTimelineConfig[timeline];

  if (!timelineConfig) {
    throw new Error(`Timeline no válido para Bedroom: ${timeline}`);
  }
  const { room, roomColliders, bounds, doorOpening, windowOpenings } = createRoom({
    wallColor: timelineConfig.wallColor,
    floorColor: timelineConfig.floorColor,
    ceilingColor: timelineConfig.ceilingColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/floor2.jpg",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: {
      x: 7,
      y: 7,
    },

    floorTextureRepeat: {
      x: 10,
      y: 14.7,
    },

    ceilingTextureRepeat: {
      x: 7,
      y: 7,
    },
    width: 17,
    depth: 25,
    door: {
      wall: "front",
      position: -3,
      width: 5,
      height: 8,
    },
    windows: [
      {
        id: "bedroom-window-1",
        wall: "left",
        position: 3.1,
        width: 7,
        height: 6,
        bottom: 4,
      },
    ],

    omitWalls: ["front"],
  });

  room.name = `Bedroom-${timeline}`;
  room.userData.timeline = timeline;

  const ambientLight = new THREE.AmbientLight(
    timeline === "present" ? 0xb7c8df : 0xffffff,
    timelineConfig.ambientLightIntensity,
  );
  room.add(ambientLight);

  if (windowOpenings[0]) {
    const exteriorLight = new THREE.SpotLight(0xa9c6f0, 100, 32, Math.PI / 3.1, 0.9, 1.2);
    const exteriorTarget = new THREE.Object3D();
    exteriorLight.position.copy(windowOpenings[0].position).add(new THREE.Vector3(-2.8, 1.4, 0));
    exteriorTarget.position.set(1.5, 1.2, windowOpenings[0].position.z);
    exteriorLight.target = exteriorTarget;
    room.add(exteriorLight, exteriorTarget);
  }

  const doorPosition = doorOpening.position.clone();
  doorPosition.x -= doorOpening.width / 2;
  doorPosition.y = doorOpening.height / 2;

  const door = new Door({
    id: "bedroom-exit-door",
    position: doorPosition,
    //requiredKey: timeline === "past" ? "bedroom-key" : null,
    locked: true,
    onOpenChange: onDoorOpenChange,
    onUnlock: onDoorUnlocked,
  });
  const windows = windowOpenings.map((windowOpening) => {
    return new Window({
      id: windowOpening.id,
      position: windowOpening.position.clone(),
      rotationY: windowOpening.rotationY,
      width: windowOpening.width,
      height: windowOpening.height,
    });
  });
  const key =
    timeline === "past"
      ? new Key({
          id: "bedroom-key",
          inventoryIcon: "/images/icons/blue-key.png",
          position: new THREE.Vector3(2, 1, -3),
          color: 0x0000ff,
        })
      : null;
  const radioDial = timeline === "past" ? new RadioDial({ id: "radio-dial" }) : null;
  const fuse = timeline === "present" ? new Fuse({ id: "fuse", scale: 0.8 }) : null;
  const lamp = new Lamp({
    id: "bedroom-lamp",
    position: new THREE.Vector3(0, 12, 0),
  });

  const lightSwitch1 = new Switch({
    id: `bedroom-${timeline}-switch1`,
    position: new THREE.Vector3(0, 4, 12),
    scale: 0.75,
    powerAvailable: timeline !== "present",
    onPress: () => {
      lamp.setActive(!lamp.getActive());
    },
  });
  lightSwitch1.object3D.rotation.y = Math.PI;

  const lightSwitch2 = new Switch({
    id: `bedroom-${timeline}-switch2`,
    position: new THREE.Vector3(3, 3.5, -12),
    scale: 0.75,
    powerAvailable: timeline !== "present",
    onPress: () => {
      lamp.setActive(!lamp.getActive());
    },
  });

  const bed = new Bed({
    id: "bed1",
    position: new THREE.Vector3(-1.75, 0, -8),
    ...bedroomWoodStyle,
    blanketColor: timelineConfig.blanketColor,
    mattressColor: 0xd8e0e4,
    pillowColor: timelineConfig.pillowColor,
  });

  const nightstand1 = new Cabinet({
    id: "nightstand1",
    position: new THREE.Vector3(-6.5, 0, -11),
    width: 2.8,
    height: 2.8,
    depth: 2.2,
    rows: 2,
    columns: 1,
    drawerOpenDistance: 1.2,
    handleType: "knob",
    ...bedroomWoodStyle,
  });

  const nightstand2 = new Cabinet({
    id: "nightstand2",
    position: new THREE.Vector3(3, 0, -11),
    width: 2.8,
    height: 2.8,
    depth: 2.2,
    rows: 2,
    columns: 1,
    drawerOpenDistance: 1.2,
    handleType: "knob",
    ...bedroomWoodStyle,
  });

  const nightstand1Interactables = nightstand1.getInteractables();
  const nightstand2Interactables = nightstand2.getInteractables();

  const wardrobe = new Wardrobe({
    id: "wardrobe1",
    position: new THREE.Vector3(6.5, 0, -3),
    ...bedroomWoodStyle,
  });
  wardrobe.object3D.rotation.y = -Math.PI / 2;
  const wardrobeInteractables = wardrobe.getInteractables();

  const cabinet = new Cabinet({
    id: "cabinet1",
    position: new THREE.Vector3(-7, 0, 3),
    height: 3,
    columns: 2,
    rows: 3,
    width: 8,
    handleType: "bar",
    ...bedroomWoodStyle,
  });
  cabinet.object3D.rotation.y = Math.PI / 2;
  const cabinetInteractables = cabinet.getInteractables();
  const flashlight = timeline === "present" ? new Flashlight({ id: "flashlight", scale: 0.62 }) : null;

  if (flashlight) {
    cabinet.addObjectToDrawer(0, flashlight.object3D, new THREE.Vector3(0, -0.18, -0.38));
  }

  const desk = new Desk({
    id: "desk1",
    position: new THREE.Vector3(6.5, 0, 8),
    lockedDrawers: timeline === "present" ? [0] : [],
    ...bedroomWoodStyle,
  });
  desk.object3D.rotation.y = -Math.PI / 2;
  const deskInteractables = desk.getInteractables();

  const deskPaper = new Paper({
    id: `bedroom-${timeline}-desk-paper`,
    position: new THREE.Vector3(-2.5, 3.32, -0.2),
    rotation: new THREE.Euler(-Math.PI / 2, 0, Math.PI / 4),
    width: 1.15,
    height: 0.82,
  });
  if (timeline === "present") {
    desk.object3D.add(deskPaper.object3D);
  }

  const deskLamp = new DeskLamp({
    id: `bedroom-${timeline}-desk-lamp`,
    position: new THREE.Vector3(-3, 3.32, -0.7),
    rotation: new THREE.Euler(0, -Math.PI / 4, 0),
    targetOffset: new THREE.Vector3(0.84, 0.02, 0),
    powerAvailable: timeline !== "present",
  });
  desk.object3D.add(deskLamp.object3D);

  const planPaper =
    timeline === "past"
      ? new Paper({
          id: "bedroom-electrical-plan",
          width: 2.45,
          height: 1.63,
          imagePath: "/images/puzzles/electrical-plan-lights.png",
          imageFit: "cover",
          imagePadding: 0,
          collectible: true,
          itemName: "electrical-plan",
          inspectionTitle: "plano eléctrico",
        })
      : null;

  if (planPaper) {
    planPaper.object3D.visible = false;
    planPaper.setEnabled(false);
  }

  const radio =
    timeline === "past"
      ? new RadioPuzzle({
          id: "bedroom-radio",
          position: new THREE.Vector3(-7.5, 3.5, 5.5),
          rotationY: Math.PI / 2,
          scale: 0.5,
          onFocus: onObjectFocus,
          key,
          dialItem: radioDial,
        })
      : null;

  const radioNote =
    timeline === "present"
      ? new Paper({
          id: "bedroom-radio-note",
          position: new THREE.Vector3(1.5, 0.08, -3),
          rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
          width: 2.1,
          height: 1.35,
          onFocus: onObjectFocus,
          imagePath: "/images/puzzles/radio-program-note.png",
          imageFit: "cover",
          imagePadding: 0,
          collectible: true,
          itemName: "radio-program-note",
          inspectionTitle: "programación nocturna",
        })
      : null;

  const sewingBox =
    timeline === "past"
      ? new SewingBoxPuzzle({
          id: "bedroom-sewing-box",
          position: new THREE.Vector3(-6, 3, -6),
          scale: 0.26,
          onFocus: onObjectFocus,
          planPaper,
        })
      : null;

  if (timeline === "past") {
    nightstand1.addObjectToDrawer(0, sewingBox.object3D, new THREE.Vector3(-0.5, -0.1, -0.5));
  }

  const lightRevealPuzzle =
    timeline === "present"
      ? new LightRevealPuzzle({
          id: "bedroom-light-reveal-puzzle",
          deskLamp,
          paper: deskPaper,
          onSolved: () => {},
        })
      : null;

  const electricalPanel =
    timeline === "present"
      ? new ElectricalPanelPuzzle({
          id: "electrical-panel",
          position: new THREE.Vector3(-7.5, 5.5, 10),
          rotationY: Math.PI / 2,
          scale: 0.5,
          onFocus: onObjectFocus,
          onSolved: () => {
            lightSwitch1.setPowerAvailable(true);
            lightSwitch2.setPowerAvailable(true);
            deskLamp.setPowerAvailable(true);
          },
        })
      : null;

  if (timeline === "present") {
    desk.addObjectToDrawer(0, fuse.object3D, new THREE.Vector3(-0.55, -0.18, -0.7));
  }

  const chair = new Chair({
    id: "chair1",
    position: new THREE.Vector3(4.5, 0, 9.5),
    ...bedroomWoodStyle,
  });
  chair.object3D.rotation.y = Math.PI / 2;

  const carpet = new Carpet({
    id: "carpet1",
    position: new THREE.Vector3(-1.5, 0.01, -5),
    width: 6,
    depth: 10,
    color: timelineConfig.carpetColor,
    texture: "/textures/furniture/carpet.jpg",
    textureRepeat: {
      x: 2,
      y: 3,
    },
  });
  carpet.object3D.rotation.y = -Math.PI / 2;

  const lock =
    timeline === "present"
      ? new Lock({
          id: "bedroom-lock",
          position: new THREE.Vector3(4.95, 2.3, 6.6),
          rotationY: Math.PI / 4,
          scale: 0.15,
          digits: 4,
          password: "0328",
          onUnlock: () => {
            desk.unlockDrawer(0);
            console.log("Candado abierto");
          },
          onFocus: onObjectFocus,
        })
      : null;

  if (timeline === "present") desk.addObjectToDrawer(0, lock.object3D, new THREE.Vector3(0, -0.25, 0.25));

  const alarmClock = new AlarmClock({
    id: "bedroom-alarm-clock",
    position: new THREE.Vector3(3, 2.8, -11),
    rotationY: -Math.PI / 5,
    scale: 0.55,
    time: "03:28",
    isBroken: timeline === "present",
  });

  const safe =
    timeline === "past"
      ? new Safe({
          id: "bedroom-symbol-safe",
          position: new THREE.Vector3(7, 2.5, -1.5),
          rotationY: -Math.PI / 2,
          scale: 0.55,
          symbols: ["□", "△", "✕", "☆", "○", "◇"],
          password: ["△", "○", "□", "✕"],
          onFocus: onObjectFocus,
          onUnlock: (safe) => {
            safe.open();
          },
        })
      : null;

  if (safe && radioDial) {
    safe.addItem(radioDial, {
      position: new THREE.Vector3(0, 0.35, 0.72),
      rotation: new THREE.Euler(0, 0, 0),
      scale: 1,
    });
  }

  const cobweb =
    timeline === "present"
      ? new Cobweb({
          id: "bedroom-back-corner-cobweb",
          position: new THREE.Vector3(7.98, 11.98, -11.98),
          scale: 0.8,
          radius: 1.2,
          corner: true,
          cornerCeiling: true,
          spokes: 9,
          rings: 4,
          opacity: 0.5,
        })
      : null;

  const familyPhoto =
    timeline === "present"
      ? new FamilyPhotoPuzzle({
          id: "bedroom-family-photo",
          position: new THREE.Vector3(7.92, 6, 2.5),
          rotationY: -Math.PI / 2,
          scale: 0.7,
          onFocus: onObjectFocus,
        })
      : null;

  if (timeline === "present") {
    [bed, nightstand1, nightstand2, wardrobe, cabinet, desk, chair, carpet].forEach((furniture) => {
      applyAgedFurnitureAppearance(furniture.object3D);
    });
  }

  if (timeline === "past") {
    room.add(alarmClock.object3D);
    room.add(safe.object3D);
    room.add(radio.object3D);
  } else {
    room.add(alarmClock.object3D);
    room.add(cobweb.object3D);
    room.add(familyPhoto.object3D);
    room.add(electricalPanel.object3D);
    room.add(radioNote.object3D);
  }
  room.add(carpet.object3D);
  room.add(wardrobe.object3D);
  room.add(cabinet.object3D);
  room.add(lightSwitch1.object3D);
  room.add(lightSwitch2.object3D);
  room.add(lamp.object3D);
  room.add(door.object3D);
  room.add(desk.object3D);
  room.add(bed.object3D);
  room.add(nightstand1.object3D);
  room.add(nightstand2.object3D);
  room.add(chair.object3D);
  windows.forEach((window) => {
    room.add(window.object3D);
  });

  room.updateMatrixWorld(true);
  const bedCollider = bed.getCollider();
  const nightstand1Collider = nightstand1.getCollider();
  const nightstand2Collider = nightstand2.getCollider();
  const wardrobeCollider = wardrobe.getCollider();
  const cabinetCollider = cabinet.getCollider();
  const deskCollider = desk.getCollider();
  const chairCollider = chair.getCollider();
  const windowColliders = windows.map((window) => window.getCollider());

  return {
    timeline,
    room,
    roomColliders,
    objectColliders: [
      bedCollider,
      nightstand1Collider,
      nightstand2Collider,
      wardrobeCollider,
      deskCollider,
      chairCollider,
      cabinetCollider,
      ...windowColliders,
    ],
    bounds,
    door,
    doorPassage: {
      minX: doorOpening.position.x - doorOpening.width / 2,

      maxX: doorOpening.position.x + doorOpening.width / 2,
    },
    doorOpening,
    interactables: [
      door,
      lightSwitch1,
      lightSwitch2,
      ...(key ? [key] : []),
      ...(radioDial ? [radioDial] : []),
      ...(fuse ? [fuse] : []),
      ...(flashlight ? [flashlight] : []),
      ...nightstand1Interactables,
      ...nightstand2Interactables,
      ...wardrobeInteractables,
      ...deskInteractables,
      ...cabinetInteractables,
      ...(lock ? [lock] : []),
      ...(safe ? [safe] : []),
      ...(familyPhoto ? [familyPhoto] : []),
      ...(sewingBox ? [sewingBox] : []),
      ...(planPaper ? [planPaper] : []),
      ...(radio ? [radio] : []),
      ...(radioNote ? [radioNote] : []),
      ...(electricalPanel ? [electricalPanel] : []),
      carpet,
      deskLamp,
    ],
    entities: [
      door,
      lamp,
      lightSwitch1,
      lightSwitch2,
      ...(key ? [key] : []),
      ...(radioDial ? [radioDial] : []),
      ...(fuse ? [fuse] : []),
      ...(flashlight ? [flashlight] : []),
      nightstand1,
      nightstand2,
      wardrobe,
      desk,
      deskPaper,
      deskLamp,
      cabinet,
      carpet,
      ...(lock ? [lock] : []),
      ...(safe ? [safe] : []),
      ...(sewingBox ? [sewingBox] : []),
      ...(planPaper ? [planPaper] : []),
      ...(radio ? [radio] : []),
      ...(radioNote ? [radioNote] : []),
      ...(electricalPanel ? [electricalPanel] : []),
    ],
    puzzles: [...(lightRevealPuzzle ? [lightRevealPuzzle] : [])],
    spawnPosition: new THREE.Vector3(0, 5.1, 8),
  };
};

export { createBedroom };
