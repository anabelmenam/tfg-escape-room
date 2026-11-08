import { kitchenNapkinIds, kitchenRecipeIds, memoryPhotoIds } from "./constants.js";

export const solvePuzzle = (state, player, action) => {
  const character = player.character;
  if (action.targetId === "hallway-clock") {
    if (character !== "mum") throw new Error("El reloj se ajusta en el Mamá.");
    const clockHandIndex = state.inventories.mum.indexOf("clock-hand");
    if (clockHandIndex !== -1) state.inventories.mum.splice(clockHandIndex, 1);
  }
  if (
    action.targetId === "hallway-maze" &&
    (character !== "dad" ||
      !state.characters.mum.puzzles["hallway-clock"]?.solved ||
      !state.characters.dad.objects["hallway-maze-mirror"]?.open)
  )
    throw new Error("Primero hay que abrir el espejo y resolver el reloj en el Mamá.");
  if (action.targetId === "bathroom-hot-water" && character !== "mum")
    throw new Error("El agua caliente debe activarse en el Mamá.");
  if (
    action.targetId === "bathroom-sequence" &&
    (character !== "dad" || !state.characters.mum.puzzles["bathroom-hot-water"]?.solved)
  )
    throw new Error("Primero hay que revelar la secuencia en el baño del Mamá.");
  if (
    action.targetId === "bedroom-radio" &&
    (character !== "mum" || !state.inventories.dad.includes("bedroom-radio-note"))
  )
    throw new Error("Primero hay que recoger la nota de la radio en el Papá.");
  if (action.targetId === "bedroom-radio") {
    state.inventories.dad.splice(state.inventories.dad.indexOf("bedroom-radio-note"), 1);
    const dialIndex = state.inventories.mum.indexOf("radio-dial");
    if (dialIndex !== -1) state.inventories.mum.splice(dialIndex, 1);
  }
  if (
    action.targetId === "bedroom-electrical-panel" &&
    (character !== "dad" || !state.inventories.mum.includes("bedroom-electrical-plan"))
  )
    throw new Error("Primero hay que recoger el plano eléctrico en el Mamá.");
  if (action.targetId === "bedroom-electrical-panel")
    state.inventories.mum.splice(state.inventories.mum.indexOf("bedroom-electrical-plan"), 1);
  if (action.targetId === "living-room-rainbow-books" && character !== "dad")
    throw new Error("Los libros se ordenan en el Papá.");
  if (
    action.targetId === "living-room-embers" &&
    (character !== "mum" || !state.characters.dad.objects["living-room-fireplace"]?.open)
  )
    throw new Error("Primero hay que encender la chimenea en el Papá.");
  if (
    action.targetId === "bedroom-sewing-box" &&
    (character !== "mum" || !state.characters.dad.puzzles["bedroom-family-photo"]?.solved)
  )
    throw new Error("Primero hay que ordenar la foto familiar en el Papá.");
  if (action.targetId === "children-blocks" && character !== "mum")
    throw new Error("Los bloques se reconstruyen en el Mamá.");
  if (action.targetId === "children-music-key") {
    const keyIndex = state.inventories.mum.indexOf("music-box-key");
    if (character !== "mum" || !state.characters.mum.puzzles["children-globe"]?.solved || keyIndex === -1)
      throw new Error("Necesitas la llave escondida detrás del corcho.");
    state.inventories.mum.splice(keyIndex, 1);
  }
  if (
    action.targetId === "children-music" &&
    (character !== "dad" || !state.characters.mum.puzzles["children-music-key"]?.solved)
  )
    throw new Error("Primero hay que activar la caja musical del Mamá con su llave.");
  if (action.targetId === "children-globe-pin") {
    const pinIndex = state.inventories.mum.indexOf("globe-pushpin");
    if (character !== "mum" || !state.characters.mum.puzzles["children-blocks"]?.solved || pinIndex === -1)
      throw new Error("Necesitas la chincheta obtenida al completar los bloques.");
    state.inventories.mum.splice(pinIndex, 1);
  }
  if (action.targetId === "children-globe") {
    if (character !== "mum" || !state.characters.mum.puzzles["children-globe-pin"]?.solved)
      throw new Error("Primero hay que colocar la chincheta que falta en el corcho.");
    if (!memoryPhotoIds.every((photoId) => state.inventories.mum.includes(photoId)))
      throw new Error("Primero hay que encontrar las cuatro fotos escondidas.");
    memoryPhotoIds.forEach((photoId) => state.inventories.mum.splice(state.inventories.mum.indexOf(photoId), 1));
    const clueIndex = state.inventories.dad.indexOf("children-photo-order-note");
    if (clueIndex !== -1) state.inventories.dad.splice(clueIndex, 1);
  }
  if (action.targetId === "children-wardrobe-chains") {
    const cuttersIndex = state.inventories.mum.indexOf("bolt-cutters");
    if (character !== "mum" || !state.characters.dad.puzzles["children-music"]?.solved || cuttersIndex === -1)
      throw new Error("Necesitas el cortacadenas escondido en la caja musical.");
    state.inventories.mum.splice(cuttersIndex, 1);
  }
  if (action.targetId === "kitchen-recipe") {
    const placements = state.characters.dad.puzzles[action.targetId]?.placements;
    if (character !== "dad" || !kitchenRecipeIds.every((id, index) => placements?.[index] === id))
      throw new Error("Coloca correctamente los ingredientes de la receta.");
    const noteIndex = state.inventories.mum.indexOf("kitchen-recipe-note");
    if (noteIndex !== -1) state.inventories.mum.splice(noteIndex, 1);
  }
  if (action.targetId === "kitchen-family-table") {
    const placements = state.characters.dad.puzzles[action.targetId]?.placements;
    if (
      character !== "dad" ||
      !state.characters.dad.puzzles["kitchen-recipe"]?.solved ||
      !kitchenNapkinIds.every((id, index) => placements?.[index] === id)
    )
      throw new Error("Coloca cada servilleta en el puesto familiar correcto.");
  }
  if (
    action.targetId === "kitchen-stove" &&
    (character !== "dad" || !state.characters.dad.puzzles["kitchen-family-table"]?.solved)
  )
    throw new Error("Primero hay que reconstruir la mesa familiar.");
  if (
    action.targetId === "kitchen-oven" &&
    (character !== "mum" || !state.characters.dad.puzzles["kitchen-stove"]?.solved)
  )
    throw new Error("Primero hay que ajustar los fogones.");
  if (
    action.targetId === "bathroom-mosaic" &&
    (character !== "dad" || !state.characters.dad.puzzles["bathroom-mosaic"]?.tileInserted)
  )
    throw new Error("Primero hay que colocar el azulejo que falta.");

  state.characters[character].puzzles[action.targetId] = {
    ...state.characters[character].puzzles[action.targetId],
    solved: true,
    ...action.payload,
  };
};
