export const kitchenNapkinIds = [
  "kitchen-napkin-red",
  "kitchen-napkin-green",
  "kitchen-napkin-blue",
  "kitchen-napkin-ochre",
];

export const kitchenRecipeIds = ["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"];

export const kitchenIngredientIds = [
  ...kitchenRecipeIds,
  "kitchen-tomatoes-2",
  "kitchen-carrots-3",
  "kitchen-cheese-2",
];

export const memoryPhotoIds = [
  "children-memory-photo-home",
  "children-memory-photo-school",
  "children-memory-photo-park",
  "children-memory-photo-station",
];

export const familyStoryNoteIds = new Set(
  Array.from({ length: 10 }, (_, index) => `family-note-${String(index + 1).padStart(2, "0")}`),
);

export const finalLocks = {
  "final-bolt-bedroom": { keyId: "final-key-bedroom", character: "mum" },
  "final-bolt-living-room": { keyId: "final-key-living-room", character: "dad" },
  "final-bolt-children": { keyId: "final-key-children", character: "mum" },
  "final-bolt-bathroom": { keyId: "final-key-bathroom", character: "dad" },
};
