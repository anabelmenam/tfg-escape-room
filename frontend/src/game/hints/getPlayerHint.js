const solved = (state, character, id) => Boolean(state?.characters?.[character]?.puzzles?.[id]?.solved);
const object = (state, character, id) => state?.characters?.[character]?.objects?.[id] ?? {};
const has = (inventory, id) => inventory.has(id);
const allBoltsOpen = (state) =>
  ["bedroom", "living-room", "children", "bathroom"].every(
    (room) => object(state, "mum", `final-bolt-${room}`).unlocked,
  );

const getMumHint = (state, inventory) => {
  if (!solved(state, "mum", "bedroom-sewing-box") && solved(state, "dad", "bedroom-family-photo")) return "mumSewing";
  if (!solved(state, "mum", "bedroom-sewing-box")) return "mumBedroomSearch";
  if (!solved(state, "dad", "bedroom-electrical-panel") && !has(inventory, "bedroom-electrical-plan"))
    return "mumElectricalPlan";
  if (!object(state, "mum", "bedroom-symbol-safe").open)
    return solved(state, "dad", "bedroom-light-reveal-puzzle") ? "mumSafe" : "mumWaitSymbols";
  if (!solved(state, "mum", "bedroom-radio")) return has(inventory, "radio-dial") ? "mumRadio" : "mumSafe";
  if (object(state, "mum", "bedroom-exit-door").locked !== false)
    return has(inventory, "bedroom-key") ? "mumBedroomExit" : "mumRadioReward";
  if (!solved(state, "mum", "hallway-clock")) return has(inventory, "clock-hand") ? "mumClock" : "mumBedroomSearch";
  if (!solved(state, "mum", "bathroom-hot-water")) return "mumHotWater";
  if (object(state, "mum", "hallway-living-room-door").locked !== false) return "mumWaitLivingRoomDoor";
  if (!object(state, "mum", "living-room-painting-slot").placed)
    return solved(state, "dad", "living-room-rainbow-books") ? "mumPainting" : "mumWaitBooks";
  if (!solved(state, "mum", "living-room-painting")) return "mumPaintingPieces";
  if (!solved(state, "mum", "living-room-embers"))
    return object(state, "dad", "living-room-fireplace").open ? "mumEmbers" : "mumWaitFireplace";
  if (object(state, "dad", "living-room-chest").locked !== false)
    return has(inventory, "living-room-vitrine-letter") ? "mumChest" : "mumDisplayCase";
  if (object(state, "mum", "hallway-children-room-door").locked !== false) return "mumWaitChildrenDoor";
  if (!solved(state, "mum", "children-blocks")) return "mumBlocks";
  if (!solved(state, "mum", "children-globe-pin"))
    return has(inventory, "globe-pushpin") ? "mumPin" : "mumBlocksReward";
  if (!solved(state, "mum", "children-globe")) return "mumPhotoBoard";
  if (!solved(state, "mum", "children-music-key")) return "mumMusicKey";
  if (!solved(state, "mum", "children-wardrobe-chains"))
    return has(inventory, "bolt-cutters") ? "mumChains" : "mumWaitMusic";
  if (object(state, "mum", "hallway-kitchen-door").locked !== false)
    return has(inventory, "crowbar") ? "mumKitchenDoor" : "mumWardrobe";
  if (!solved(state, "dad", "kitchen-recipe") && !has(inventory, "kitchen-recipe-note")) return "mumRecipeNote";
  if (!solved(state, "mum", "kitchen-oven")) return solved(state, "dad", "kitchen-stove") ? "mumOven" : "mumWaitStove";
  if (!solved(state, "dad", "bathroom-mosaic")) return "mumWaitMosaic";
  if (allBoltsOpen(state)) return "finalDoor";
  if (has(inventory, "final-key-bedroom") || has(inventory, "final-key-children")) return "mumFinalKeys";
  if (object(state, "mum", "final-bolt-bedroom").unlocked && object(state, "mum", "final-bolt-children").unlocked)
    return "waitCompanionBolts";
  return "mumCollectFinalKeys";
};

const getDadHint = (state, inventory) => {
  if (!solved(state, "dad", "bedroom-family-photo")) return "dadFamilyPhoto";
  if (!solved(state, "dad", "bedroom-electrical-panel"))
    return solved(state, "mum", "bedroom-sewing-box") ? "dadElectrical" : "dadBedroomSearch";
  if (!solved(state, "dad", "bedroom-light-reveal-puzzle")) return "dadDeskLamp";
  if (object(state, "dad", "bedroom-exit-door").locked !== false) return "dadWaitBedroomExit";
  if (!solved(state, "dad", "bathroom-sequence"))
    return solved(state, "mum", "bathroom-hot-water") ? "dadBathroomCode" : "dadWaitSteam";
  if (!object(state, "dad", "hallway-maze-mirror").released)
    return has(inventory, "screwdriver") ? "dadMirror" : "dadBathroomDrawer";
  if (!solved(state, "dad", "hallway-maze")) return solved(state, "mum", "hallway-clock") ? "dadMaze" : "dadWaitClock";
  if (object(state, "dad", "hallway-living-room-door").locked !== false)
    return has(inventory, "living-room-key") ? "dadLivingRoomDoor" : "dadMazeReward";
  if (!solved(state, "dad", "living-room-rainbow-books")) return "dadBooks";
  if (!object(state, "dad", "living-room-sofa-cushion").cut)
    return has(inventory, "living-room-scissors") ? "dadCushion" : "dadWaitPainting";
  if (!object(state, "dad", "living-room-sofa-cushion").searched) return "dadSearchCushion";
  if (!object(state, "dad", "living-room-fireplace").open) return "dadFireplace";
  if (object(state, "dad", "living-room-chest").locked !== false) {
    return state?.inventories?.mum?.includes("living-room-vitrine-letter") ? "dadChest" : "dadWaitDisplayCase";
  }
  if (object(state, "dad", "hallway-children-room-door").locked !== false)
    return has(inventory, "study-key") ? "dadChildrenDoor" : "dadChestReward";
  if (!solved(state, "dad", "children-music"))
    return solved(state, "mum", "children-music-key") ? "dadMusic" : "dadPhotoNote";
  if (object(state, "dad", "hallway-kitchen-door").locked !== false) return "dadWaitKitchenDoor";
  if (!solved(state, "dad", "kitchen-recipe")) return "dadRecipe";
  if (!solved(state, "dad", "kitchen-family-table")) return "dadTable";
  if (!solved(state, "dad", "kitchen-stove")) return "dadStove";
  if (!solved(state, "dad", "bathroom-mosaic"))
    return has(inventory, "bathroom-mosaic-tile") || state?.characters?.dad?.puzzles?.["bathroom-mosaic"]?.tileInserted
      ? "dadMosaic"
      : "dadOvenTile";
  if (allBoltsOpen(state)) return "finalDoor";
  if (has(inventory, "final-key-living-room") || has(inventory, "final-key-bathroom")) return "dadFinalKeys";
  if (object(state, "mum", "final-bolt-living-room").unlocked && object(state, "mum", "final-bolt-bathroom").unlocked)
    return "waitCompanionBolts";
  return "dadCollectFinalKeys";
};

const getPlayerHint = ({ state, character, inventoryIds = [] }) => {
  const inventory = new Set([...(state?.inventories?.[character] ?? []), ...inventoryIds]);
  if (!state || !["mum", "dad"].includes(character)) return "explore";
  return character === "mum" ? getMumHint(state, inventory) : getDadHint(state, inventory);
};

export { getPlayerHint };
