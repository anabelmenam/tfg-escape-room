const solved = (state, character, id) => Boolean(state?.characters?.[character]?.puzzles?.[id]?.solved);
const object = (state, character, id) => state?.characters?.[character]?.objects?.[id] ?? {};
const has = (inventory, id) => inventory.has(id);
const unlocked = (state, id) => ["mum", "dad"].some((character) => object(state, character, id).unlocked);
const doorOpen = (state, id) => ["mum", "dad"].some((character) => object(state, character, id).locked === false);
const allBoltsOpen = (state) =>
  ["bedroom", "living-room", "children", "bathroom"].every((room) => unlocked(state, `final-bolt-${room}`));

const getMumHint = (state, inventory) => {
  const bedroomExitOpen = doorOpen(state, "bedroom-exit-door");
  const electricalDone = solved(state, "dad", "bedroom-electrical-panel");
  const sewingDone = solved(state, "mum", "bedroom-sewing-box") || electricalDone || bedroomExitOpen;
  const radioDone = solved(state, "mum", "bedroom-radio") || bedroomExitOpen;
  const safeOpen =
    object(state, "mum", "bedroom-symbol-safe").open || object(state, "mum", "bedroom-radio").hasDial || radioDone;
  if (!sewingDone && solved(state, "dad", "bedroom-family-photo")) return "mumSewing";
  if (!sewingDone) return "mumBedroomSearch";
  if (!electricalDone && !has(inventory, "bedroom-electrical-plan")) return "mumElectricalPlan";
  if (!safeOpen) return solved(state, "dad", "bedroom-light-reveal-puzzle") ? "mumSafe" : "mumWaitSymbols";
  if (!radioDone) return has(inventory, "radio-dial") ? "mumRadio" : "mumSafe";
  if (!bedroomExitOpen) return has(inventory, "bedroom-key") ? "mumBedroomExit" : "mumRadioReward";
  if (!solved(state, "mum", "hallway-clock") && !solved(state, "dad", "hallway-maze"))
    return has(inventory, "clock-hand") ? "mumClock" : "mumBedroomSearch";
  if (!solved(state, "mum", "bathroom-hot-water") && !solved(state, "dad", "bathroom-sequence")) return "mumHotWater";
  if (!doorOpen(state, "hallway-living-room-door") && !solved(state, "dad", "living-room-rainbow-books"))
    return "mumWaitLivingRoomDoor";
  if (
    !object(state, "mum", "living-room-painting-slot").placed &&
    !solved(state, "mum", "living-room-painting") &&
    !object(state, "dad", "living-room-sofa-cushion").cut
  )
    return solved(state, "dad", "living-room-rainbow-books") ? "mumPainting" : "mumWaitBooks";
  if (!solved(state, "mum", "living-room-painting") && !object(state, "dad", "living-room-sofa-cushion").cut)
    return "mumPaintingPieces";
  if (!solved(state, "mum", "living-room-embers") && object(state, "dad", "living-room-chest").locked !== false)
    return object(state, "dad", "living-room-fireplace").open ? "mumEmbers" : "mumWaitFireplace";
  if (object(state, "dad", "living-room-chest").locked !== false)
    return has(inventory, "living-room-vitrine-letter") ? "mumChest" : "mumDisplayCase";
  if (!doorOpen(state, "hallway-children-room-door") && !solved(state, "mum", "children-blocks"))
    return "mumWaitChildrenDoor";
  if (!solved(state, "mum", "children-blocks") && !solved(state, "mum", "children-globe-pin")) return "mumBlocks";
  if (!solved(state, "mum", "children-globe-pin") && !solved(state, "mum", "children-globe"))
    return has(inventory, "globe-pushpin") ? "mumPin" : "mumBlocksReward";
  if (!solved(state, "mum", "children-globe") && !solved(state, "mum", "children-music-key")) return "mumPhotoBoard";
  if (!solved(state, "mum", "children-music-key") && !solved(state, "dad", "children-music")) return "mumMusicKey";
  if (!solved(state, "mum", "children-wardrobe-chains") && !doorOpen(state, "hallway-kitchen-door"))
    return has(inventory, "bolt-cutters") ? "mumChains" : "mumWaitMusic";
  if (!doorOpen(state, "hallway-kitchen-door")) return has(inventory, "crowbar") ? "mumKitchenDoor" : "mumWardrobe";
  if (!solved(state, "dad", "kitchen-recipe") && !has(inventory, "kitchen-recipe-note")) return "mumRecipeNote";
  if (!solved(state, "mum", "kitchen-oven") && !solved(state, "dad", "bathroom-mosaic"))
    return solved(state, "dad", "kitchen-stove") ? "mumOven" : "mumWaitStove";
  if (!solved(state, "dad", "bathroom-mosaic")) return "mumWaitMosaic";
  if (allBoltsOpen(state)) return "finalDoor";
  if (has(inventory, "final-key-bedroom") || has(inventory, "final-key-children")) return "mumFinalKeys";
  if (unlocked(state, "final-bolt-bedroom") && unlocked(state, "final-bolt-children")) return "waitCompanionBolts";
  return "mumCollectFinalKeys";
};

const getDadHint = (state, inventory) => {
  const bedroomExitOpen = doorOpen(state, "bedroom-exit-door");
  if (
    !solved(state, "dad", "bedroom-family-photo") &&
    !solved(state, "mum", "bedroom-sewing-box") &&
    !solved(state, "dad", "bedroom-electrical-panel")
  )
    return "dadFamilyPhoto";
  if (!solved(state, "dad", "bedroom-electrical-panel") && !solved(state, "dad", "bedroom-light-reveal-puzzle"))
    return solved(state, "mum", "bedroom-sewing-box") ? "dadElectrical" : "dadBedroomSearch";
  if (!solved(state, "dad", "bedroom-light-reveal-puzzle") && !bedroomExitOpen) return "dadDeskLamp";
  if (!bedroomExitOpen) return "dadWaitBedroomExit";
  if (!solved(state, "dad", "bathroom-sequence") && !object(state, "dad", "hallway-maze-mirror").released)
    return solved(state, "mum", "bathroom-hot-water") ? "dadBathroomCode" : "dadWaitSteam";
  if (!object(state, "dad", "hallway-maze-mirror").released)
    return has(inventory, "screwdriver") ? "dadMirror" : "dadBathroomDrawer";
  if (!solved(state, "dad", "hallway-maze") && !doorOpen(state, "hallway-living-room-door"))
    return solved(state, "mum", "hallway-clock") ? "dadMaze" : "dadWaitClock";
  if (!doorOpen(state, "hallway-living-room-door"))
    return has(inventory, "living-room-key") ? "dadLivingRoomDoor" : "dadMazeReward";
  if (!solved(state, "dad", "living-room-rainbow-books") && !object(state, "dad", "living-room-sofa-cushion").cut)
    return "dadBooks";
  if (!object(state, "dad", "living-room-sofa-cushion").cut)
    return has(inventory, "living-room-scissors") ? "dadCushion" : "dadWaitPainting";
  if (!object(state, "dad", "living-room-sofa-cushion").searched) return "dadSearchCushion";
  if (!object(state, "dad", "living-room-fireplace").open) return "dadFireplace";
  if (object(state, "dad", "living-room-chest").locked !== false) {
    return state?.inventories?.mum?.includes("living-room-vitrine-letter") ? "dadChest" : "dadWaitDisplayCase";
  }
  if (!doorOpen(state, "hallway-children-room-door"))
    return has(inventory, "study-key") ? "dadChildrenDoor" : "dadChestReward";
  if (!solved(state, "dad", "children-music"))
    return solved(state, "mum", "children-music-key") ? "dadMusic" : "dadPhotoNote";
  if (!doorOpen(state, "hallway-kitchen-door")) return "dadWaitKitchenDoor";
  if (!solved(state, "dad", "kitchen-recipe")) return "dadRecipe";
  if (!solved(state, "dad", "kitchen-family-table")) return "dadTable";
  if (!solved(state, "dad", "kitchen-stove")) return "dadStove";
  if (!solved(state, "dad", "bathroom-mosaic"))
    return has(inventory, "bathroom-mosaic-tile") || state?.characters?.dad?.puzzles?.["bathroom-mosaic"]?.tileInserted
      ? "dadMosaic"
      : "dadOvenTile";
  if (allBoltsOpen(state)) return "finalDoor";
  if (has(inventory, "final-key-living-room") || has(inventory, "final-key-bathroom")) return "dadFinalKeys";
  if (unlocked(state, "final-bolt-living-room") && unlocked(state, "final-bolt-bathroom")) return "waitCompanionBolts";
  return "dadCollectFinalKeys";
};

const getPlayerHint = ({ state, character, inventoryIds = [] }) => {
  const inventory = new Set([...(state?.inventories?.[character] ?? []), ...inventoryIds]);
  if (!state || !["mum", "dad"].includes(character)) return "explore";
  if (allBoltsOpen(state)) return "finalDoor";
  return character === "mum" ? getMumHint(state, inventory) : getDadHint(state, inventory);
};

export { getPlayerHint };
