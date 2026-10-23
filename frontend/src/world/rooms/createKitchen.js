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
  createKitchenCanisterSet,
  createKitchenPrepSet,
  createPottedPlant,
  createUtensilCrock,
  createWallFrameCluster,
} from "../objects/index.js";
import {
  KitchenIngredient,
  KitchenNapkin,
  RecipePuzzle,
  StovePuzzle,
  TableSettingPuzzle,
  OvenControlPuzzle,
  MosaicTile,
} from "../puzzles/index.js";

const kitchenConfig = {
  past: {
    wallColor: 0xc8b89d,
    floorColor: 0x706151,
    cabinetColor: 0x75543b,
    applianceColor: 0xe0dacb,
    ambientIntensity: 0.42,
  },
  present: {
    wallColor: 0xc8b89d,
    floorColor: 0x706151,
    cabinetColor: 0x75543b,
    applianceColor: 0xe0dacb,
    ambientIntensity: 0.42,
  },
};

const kitchenWoodStyle = {
  woodTexture: "/textures/furniture/wood2.jpg",
  woodTextureRepeat: { x: 1, y: 1 },
  woodColor: 0x6b4b35,
  darkWoodColor: 0x443126,
};

const createKitchen = ({
  timeline = "present",
  onObjectFocus = null,
  onKitchenAction = null,
  testMode = false,
} = {}) => {
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

  const ambientLight = new THREE.AmbientLight(0xffefd2, config.ambientIntensity);
  const lamps = [-6, 6].map(
    (z, index) => new Lamp({ id: `kitchen-${timeline}-lamp-${index + 1}`, position: new THREE.Vector3(0, height, z) }),
  );
  lamps.forEach((lamp) => lamp.setActive(false));
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
    new Chair({
      id: `kitchen-${timeline}-chair-1`,
      position: new THREE.Vector3(-7.2, 0, -2.7),
      rotationY: Math.PI / 2,
      scale: 0.74,
      ...kitchenWoodStyle,
    }),
    new Chair({
      id: `kitchen-${timeline}-chair-2`,
      position: new THREE.Vector3(-7.2, 0, 0.7),
      rotationY: Math.PI / 2,
      scale: 0.74,
      ...kitchenWoodStyle,
    }),
    new Chair({
      id: `kitchen-${timeline}-chair-3`,
      position: new THREE.Vector3(-1.8, 0, -2.7),
      rotationY: -Math.PI / 2,
      scale: 0.74,
      ...kitchenWoodStyle,
    }),
    new Chair({
      id: `kitchen-${timeline}-chair-4`,
      position: new THREE.Vector3(-1.8, 0, 0.7),
      rotationY: -Math.PI / 2,
      scale: 0.74,
      ...kitchenWoodStyle,
    }),
  ];
  const agedDecor = false;
  const fruitBowl = createFruitBowl({ aged: agedDecor, scale: 1.05 });
  fruitBowl.position.set(0, 2.61, 0);
  diningTable.object3D.add(fruitBowl);
  const utensils = createUtensilCrock({ aged: agedDecor, scale: 0.9 });
  utensils.position.set(-3.75, 2.8, -0.35);
  const canisters = createKitchenCanisterSet({ aged: agedDecor, scale: 0.9 });
  canisters.position.set(3.35, 2.8, -0.65);
  counter.object3D.add(utensils, canisters);
  const prepSet = createKitchenPrepSet({ aged: agedDecor, scale: 0.72 });
  prepSet.position.set(0, 2.8, 0);
  smallCounter.object3D.add(prepSet);
  const kitchenPlant = createPottedPlant({ aged: agedDecor, scale: 1.05 });
  kitchenPlant.position.set(-3.65, 0, -11.75);
  const kitchenFrames = createWallFrameCluster({
    aged: agedDecor,
    scale: 0.8,
    imagePaths: [
      "/images/decor/family-breakfast.png",
      "/images/decor/family-picnic.png",
      "/images/decor/family-photo-1980s.png",
    ],
  });
  kitchenFrames.position.set(-6.35, 7, depth / 2 - 0.22);
  kitchenFrames.rotation.y = Math.PI;
  kitchenFrames.visible = timeline !== "past";

  const ingredientSpecs = [
    ["kitchen-tomatoes", "tomato", new THREE.Vector3(-0.8, 4.52, 0.2)],
    ["kitchen-carrots", "carrot", new THREE.Vector3(0.75, 3.25, 0.15)],
    ["kitchen-cheese", "cheese", new THREE.Vector3(0, 5.68, 0.2)],
  ];
  const ingredients =
    timeline === "present"
      ? ingredientSpecs.map(([id, kind, position]) => {
          const ingredient = new KitchenIngredient({ id, kind, onCollect: () => onKitchenAction?.("item.pickup", id) });
          ingredient.object3D.position.copy(position);
          refrigerator.object3D.add(ingredient.object3D);
          return ingredient;
        })
      : [];

  const recipePuzzle = new RecipePuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => {
      tablePuzzle.setAvailable(true);
      if (timeline === "present") {
        napkins[3]?.setEnabled(true);
        if (napkins[3]) napkins[3].object3D.visible = true;
      }
    },
    onPlacementChange: (payload) => onKitchenAction?.("object.interact", "kitchen-recipe", payload),
    onCollect: () => onKitchenAction?.("item.pickup", "kitchen-recipe-note"),
    ingredients,
  });
  if (timeline === "past") {
    recipePuzzle.object3D.scale.setScalar(0.5);
    counter.addObjectToDrawer(0, recipePuzzle.object3D, new THREE.Vector3(0, -0.145, -0.85));
  } else {
    recipePuzzle.object3D.position.set(-2.2, 2.86, 0.45);
    recipePuzzle.object3D.scale.setScalar(0.54);
  }

  const stovePuzzle = new StovePuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => {
      ovenPuzzle.setAvailable(true);
      ovenPuzzle.revealClue();
      onKitchenAction?.("puzzle.solved", "kitchen-stove");
    },
  });
  stovePuzzle.object3D.position.set(0, 0, 0);

  const napkinSpecs = [
    ["kitchen-napkin-red", 0xcbbd9f, "MAMÁ"],
    ["kitchen-napkin-blue", 0xcbbd9f, "PAPÁ"],
    ["kitchen-napkin-green", 0xcbbd9f, "ALBA"],
    ["kitchen-napkin-ochre", 0xcbbd9f, "JAIME"],
  ];
  const napkins =
    timeline === "present"
      ? napkinSpecs.map(
          ([id, color, name]) =>
            new KitchenNapkin({ id, color, name, onCollect: () => onKitchenAction?.("item.pickup", id) }),
        )
      : [];
  if (napkins.length) {
    counter.addObjectToDrawer(0, napkins[0].object3D, new THREE.Vector3(0, -0.12, -0.82));
    refrigerator.object3D.add(napkins[1].object3D);
    napkins[1].object3D.position.set(-0.82, 3.36, 0.42);
    firstTallCabinet.object3D.add(napkins[2].object3D);
    napkins[2].object3D.position.set(-0.48, 2.65, 0.42);
    counter.object3D.add(napkins[3].object3D);
    napkins[3].object3D.position.set(-2.2, 2.79, 0.72);
    napkins[3].object3D.visible = false;
    napkins[3].setEnabled(false);
  }

  const tablePuzzle = new TableSettingPuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => {
      stovePuzzle.setAvailable(true);
      stovePuzzle.revealClue();
    },
    onPlacementChange: (payload) => onKitchenAction?.("object.interact", "kitchen-family-table", payload),
    napkins,
  });
  tablePuzzle.object3D.position.set(0, 2.72, 0);
  tablePuzzle.object3D.scale.setScalar(0.9);

  const ovenPuzzle = new OvenControlPuzzle({
    timeline,
    onFocus: onObjectFocus,
    onSolved: () => {
      onKitchenAction?.("puzzle.solved", "kitchen-oven");
    },
  });
  if (timeline === "past") {
    ovenPuzzle.object3D.position.set(0, 4.68, 1.49);
  } else {
    ovenPuzzle.object3D.position.set(0, 3.14, 0);
    ovenPuzzle.object3D.scale.setScalar(0.8);
  }

  let mosaicTileTaken = false;
  const mosaicTile =
    timeline === "present" ? new MosaicTile({ onCollect: () => {
      mosaicTileTaken = true;
      onKitchenAction?.("item.pickup", "bathroom-mosaic-tile");
    } }) : null;
  if (mosaicTile) {
    mosaicTile.object3D.position.set(0, 3.34, 0.72);
    mosaicTile.object3D.scale.setScalar(0.72);
    mosaicTile.object3D.rotation.set(-Math.PI / 2, 0, 0.12);
    oven.object3D.add(mosaicTile.object3D);
    mosaicTile.object3D.visible = true;
    mosaicTile.setEnabled(false);
  }
  const ovenDoorInteractable = oven.getInteractables().find((interactable) => interactable.id === "kitchen-oven-panel-1");
  if (ovenDoorInteractable) {
    ovenDoorInteractable.enabled = false;
  }
  function openOvenWithReward() {
    if (timeline !== "present") return;
    const doorState = oven.panelManager.states[1];
    if (doorState && !doorState.isOpen) oven.panelManager.toggle(1);
    if (mosaicTile && !mosaicTileTaken) mosaicTile.reveal();
  }
  if (testMode) {
    [recipePuzzle, stovePuzzle, tablePuzzle, ovenPuzzle].forEach((puzzle) => puzzle.setAvailable(true));
    stovePuzzle.revealClue();
    if (napkins[3]) {
      napkins[3].object3D.visible = true;
      napkins[3].setEnabled(true);
    }
    openOvenWithReward();
  }
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
    kitchenFrames,
    diningTable.object3D,
    ...chairs.map((chair) => chair.object3D),
  );
  placeAgainstWall(lightSwitch, "back");
  placeAgainstWall(livingRoomDoorSwitch, "left");

  [
    refrigerator,
    oven,
    counter,
    cooktopCounter,
    smallCounter,
    firstTallCabinet,
    secondTallCabinet,
    diningTable,
    ...chairs,
  ].forEach((object) => {
    applyAgedFurnitureAppearance(object.object3D, { intensity: 0.12, wearColor: 0x6d5c4b });
  });
  if (timeline === "present") counter.object3D.add(recipePuzzle.object3D);
  diningTable.object3D.add(tablePuzzle.object3D);
  cooktopCounter.object3D.add(stovePuzzle.object3D);
  oven.object3D.add(ovenPuzzle.object3D);

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
  const kitchenOpenables = [
    refrigerator,
    oven,
    counter,
    cooktopCounter,
    smallCounter,
    firstTallCabinet,
    secondTallCabinet,
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
    interactables: [
      lightSwitch,
      livingRoomDoorSwitch,
      ...kitchenOpenables.flatMap((object) => object.getInteractables()),
      recipePuzzle,
      stovePuzzle,
      tablePuzzle,
      ovenPuzzle,
      ...ingredients,
      ...napkins,
      ...(mosaicTile ? [mosaicTile] : []),
    ],
    entities: [
      lightSwitch,
      livingRoomDoorSwitch,
      ...lamps,
      ...furniture,
      recipePuzzle,
      stovePuzzle,
      tablePuzzle,
      ovenPuzzle,
      ...ingredients,
      ...napkins,
      ...(mosaicTile ? [mosaicTile] : []),
    ],
    applyKitchenState: (state) => {
      const kitchenOpen = ["past", "present"].some(
        (era) => state.timelines?.[era]?.objects?.["hallway-kitchen-door"]?.locked === false
          || state.timelines?.[era]?.objects?.["living-room-kitchen-door"]?.locked === false,
      );
      if (kitchenOpen || testMode) recipePuzzle.setAvailable(true);
      const recipeState = state.timelines?.present?.puzzles?.["kitchen-recipe"];
      const recipeSolved = Boolean(recipeState?.solved);
      if (
        timeline === "past"
        && (state.inventories?.past?.includes("kitchen-recipe-note") || recipeSolved)
      ) {
        recipePuzzle.object3D.visible = false;
        recipePuzzle.setEnabled(false);
      }
      if (timeline === "present") recipePuzzle.applyPlacements(recipeState?.placements ?? []);
      if (recipeSolved) {
        if (timeline === "present") recipePuzzle.solve({ notify: false, placements: recipeState.placements });
        tablePuzzle.setAvailable(true);
      }
      const tableState = state.timelines?.present?.puzzles?.["kitchen-family-table"];
      if (timeline === "present") tablePuzzle.applyPlacements(tableState?.placements ?? []);
      const tableSolved = Boolean(tableState?.solved);
      if (tableSolved) {
        if (timeline === "present") tablePuzzle.solve({ notify: false, placements: tableState.placements });
        stovePuzzle.setAvailable(true);
        if (timeline === "past") stovePuzzle.revealClue();
      }
      const stoveSolved = Boolean(state.timelines?.present?.puzzles?.["kitchen-stove"]?.solved);
      if (stoveSolved) {
        if (timeline === "present") stovePuzzle.solve({ notify: false });
        ovenPuzzle.setAvailable(true);
        if (timeline === "present") ovenPuzzle.revealClue();
      }
      const ovenSolved = Boolean(state.timelines?.past?.puzzles?.["kitchen-oven"]?.solved);
      if (ovenSolved) {
        if (timeline === "past") ovenPuzzle.solve({ notify: false });
        openOvenWithReward();
      }
      const placedIngredients = recipeState?.placements ?? [];
      ingredients.forEach((ingredient) => {
        if (state.inventories?.present?.includes(ingredient.id) || placedIngredients.includes(ingredient.id) || recipeSolved) {
          ingredient.object3D.visible = false;
          ingredient.setEnabled(false);
        }
      });
      const placedNapkins = tableState?.placements ?? [];
      napkins.forEach((napkin) => {
        const collected = state.inventories?.present?.includes(napkin.id) || placedNapkins.includes(napkin.id);
        const rewardHidden = napkin.id === "kitchen-napkin-ochre" && !recipeSolved;
        napkin.object3D.visible = !collected && !rewardHidden;
        napkin.setEnabled(!collected && !rewardHidden);
      });
      if (
        mosaicTile &&
        (state.inventories?.present?.includes("bathroom-mosaic-tile") || state.timelines?.present?.puzzles?.["bathroom-mosaic"]?.tileInserted)
      ) {
        mosaicTileTaken = true;
        mosaicTile.object3D.visible = false;
        mosaicTile.setEnabled(false);
      }
    },
    lightSwitch,
    livingRoomDoorSwitch,
    lamps,
  };
};

export { createKitchen };
