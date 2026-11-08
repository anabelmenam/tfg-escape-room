import { interactWithObject } from "./gameLogic/objectInteractions.js";
import { pickUpItem } from "./gameLogic/itemActions.js";
import { solvePuzzle } from "./gameLogic/puzzleActions.js";

const actionHandlers = {
  "object.interact": interactWithObject,
  "puzzle.solved": solvePuzzle,
  "item.pickup": pickUpItem,
};

export const reduceAction = (state, player, action) => {
  const legacyBathroomKey = state.inventories.mum.indexOf("final-key-bathroom");
  if (legacyBathroomKey !== -1) {
    state.inventories.mum.splice(legacyBathroomKey, 1);
    if (!state.inventories.dad.includes("final-key-bathroom")) {
      state.inventories.dad.push("final-key-bathroom");
    }
  }

  const handler = actionHandlers[action.type];
  return handler?.(state, player, action);
};

export { setObjectState } from "./gameLogic/objectInteractions.js";
