const solved = (state, timeline, id) => Boolean(state?.timelines?.[timeline]?.puzzles?.[id]?.solved);
const object = (state, timeline, id) => state?.timelines?.[timeline]?.objects?.[id] ?? {};
const has = (inventory, id) => inventory.has(id);
const allBoltsOpen = (state) => ["bedroom", "living-room", "children", "bathroom"]
  .every((room) => object(state, "past", `final-bolt-${room}`).unlocked);

const getPastHint = (state, inventory) => {
  if (!solved(state, "past", "bedroom-sewing-box") && solved(state, "present", "bedroom-family-photo")) return "pastSewing";
  if (!solved(state, "past", "bedroom-sewing-box")) return "pastBedroomSearch";
  if (!solved(state, "present", "bedroom-electrical-panel") && !has(inventory, "bedroom-electrical-plan")) return "pastElectricalPlan";
  if (!object(state, "past", "bedroom-symbol-safe").open) return solved(state, "present", "bedroom-light-reveal-puzzle") ? "pastSafe" : "pastWaitSymbols";
  if (!solved(state, "past", "bedroom-radio")) return has(inventory, "radio-dial") ? "pastRadio" : "pastSafe";
  if (object(state, "past", "bedroom-exit-door").locked !== false) return has(inventory, "bedroom-key") ? "pastBedroomExit" : "pastRadioReward";
  if (!solved(state, "past", "hallway-clock")) return has(inventory, "clock-hand") ? "pastClock" : "pastBedroomSearch";
  if (!solved(state, "past", "bathroom-hot-water")) return "pastHotWater";
  if (object(state, "past", "hallway-living-room-door").locked !== false) return "pastWaitLivingRoomDoor";
  if (!object(state, "past", "living-room-painting-slot").placed) return solved(state, "present", "living-room-rainbow-books") ? "pastPainting" : "pastWaitBooks";
  if (!solved(state, "past", "living-room-painting")) return "pastPaintingPieces";
  if (!solved(state, "past", "living-room-embers")) return object(state, "present", "living-room-fireplace").open ? "pastEmbers" : "pastWaitFireplace";
  if (object(state, "present", "living-room-chest").locked !== false) return has(inventory, "living-room-vitrine-letter") ? "pastChest" : "pastDisplayCase";
  if (object(state, "past", "hallway-children-room-door").locked !== false) return "pastWaitChildrenDoor";
  if (!solved(state, "past", "children-blocks")) return "pastBlocks";
  if (!solved(state, "past", "children-globe-pin")) return has(inventory, "globe-pushpin") ? "pastPin" : "pastBlocksReward";
  if (!solved(state, "past", "children-globe")) return "pastPhotoBoard";
  if (!solved(state, "past", "children-music-key")) return "pastMusicKey";
  if (!solved(state, "past", "children-wardrobe-chains")) return has(inventory, "bolt-cutters") ? "pastChains" : "pastWaitMusic";
  if (object(state, "past", "hallway-kitchen-door").locked !== false) return has(inventory, "crowbar") ? "pastKitchenDoor" : "pastWardrobe";
  if (!solved(state, "present", "kitchen-recipe") && !has(inventory, "kitchen-recipe-note")) return "pastRecipeNote";
  if (!solved(state, "past", "kitchen-oven")) return solved(state, "present", "kitchen-stove") ? "pastOven" : "pastWaitStove";
  if (!solved(state, "present", "bathroom-mosaic")) return "pastWaitMosaic";
  if (allBoltsOpen(state)) return "finalDoor";
  if (has(inventory, "final-key-bedroom") || has(inventory, "final-key-children")) return "pastFinalKeys";
  if (object(state, "past", "final-bolt-bedroom").unlocked && object(state, "past", "final-bolt-children").unlocked) return "waitCompanionBolts";
  return "pastCollectFinalKeys";
};

const getPresentHint = (state, inventory) => {
  if (!solved(state, "present", "bedroom-family-photo")) return "presentFamilyPhoto";
  if (!solved(state, "present", "bedroom-electrical-panel")) return solved(state, "past", "bedroom-sewing-box") ? "presentElectrical" : "presentBedroomSearch";
  if (!solved(state, "present", "bedroom-light-reveal-puzzle")) return "presentDeskLamp";
  if (object(state, "present", "bedroom-exit-door").locked !== false) return "presentWaitBedroomExit";
  if (!solved(state, "present", "bathroom-sequence")) return solved(state, "past", "bathroom-hot-water") ? "presentBathroomCode" : "presentWaitSteam";
  if (!object(state, "present", "hallway-maze-mirror").released) return has(inventory, "screwdriver") ? "presentMirror" : "presentBathroomDrawer";
  if (!solved(state, "present", "hallway-maze")) return solved(state, "past", "hallway-clock") ? "presentMaze" : "presentWaitClock";
  if (object(state, "present", "hallway-living-room-door").locked !== false) return has(inventory, "living-room-key") ? "presentLivingRoomDoor" : "presentMazeReward";
  if (!solved(state, "present", "living-room-rainbow-books")) return "presentBooks";
  if (!object(state, "present", "living-room-sofa-cushion").cut) return has(inventory, "living-room-scissors") ? "presentCushion" : "presentWaitPainting";
  if (!object(state, "present", "living-room-sofa-cushion").searched) return "presentSearchCushion";
  if (!object(state, "present", "living-room-fireplace").open) return "presentFireplace";
  if (object(state, "present", "living-room-chest").locked !== false) {
    return state?.inventories?.past?.includes("living-room-vitrine-letter") ? "presentChest" : "presentWaitDisplayCase";
  }
  if (object(state, "present", "hallway-children-room-door").locked !== false) return has(inventory, "study-key") ? "presentChildrenDoor" : "presentChestReward";
  if (!solved(state, "present", "children-music")) return solved(state, "past", "children-music-key") ? "presentMusic" : "presentPhotoNote";
  if (object(state, "present", "hallway-kitchen-door").locked !== false) return "presentWaitKitchenDoor";
  if (!solved(state, "present", "kitchen-recipe")) return "presentRecipe";
  if (!solved(state, "present", "kitchen-family-table")) return "presentTable";
  if (!solved(state, "present", "kitchen-stove")) return "presentStove";
  if (!solved(state, "present", "bathroom-mosaic")) return has(inventory, "bathroom-mosaic-tile") || state?.timelines?.present?.puzzles?.["bathroom-mosaic"]?.tileInserted ? "presentMosaic" : "presentOvenTile";
  if (allBoltsOpen(state)) return "finalDoor";
  if (has(inventory, "final-key-living-room") || has(inventory, "final-key-bathroom")) return "presentFinalKeys";
  if (object(state, "past", "final-bolt-living-room").unlocked && object(state, "past", "final-bolt-bathroom").unlocked) return "waitCompanionBolts";
  return "presentCollectFinalKeys";
};

const getPlayerHint = ({ state, timeline, inventoryIds = [] }) => {
  const inventory = new Set([...(state?.inventories?.[timeline] ?? []), ...inventoryIds]);
  if (!state || !["past", "present"].includes(timeline)) return "explore";
  return timeline === "past" ? getPastHint(state, inventory) : getPresentHint(state, inventory);
};

export { getPlayerHint };
