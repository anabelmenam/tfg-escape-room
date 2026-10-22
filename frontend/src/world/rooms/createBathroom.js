import * as THREE from "three";
import { createRoom } from "./createRoom.js";
import {
  BathroomVanity,
  Bathtub,
  Carpet,
  Lamp,
  Lock,
  Mirror,
  Screwdriver,
  Switch,
  Toilet,
  TowelRail,
  Window,
  applyAgedFurnitureAppearance,
  createBottleSet,
  createPottedPlant,
  createSoapDish,
  createTrashBin,
  FinalKey,
} from "../objects/index.js";
import { BathroomSteamPuzzle, STEAM_SEQUENCE, BathroomMosaicPuzzle } from "../puzzles/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

const createSinkWaterControl = ({ id, vanity }) => {
  let isRunning = false;
  return {
    id,
    object3D: vanity.faucet,
    enabled: true,
    interact: () => {
      isRunning = !isRunning;
      vanity.setWaterRunning(isRunning);
      const lever = vanity.faucet.userData.lever;
      if (lever) lever.rotation.x = isRunning ? -Math.PI / 5 : 0;
    },
    getInteractionText: () =>
      isRunning ? tInteraction("turnOff", tItem("tap")) : tInteraction("turnOn", tItem("tap")),
  };
};

const bathroomConfig = {
  past: {
    wallColor: 0xc8b89d,
    floorColor: 0x8ba6a2,
    fixtureColor: 0xf1ead9,
    cabinetColor: 0x7b573d,
    metalColor: 0xb9aa83,
    textileColor: 0x668e8a,
    ambientIntensity: 0.38,
  },
  present: {
    wallColor: 0xc8b89d,
    floorColor: 0x8ba6a2,
    fixtureColor: 0xf1ead9,
    cabinetColor: 0x7b573d,
    metalColor: 0xb9aa83,
    textileColor: 0x668e8a,
    ambientIntensity: 0.38,
  },
};

const createBathroom = ({
  timeline = "present",
  onObjectFocus = null,
  onBathroomAction = null,
  testMode = false,
} = {}) => {
  const config = bathroomConfig[timeline];
  if (!config) throw new Error(`Timeline no válido para Bathroom: ${timeline}`);

  const width = 15;
  // The bathroom shares its right-hand wall with the hallway. Matching both
  // depths lets the hallway own that wall without leaving gaps at either end.
  const depth = 10;
  const height = 12;
  const { room, roomColliders, bounds, windowOpenings, placeAgainstWall } = createRoom({
    width,
    depth,
    height,
    wallColor: config.wallColor,
    floorColor: config.floorColor,
    ceilingColor: config.wallColor,
    wallTexture: "/textures/rooms/whiteWall.jpg",
    floorTexture: "/textures/rooms/bathroom-floor-tiles.png",
    ceilingTexture: "/textures/rooms/whiteWall.jpg",
    wallTextureRepeat: { x: 6, y: 4 },
    floorTextureRepeat: { x: 1.5, y: 1 },
    ceilingTextureRepeat: { x: 5, y: 5 },
    door: { wall: "right", position: 0, width: 5, height: 8 },
    omitWalls: ["right"],
    windows: [
      { id: `bathroom-${timeline}-window`, wall: "left", position: 0.45, width: 6.2, height: 4.8, bottom: 4.15 },
    ],
  });
  room.name = `Bathroom-${timeline}`;
  room.userData.timeline = timeline;

  const ambientLight = new THREE.AmbientLight(0xe8f3ed, config.ambientIntensity);
  const lamp = new Lamp({
    id: `bathroom-${timeline}-lamp`,
    position: new THREE.Vector3(0, height, 0),
    intensityScale: 0.78,
  });
  lamp.setActive(false);
  const lightSwitch = new Switch({
    id: `bathroom-${timeline}-switch`,
    position: new THREE.Vector3(width / 2, 3.5, -3.4),
    scale: 0.75,
    onPress: (switchObject) => lamp.setActive(switchObject.active),
  });
  lightSwitch.object3D.rotation.y = -Math.PI / 2;

  const windows = windowOpenings.map(
    (opening) =>
      new Window({
        id: opening.id,
        position: opening.position.clone(),
        rotationY: opening.rotationY,
        width: opening.width,
        height: opening.height,
        glassColor: 0xcfe4df,
        glassOpacity: 0.58,
        columns: 3,
        rows: 2,
      }),
  );
  const vanity = new BathroomVanity({
    id: `bathroom-${timeline}-vanity`,
    position: new THREE.Vector3(2.55, 0, -3.95),
    cabinetColor: config.cabinetColor,
    fixtureColor: config.fixtureColor,
    metalColor: config.metalColor,
    lockedDrawers: timeline === "present" ? [0] : [],
  });
  const toilet = new Toilet({
    id: `bathroom-${timeline}-toilet`,
    position: new THREE.Vector3(4.8, 0, 3),
    scale: 1.18,
    heightScale: 1.12,
    fixtureColor: config.fixtureColor,
    metalColor: config.metalColor,
  });
  const bathtub = new Bathtub({
    id: `bathroom-${timeline}-bathtub`,
    position: new THREE.Vector3(-5.55, 0, 0.45),
    scale: 1.12,
    heightScale: 1.22,
    lengthScale: 1.14,
    fixtureColor: config.fixtureColor,
    metalColor: config.metalColor,
  });
  const towelRail = new TowelRail({
    id: `bathroom-${timeline}-towel-rail`,
    position: new THREE.Vector3(-1.2, 4.8, 4.77),
    metalColor: config.metalColor,
    towelColor: config.textileColor,
  });
  const mirror = new Mirror({
    id: `bathroom-${timeline}-mirror`,
    position: new THREE.Vector3(2.55, 5.35, -4.72),
    scale: 1.45,
  });
  let hotWaterClueKnown = testMode;
  const steamPuzzle =
    timeline === "past"
      ? new BathroomSteamPuzzle({
          faucet: vanity.faucet,
          vanity,
          onSolved: () => onBathroomAction?.("puzzle.solved", "bathroom-hot-water"),
        })
      : null;
  const sinkWaterControl =
    timeline === "present"
      ? createSinkWaterControl({
          id: "bathroom-present-sink-water",
          vanity,
        })
      : null;
  const screwdriver =
    timeline === "present"
      ? new Screwdriver({
          onCollect: () => onBathroomAction?.("item.pickup", "screwdriver"),
        })
      : null;
  screwdriver?.setEnabled(false);
  if (screwdriver) {
    vanity.addObjectToDrawer(0, screwdriver.object3D, new THREE.Vector3(0.45, -0.08, -0.55));
  }
  const sequenceLock =
    timeline === "present"
      ? new Lock({
          id: "bathroom-sequence-lock",
          scale: 0.15,
          password: STEAM_SEQUENCE,
          color: 0x263238,
          metalColor: 0xc4c9c8,
          wheelColor: 0x111516,
          onFocus: onObjectFocus,
          canUnlock: () => hotWaterClueKnown,
          onUnlock: () => {
            vanity.unlockDrawer(0);
            screwdriver?.setEnabled(true);
            onBathroomAction?.("puzzle.solved", "bathroom-sequence");
          },
        })
      : null;
  if (sequenceLock) {
    const drawer = vanity.drawerManager.getDrawer(0);
    // Rotate around the point where the shackle crosses the handle. This makes
    // the body swing out from the drawer instead of merely turning in place.
    const lockHanger = new THREE.Group();
    lockHanger.position.set(-0.04, 0, 0.43);
    lockHanger.rotation.set(0.08, 0.5, -0.12);
    lockHanger.add(sequenceLock.object3D);
    sequenceLock.object3D.position.set(0, -0.27, 0);
    sequenceLock.object3D.traverse((child) => {
      child.userData.ignoreAging = true;
    });
    drawer.add(lockHanger);
  }
  const bathMat = new Carpet({
    id: `bathroom-${timeline}-mat`,
    position: new THREE.Vector3(-2.7, 0.02, 1),
    width: 2.6,
    depth: 4.2,
    color: config.textileColor,
    sideColor: 0x384744,
    hasFringes: false,
  });

  const agedDecor = false;
  const toiletries = createBottleSet({ aged: agedDecor, scale: 0.62 });
  toiletries.position.set(-1.35, 2.79, -0.34);
  vanity.object3D.add(toiletries);

  const soapDish = createSoapDish({ aged: agedDecor, scale: 0.72 });
  soapDish.position.set(1.38, 2.79, 0.05);
  vanity.object3D.add(soapDish);

  const trashBin = createTrashBin({ aged: agedDecor, scale: 0.88 });
  trashBin.position.set(6.35, 0, 3.4);

  const bathroomPlant = createPottedPlant({ aged: agedDecor, scale: 0.75 });
  bathroomPlant.position.set(6.25, 0, -3.75);
  const mosaicPuzzle = new BathroomMosaicPuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => onBathroomAction?.("puzzle.solved", "bathroom-mosaic"),
    onInsert: () => onBathroomAction?.("object.interact", "bathroom-mosaic", { operation: "insert-tile" }),
  });
  mosaicPuzzle.object3D.position.set(2.6, 5.4, 4.82);
  mosaicPuzzle.object3D.rotation.y = Math.PI;
  mosaicPuzzle.object3D.scale.setScalar(.76);
  const finalBathroomKey = timeline === "past"
    ? new FinalKey({
        id: "final-key-bathroom",
        symbol: "wave",
        color: 0x4f91ad,
        onCollect: () => onBathroomAction?.("item.pickup", "final-key-bathroom"),
      })
    : null;
  if (finalBathroomKey) {
    finalBathroomKey.object3D.position.set(0, 0, .58);
    finalBathroomKey.object3D.scale.setScalar(.42);
    finalBathroomKey.object3D.visible = false;
    finalBathroomKey.setEnabled(false);
    mosaicPuzzle.compartment.add(finalBathroomKey.object3D);
  }
  if (testMode && screwdriver) {
    screwdriver.object3D.visible = true;
    screwdriver.setEnabled(true);
  }
  room.add(
    ambientLight,
    lamp.object3D,
    lightSwitch.object3D,
    ...windows.map((window) => window.object3D),
    vanity.object3D,
    toilet.object3D,
    bathtub.object3D,
    towelRail.object3D,
    mirror.object3D,
    bathMat.object3D,
    trashBin,
    bathroomPlant,
    mosaicPuzzle.object3D,
    ...(steamPuzzle ? [steamPuzzle.effects3D] : []),
  );
  placeAgainstWall(lightSwitch, "right");

  [vanity.object3D, toilet.object3D, bathtub.object3D, towelRail.object3D, mirror.object3D].forEach((object) => {
    applyAgedFurnitureAppearance(object, { intensity: 0.12, wearColor: 0x666860 });
  });
  room.updateMatrixWorld(true);
  const solidFurniture = [vanity, toilet, bathtub];

  return {
    room,
    roomColliders,
    objectColliders: [
      ...solidFurniture.map((object) => object.getCollider()),
      ...windows.map((window) => window.getCollider()),
    ],
    bounds,
    dimensions: { width, depth, height },
    interactables: [
      lightSwitch,
      ...vanity.getInteractables(),
      ...toilet.getInteractables(),
      ...bathtub.getInteractables(),
      ...(steamPuzzle ? [steamPuzzle] : []),
      ...(sinkWaterControl ? [sinkWaterControl] : []),
      ...(sequenceLock ? [sequenceLock] : []),
      ...(screwdriver ? [screwdriver] : []),
      mosaicPuzzle,
      ...(finalBathroomKey ? [finalBathroomKey] : []),
    ],
    entities: [
      lightSwitch,
      lamp,
      vanity,
      toilet,
      bathtub,
      towelRail,
      bathMat,
      ...(steamPuzzle ? [steamPuzzle] : []),
      ...(sequenceLock ? [sequenceLock] : []),
      ...(screwdriver ? [screwdriver] : []),
      mosaicPuzzle,
      ...(finalBathroomKey ? [finalBathroomKey] : []),
    ],
    applyBathroomState: (state) => {
      hotWaterClueKnown = Boolean(state.timelines?.past?.puzzles?.["bathroom-hot-water"]?.solved) || testMode;
      if (hotWaterClueKnown && timeline === "past") steamPuzzle?.activate({ notify: false });
      const sequenceSolved = Boolean(state.timelines?.present?.puzzles?.["bathroom-sequence"]?.solved);
      if (sequenceSolved && timeline === "present") {
        sequenceLock?.setUnlocked();
        vanity.unlockDrawer(0);
        screwdriver?.setEnabled(true);
      }
      if (state.inventories?.present?.includes("screwdriver") && screwdriver) {
        screwdriver.object3D.visible = false;
        screwdriver.setEnabled(false);
      }
      const mosaicState = state.timelines?.present?.puzzles?.["bathroom-mosaic"];
      if (mosaicState?.tileInserted && timeline === "present") mosaicPuzzle.insertMissingTile();
      const mosaicSolved = Boolean(mosaicState?.solved);
      if (mosaicSolved) {
        if (timeline === "present") mosaicPuzzle.solve({ notify: false });
        else {
          mosaicPuzzle.revealCompartment();
          const unavailable = state.inventories?.past?.includes("final-key-bathroom")
            || ["past", "present"].some((era) => state.timelines?.[era]?.objects?.["final-bolt-bathroom"]?.unlocked);
          if (!unavailable) finalBathroomKey?.reveal();
          else if (finalBathroomKey) { finalBathroomKey.object3D.visible = false; finalBathroomKey.setEnabled(false); }
        }
      }
    },
    lightSwitch,
    lamp,
  };
};

export { createBathroom };
