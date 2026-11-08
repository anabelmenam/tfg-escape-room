import { familyStoryNoteIds, kitchenIngredientIds, kitchenNapkinIds, memoryPhotoIds } from "./constants.js";

export const pickUpItem = (state, player, action) => {
  const character = player.character;
  if (familyStoryNoteIds.has(action.targetId)) {
    state.journalEntries ??= [];
    if (!state.journalEntries.includes(action.targetId)) state.journalEntries.push(action.targetId);
    return;
  }
  if (
    action.targetId === "final-key-bedroom" &&
    (character !== "mum" || !state.characters.mum.puzzles["bedroom-radio"]?.solved)
  )
    throw new Error("Primero hay que completar la radio.");
  if (
    action.targetId === "final-key-living-room" &&
    (character !== "dad" || state.characters.dad.objects["living-room-chest"]?.locked !== false)
  )
    throw new Error("Primero hay que abrir el cofre del salón.");
  if (
    action.targetId === "final-key-children" &&
    (character !== "mum" || !state.characters.mum.puzzles["children-wardrobe-chains"]?.solved)
  )
    throw new Error("Primero hay que cortar las cadenas del armario.");
  if (
    action.targetId === "final-key-bathroom" &&
    (character !== "dad" || !state.characters.dad.puzzles["bathroom-mosaic"]?.solved)
  )
    throw new Error("Primero hay que completar el mosaico.");
  if (action.targetId === "flashlight" && character !== "dad") throw new Error("La linterna solo existe en el Papá.");
  if (
    action.targetId === "crowbar" &&
    (character !== "mum" || !state.characters.mum.puzzles["children-wardrobe-chains"]?.solved)
  )
    throw new Error("Primero hay que cortar las cadenas del armario.");
  if (
    action.targetId === "bolt-cutters" &&
    (character !== "mum" || !state.characters.dad.puzzles["children-music"]?.solved)
  )
    throw new Error("Primero hay que completar el puzle de música.");
  if (
    action.targetId === "music-box-key" &&
    (character !== "mum" || !state.characters.mum.puzzles["children-globe"]?.solved)
  )
    throw new Error("Primero hay que completar el corcho de fotos.");
  if (
    action.targetId === "globe-pushpin" &&
    (character !== "mum" || !state.characters.mum.puzzles["children-blocks"]?.solved)
  )
    throw new Error("Primero hay que completar los bloques del Mamá.");
  if (memoryPhotoIds.includes(action.targetId) && character !== "mum")
    throw new Error("Las fotos escondidas solo existen en el Mamá.");
  if (action.targetId === "children-photo-order-note" && character !== "dad")
    throw new Error("La nota de las fotos está en el Papá.");
  if (action.targetId === "hallway-maze-note") throw new Error("El plano del laberinto es una pista fija de la pared.");
  if (action.targetId === "kitchen-recipe-note" && character !== "mum") throw new Error("La receta está en el Mamá.");
  if (kitchenIngredientIds.includes(action.targetId) && character !== "dad")
    throw new Error("Los ingredientes se recogen en el Papá.");
  if (kitchenNapkinIds.includes(action.targetId) && character !== "dad")
    throw new Error("Las servilletas se recogen en el Papá.");
  if (action.targetId === "kitchen-napkin-ochre" && !state.characters.dad.puzzles["kitchen-recipe"]?.solved)
    throw new Error("Primero hay que completar la receta.");
  if (
    action.targetId === "bathroom-mosaic-tile" &&
    (character !== "dad" || !state.characters.mum.puzzles["kitchen-oven"]?.solved)
  )
    throw new Error("Primero hay que resolver el horno.");
  if (
    action.targetId === "screwdriver" &&
    (character !== "dad" || !state.characters.dad.puzzles["bathroom-sequence"]?.solved)
  )
    throw new Error("Primero hay que resolver la secuencia del baño.");

  const inventory = state.inventories[character];
  if (!inventory.includes(action.targetId)) inventory.push(action.targetId);
};
