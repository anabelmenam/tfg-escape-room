import { finalLocks, kitchenIngredientIds, kitchenNapkinIds, kitchenRecipeIds } from "./constants.js";

export const setObjectState = (state, character, objectId, patch) => {
  const objects = state.characters[character].objects;
  objects[objectId] = { ...objects[objectId], ...patch };
};

export const interactWithObject = (state, player, action) => {
  const character = player.character;
  if (action.payload?.operation === "set-open") {
    setObjectState(state, character, action.targetId, { open: Boolean(action.payload.open) });
    return;
  }
  if (action.payload?.operation === "set-active") {
    setObjectState(state, character, action.targetId, { active: Boolean(action.payload.active) });
    return;
  }
  if (action.targetId === "hallway-final-threshold") {
    const allUnlocked = Object.keys(finalLocks).every((lockId) => state.characters.mum.objects[lockId]?.unlocked);
    if (!allUnlocked) throw new Error("Primero hay que abrir los cuatro cerrojos.");
    state.ending ??= {
      phase: "threshold",
      holding: { mum: false, dad: false },
      choice: null,
      sacrificeCharacter: null,
    };
    if (state.ending.phase !== "threshold") return;
    state.ending.holding ??= { mum: false, dad: false };
    state.ending.holding[character] = action.payload?.operation === "hold-start";
    if (state.ending.holding.mum && state.ending.holding.dad) {
      state.ending.phase = "opening";
      state.ending.crossed = { mum: false, dad: false };
      for (const era of ["mum", "dad"]) {
        setObjectState(state, era, "hallway-street-door", { locked: false, open: true });
      }
    }
    return;
  }
  if (action.targetId === "hallway-final-crossed") {
    if (state.ending?.phase !== "opening") return;
    state.ending.crossed ??= { mum: false, dad: false };
    state.ending.crossed[character] = true;
    if (state.ending.crossed.mum && state.ending.crossed.dad) state.ending.phase = "choice";
    return;
  }
  if (action.targetId === "hallway-final-choice") {
    if (state.ending?.phase !== "choice") throw new Error("La puerta todavía no está preparada.");
    const choice = action.payload?.choice;
    if (!["together", "sacrifice"].includes(choice)) throw new Error("Ese desenlace no es válido.");
    state.ending.phase = "complete";
    state.ending.choice = choice;
    state.ending.sacrificeCharacter = choice === "sacrifice" ? character : null;
    return;
  }
  if (finalLocks[action.targetId]) {
    const lock = finalLocks[action.targetId];
    const keyIndex = state.inventories[character].indexOf(lock.keyId);
    if (character !== lock.character || keyIndex === -1)
      throw new Error("Necesitas la llave final con el mismo símbolo.");
    state.inventories[character].splice(keyIndex, 1);
    for (const era of ["mum", "dad"]) setObjectState(state, era, action.targetId, { unlocked: true });
    const allUnlocked = Object.keys(finalLocks).every((lockId) => state.characters.mum.objects[lockId]?.unlocked);
    if (allUnlocked) {
      state.ending ??= {
        phase: "locked",
        holding: { mum: false, dad: false },
        choice: null,
        sacrificeCharacter: null,
      };
      state.ending.phase = "threshold";
      state.ending.holding = { mum: false, dad: false };
    }
    return;
  }
  if (action.targetId === "bathroom-mosaic" && action.payload?.operation === "insert-tile") {
    const tileIndex = state.inventories.dad.indexOf("bathroom-mosaic-tile");
    if (character !== "dad" || tileIndex === -1) throw new Error("Necesitas el azulejo que está dentro del horno.");
    state.inventories.dad.splice(tileIndex, 1);
    state.characters.dad.puzzles["bathroom-mosaic"] = {
      ...state.characters.dad.puzzles["bathroom-mosaic"],
      tileInserted: true,
    };
    return;
  }
  if (action.targetId === "kitchen-recipe") {
    if (character !== "dad") throw new Error("La receta se prepara en el Papá.");
    const slotIndex = Number(action.payload.slotIndex);
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= kitchenRecipeIds.length) {
      throw new Error("Esa posición de la tabla no es válida.");
    }
    const currentPuzzle = state.characters.dad.puzzles[action.targetId] ?? {};
    if (currentPuzzle.solved) return;
    const placements = Array.isArray(currentPuzzle.placements)
      ? [...currentPuzzle.placements]
      : new Array(kitchenRecipeIds.length).fill(null);
    if (action.payload.operation === "place") {
      const ingredientId = action.payload.ingredientId;
      const ingredientIndex = state.inventories.dad.indexOf(ingredientId);
      if (!kitchenIngredientIds.includes(ingredientId) || ingredientIndex === -1 || placements[slotIndex]) {
        throw new Error("No puedes colocar ese ingrediente en esta posición.");
      }
      state.inventories.dad.splice(ingredientIndex, 1);
      placements[slotIndex] = ingredientId;
    } else if (action.payload.operation === "remove") {
      const ingredientId = placements[slotIndex];
      if (!ingredientId) return;
      placements[slotIndex] = null;
      if (!state.inventories.dad.includes(ingredientId)) state.inventories.dad.push(ingredientId);
    } else {
      throw new Error("La acción del ingrediente no es válida.");
    }
    const solved = placements.every((ingredientId, index) => ingredientId === kitchenRecipeIds[index]);
    state.characters.dad.puzzles[action.targetId] = {
      ...currentPuzzle,
      placements,
      solved,
    };
    if (solved) {
      const recipeNoteIndex = state.inventories.mum.indexOf("kitchen-recipe-note");
      if (recipeNoteIndex !== -1) state.inventories.mum.splice(recipeNoteIndex, 1);
    }
    return;
  }
  if (action.targetId === "kitchen-family-table") {
    if (character !== "dad") throw new Error("La mesa se prepara en el Papá.");
    const seatIndex = Number(action.payload.seatIndex);
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= kitchenNapkinIds.length) {
      throw new Error("Ese puesto de la mesa no es válido.");
    }
    const currentPuzzle = state.characters.dad.puzzles[action.targetId] ?? {};
    if (currentPuzzle.solved) return;
    const placements = Array.isArray(currentPuzzle.placements)
      ? [...currentPuzzle.placements]
      : new Array(kitchenNapkinIds.length).fill(null);
    if (action.payload.operation === "place") {
      const napkinId = action.payload.napkinId;
      const napkinIndex = state.inventories.dad.indexOf(napkinId);
      if (!kitchenNapkinIds.includes(napkinId) || napkinIndex === -1 || placements[seatIndex]) {
        throw new Error("No puedes colocar esa servilleta en este puesto.");
      }
      state.inventories.dad.splice(napkinIndex, 1);
      placements[seatIndex] = napkinId;
    } else if (action.payload.operation === "remove") {
      const napkinId = placements[seatIndex];
      if (!napkinId) return;
      placements[seatIndex] = null;
      if (!state.inventories.dad.includes(napkinId)) state.inventories.dad.push(napkinId);
    } else {
      throw new Error("La acción de la servilleta no es válida.");
    }
    state.characters.dad.puzzles[action.targetId] = {
      ...currentPuzzle,
      placements,
      solved: placements.every((napkinId, index) => napkinId === kitchenNapkinIds[index]),
    };
    return;
  }
  if (["living-room-painting-piece-0", "living-room-painting-piece-4"].includes(action.targetId)) {
    const painting = state.characters.mum.objects["living-room-painting-slot"];
    if (character !== "mum" || !painting?.placed) throw new Error("Primero hay que colocar el cuadro en el Mamá.");
    const index = Number(action.targetId.slice(-1));
    const inventoryId = index === 0 ? "painting-piece-1" : "painting-piece-2";
    const inventoryIndex = state.inventories.mum.indexOf(inventoryId);
    if (inventoryIndex !== -1) state.inventories.mum.splice(inventoryIndex, 1);
    const restoredPieces = [...new Set([...(painting.restoredPieces ?? []), index])];
    setObjectState(state, "mum", "living-room-painting-slot", { restoredPieces });
    if ([0, 4].every((piece) => restoredPieces.includes(piece))) {
      state.characters.mum.puzzles["living-room-painting"] = { solved: true };
    }
    return;
  }
  if (action.targetId === "living-room-sofa-cushion") {
    if (character !== "dad") throw new Error("El cojín solo se puede registrar en el Papá.");
    const cushion = state.characters.dad.objects[action.targetId] ?? {};
    if (!cushion.cut) {
      const scissorsIndex = state.inventories.dad.indexOf("living-room-scissors");
      if (scissorsIndex === -1) throw new Error("Necesitas las tijeras del cuadro.");
      state.inventories.dad.splice(scissorsIndex, 1);
      setObjectState(state, "dad", action.targetId, { cut: true });
      return;
    }
    if (!cushion.searched) {
      setObjectState(state, "dad", action.targetId, { searched: true });
      if (!state.inventories.dad.includes("living-room-match")) state.inventories.dad.push("living-room-match");
    }
    return;
  }
  if (action.targetId === "living-room-fireplace") {
    if (character !== "dad") throw new Error("La chimenea solo se puede encender en el Papá.");
    const matchIndex = state.inventories.dad.indexOf("living-room-match");
    if (matchIndex === -1) throw new Error("Necesitas la cerilla escondida en el cojín.");
    state.inventories.dad.splice(matchIndex, 1);
    setObjectState(state, "dad", action.targetId, { open: true });
    return;
  }
  if (action.targetId === "hallway-living-room-door") {
    const keyIndex = state.inventories.dad.indexOf("living-room-key");
    if (character !== "dad" || keyIndex === -1)
      throw new Error("Necesitas la llave obtenida al resolver el laberinto.");
    state.inventories.dad.splice(keyIndex, 1);
    for (const era of ["mum", "dad"]) setObjectState(state, era, action.targetId, { locked: false });
    return;
  }
  if (action.targetId === "hallway-children-room-door") {
    const keyIndex = state.inventories.dad.indexOf("study-key");
    if (character !== "dad" || keyIndex === -1)
      throw new Error("Necesitas la llave que está dentro del cofre del salón.");
    state.inventories.dad.splice(keyIndex, 1);
    for (const era of ["mum", "dad"]) setObjectState(state, era, action.targetId, { locked: false });
    return;
  }
  if (["hallway-kitchen-door", "living-room-kitchen-door"].includes(action.targetId)) {
    const crowbarIndex = state.inventories.mum.indexOf("crowbar");
    if (character !== "mum" || crowbarIndex === -1)
      throw new Error("Necesitas la palanca oculta en el armario infantil.");
    state.inventories.mum.splice(crowbarIndex, 1);
    for (const era of ["mum", "dad"]) {
      setObjectState(state, era, "hallway-kitchen-door", { locked: false });
      setObjectState(state, era, "living-room-kitchen-door", { locked: false });
    }
    return;
  }
  if (action.targetId === "hallway-maze-mirror") {
    if (character !== "dad") throw new Error("El espejo solo se manipula en el Papá.");
    const mirror = state.characters.dad.objects[action.targetId] ?? {};
    if (!mirror.released) {
      if (!state.characters.dad.puzzles["bathroom-sequence"]?.solved) {
        throw new Error("Primero hay que resolver la secuencia del baño en el Papá.");
      }
      const screwdriverIndex = state.inventories.dad.indexOf("screwdriver");
      if (screwdriverIndex === -1) throw new Error("Necesitas el destornillador del baño.");
      state.inventories.dad.splice(screwdriverIndex, 1);
      setObjectState(state, "dad", action.targetId, { released: true, open: true });
    } else {
      setObjectState(state, "dad", action.targetId, { released: true, open: !mirror.open });
    }
    return;
  }
  if (action.targetId === "bedroom-symbol-safe") {
    if (character !== "mum" || !state.characters.dad.puzzles["bedroom-light-reveal-puzzle"]?.solved)
      throw new Error("Primero hay que revelar los símbolos en el Papá.");
    setObjectState(state, "mum", action.targetId, { open: true, locked: false });
    return;
  }
  if (action.targetId === "bedroom-electrical-panel" && action.payload?.operation === "insert-fuse") {
    const fuseIndex = state.inventories.dad.indexOf("fuse");
    if (character !== "dad" || fuseIndex === -1) throw new Error("Necesitas el fusible del escritorio.");
    state.inventories.dad.splice(fuseIndex, 1);
    setObjectState(state, "dad", action.targetId, { hasFuse: true });
    return;
  }
  if (action.targetId === "bedroom-radio" && action.payload?.operation === "insert-dial") {
    const dialIndex = state.inventories.mum.indexOf("radio-dial");
    if (character !== "mum" || dialIndex === -1) throw new Error("Necesitas seleccionar la rueda de la radio.");
    state.inventories.mum.splice(dialIndex, 1);
    setObjectState(state, "mum", action.targetId, { hasDial: true });
    return;
  }
  if (action.targetId === "bedroom-exit-door") {
    if (character !== "mum") throw new Error("La puerta solo puede desbloquearse desde el Mamá.");
    const keyIndex = state.inventories.mum.indexOf("bedroom-key");
    if (keyIndex !== -1) state.inventories.mum.splice(keyIndex, 1);
    setObjectState(state, "mum", "bedroom-exit-door", { open: true, locked: false });
    setObjectState(state, "dad", "bedroom-exit-door", { locked: false });
    return;
  }
  if (action.targetId === "living-room-painting-slot") {
    if (character !== "mum" || !state.characters.dad.puzzles["living-room-rainbow-books"]?.solved)
      throw new Error("Primero hay que ordenar los libros del arcoíris.");
    const paintingIndex = state.inventories.mum.indexOf("living-room-fallen-painting");
    if (paintingIndex === -1) throw new Error("Necesitas recoger el cuadro caído.");
    state.inventories.mum.splice(paintingIndex, 1);
    setObjectState(state, "mum", action.targetId, { placed: true });
    setObjectState(state, "dad", action.targetId, { placed: true });
    return;
  }
  if (action.targetId === "living-room-chest") {
    if (character !== "dad" || !state.inventories.mum.includes("living-room-vitrine-letter")) {
      throw new Error("Primero hay que encontrar la carta de la vitrina.");
    }
    const letterIndex = state.inventories.mum.indexOf("living-room-vitrine-letter");
    if (letterIndex !== -1) state.inventories.mum.splice(letterIndex, 1);
    setObjectState(state, "dad", action.targetId, { locked: false });
    return;
  }
  setObjectState(state, character, action.targetId, { open: true });
};
