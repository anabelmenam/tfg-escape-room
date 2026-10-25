import * as THREE from "three";
import { KitchenIngredient, KitchenNapkin, RecipePuzzle, TableSettingPuzzle } from "../../puzzles/index.js";

const createKitchenFoodPuzzles = ({ character, testMode, furniture, appliancePuzzles, onFocus, onAction }) => {
  const { refrigerator, counter, firstTallCabinet, diningTable } = furniture;
  const ingredientSpecs = [
    ["kitchen-tomatoes", "tomato", new THREE.Vector3(-.8, 4.52, .2)],
    ["kitchen-carrots", "carrot", new THREE.Vector3(.75, 3.25, .15)],
    ["kitchen-cheese", "cheese", new THREE.Vector3(0, 5.68, .2)],
  ];
  const ingredients = character === "dad"
    ? ingredientSpecs.map(([id, kind, position]) => {
        const ingredient = new KitchenIngredient({ id, kind, onCollect: () => onAction?.("item.pickup", id) });
        ingredient.object3D.position.copy(position);
        refrigerator.object3D.add(ingredient.object3D);
        return ingredient;
      })
    : [];
  const napkins = character === "dad"
    ? ["red", "blue", "green", "ochre"].map((color, index) => new KitchenNapkin({
        id: `kitchen-napkin-${color}`,
        color: 0xcbbd9f,
        name: ["MAMÁ", "PAPÁ", "ALBA", "JAIME"][index],
        onCollect: () => onAction?.("item.pickup", `kitchen-napkin-${color}`),
      }))
    : [];
  if (napkins.length) {
    counter.addObjectToDrawer(0, napkins[0].object3D, new THREE.Vector3(0, -.12, -.82));
    refrigerator.object3D.add(napkins[1].object3D);
    napkins[1].object3D.position.set(-.82, 3.36, .42);
    firstTallCabinet.object3D.add(napkins[2].object3D);
    napkins[2].object3D.position.set(-.48, 2.65, .42);
    counter.object3D.add(napkins[3].object3D);
    napkins[3].object3D.position.set(-2.2, 2.79, .72);
    napkins[3].object3D.visible = false;
    napkins[3].setEnabled(false);
  }

  const recipe = new RecipePuzzle({
    character,
    onFocus,
    onSolved: () => {
      table.setAvailable(true);
      if (character === "dad" && napkins[3]) {
        napkins[3].setEnabled(true);
        napkins[3].object3D.visible = true;
      }
      onAction?.("puzzle.solved", "kitchen-recipe");
    },
    onPlacementChange: (payload) => onAction?.("object.interact", "kitchen-recipe", payload),
    onCollect: () => onAction?.("item.pickup", "kitchen-recipe-note"),
    ingredients,
  });
  if (character === "mum") {
    recipe.object3D.scale.setScalar(.5);
    counter.addObjectToDrawer(0, recipe.object3D, new THREE.Vector3(0, -.145, -.85));
  } else {
    recipe.object3D.position.set(-2.2, 2.86, .45);
    recipe.object3D.scale.setScalar(.54);
    counter.object3D.add(recipe.object3D);
  }

  const table = new TableSettingPuzzle({
    character,
    onFocus,
    onSolved: () => {
      appliancePuzzles.stove.setAvailable(true);
      appliancePuzzles.stove.trySolve();
      appliancePuzzles.stove.revealClue();
      onAction?.("puzzle.solved", "kitchen-family-table");
    },
    onPlacementChange: (payload) => onAction?.("object.interact", "kitchen-family-table", payload),
    napkins,
  });
  table.object3D.position.set(0, 2.72, 0);
  table.object3D.scale.setScalar(.9);
  diningTable.object3D.add(table.object3D);
  if (character === "dad") table.setAvailable(true);

  if (testMode) {
    recipe.setAvailable(true);
    table.setAvailable(true);
    if (napkins[3]) {
      napkins[3].object3D.visible = true;
      napkins[3].setEnabled(true);
    }
  }

  const applyState = (state) => {
    const kitchenOpen = ["mum", "dad"].some((era) =>
      state.characters?.[era]?.objects?.["hallway-kitchen-door"]?.locked === false
      || state.characters?.[era]?.objects?.["living-room-kitchen-door"]?.locked === false);
    if (kitchenOpen || testMode) recipe.setAvailable(true);
    const recipeState = state.characters?.dad?.puzzles?.["kitchen-recipe"];
    const recipeSolved = Boolean(recipeState?.solved);
    if (character === "mum" && (state.inventories?.mum?.includes("kitchen-recipe-note") || recipeSolved)) {
      recipe.object3D.visible = false;
      recipe.setEnabled(false);
    }
    if (character === "dad") recipe.applyPlacements(recipeState?.placements ?? []);
    if (recipeSolved) {
      if (character === "dad") recipe.solve({ notify: false, placements: recipeState.placements });
      table.setAvailable(true);
    }
    const tableState = state.characters?.dad?.puzzles?.["kitchen-family-table"];
    if (character === "dad") table.applyPlacements(tableState?.placements ?? []);
    const tableSolved = Boolean(tableState?.solved);
    if (tableSolved) {
      if (character === "dad") table.solve({ notify: false, placements: tableState.placements });
      appliancePuzzles.stove.setAvailable(true);
      if (character === "mum") appliancePuzzles.stove.revealClue();
    }
    const placedIngredients = recipeState?.placements ?? [];
    ingredients.forEach((ingredient) => {
      if (state.inventories?.dad?.includes(ingredient.id) || placedIngredients.includes(ingredient.id) || recipeSolved) {
        ingredient.object3D.visible = false;
        ingredient.setEnabled(false);
      }
    });
    const placedNapkins = tableState?.placements ?? [];
    napkins.forEach((napkin) => {
      const collected = state.inventories?.dad?.includes(napkin.id) || placedNapkins.includes(napkin.id);
      const rewardHidden = napkin.id === "kitchen-napkin-ochre" && !recipeSolved;
      napkin.object3D.visible = !collected && !rewardHidden;
      napkin.setEnabled(!collected && !rewardHidden);
    });
  };
  return { recipe, table, ingredients, napkins, applyState };
};

export { createKitchenFoodPuzzles };
