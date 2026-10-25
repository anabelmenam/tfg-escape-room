import { Crowbar, FinalKey, WardrobeChains } from "../../objects/index.js";

const createWardrobePuzzle = ({ timeline, wardrobe, onAction }) => {
  const crowbar = timeline === "past"
    ? new Crowbar({ onCollect: () => onAction?.("item.pickup", "crowbar") })
    : null;
  if (crowbar) {
    crowbar.object3D.position.set(-0.2, 2.49, 0.08);
    crowbar.object3D.rotation.order = "ZXY";
    crowbar.object3D.rotation.x = Math.PI / 2;
    crowbar.object3D.rotation.y = 0.16;
    crowbar.object3D.scale.setScalar(0.85);
    crowbar.object3D.visible = false;
    crowbar.setEnabled(false);
    wardrobe.object3D.add(crowbar.object3D);
  }
  const finalKey = timeline === "past"
    ? new FinalKey({
        id: "final-key-children",
        symbol: "star",
        color: 0xc6a044,
        onCollect: () => onAction?.("item.pickup", "final-key-children"),
      })
    : null;
  if (finalKey) {
    finalKey.object3D.position.set(1.15, 4.25, .45);
    finalKey.object3D.rotation.z = -.35;
    finalKey.object3D.visible = false;
    finalKey.setEnabled(false);
    wardrobe.object3D.add(finalKey.object3D);
  }

  const rewardDoors = wardrobe.getInteractables().filter((item) => item.id.includes("-door-"));
  let unlocked = false;
  let rewardRevealed = false;
  const revealReward = () => {
    if (!unlocked || rewardRevealed) return;
    rewardRevealed = true;
    if (crowbar) {
      crowbar.object3D.visible = true;
      crowbar.setEnabled(true);
    }
    finalKey?.reveal();
  };
  const unlock = () => {
    unlocked = true;
    rewardDoors.forEach((door) => { door.enabled = true; });
  };
  rewardDoors.forEach((door) => {
    door.enabled = false;
    const openDoor = door.interact;
    door.interact = (...args) => {
      openDoor(...args);
      revealReward();
    };
  });

  const chains = timeline === "past"
    ? new WardrobeChains({
        onCut: () => {
          unlock();
          onAction?.("puzzle.solved", "children-wardrobe-chains");
        },
      })
    : null;
  if (chains) {
    chains.object3D.position.z = 1.68;
    wardrobe.object3D.add(chains.object3D);
  }

  const applyState = (state) => {
    const chainsCut = Boolean(state.timelines?.past?.puzzles?.["children-wardrobe-chains"]?.solved);
    if (chainsCut) {
      chains?.cut({ immediate: true });
      unlock();
    }
    const kitchenUnlocked = ["past", "present"].some(
      (era) => state.timelines?.[era]?.objects?.["hallway-kitchen-door"]?.locked === false,
    );
    if (crowbar && (state.inventories?.past?.includes("crowbar") || kitchenUnlocked)) {
      crowbar.object3D.visible = false;
      crowbar.setEnabled(false);
    }
    if (finalKey) {
      const unavailable = state.inventories?.past?.includes("final-key-children")
        || ["past", "present"].some((era) => state.timelines?.[era]?.objects?.["final-bolt-children"]?.unlocked);
      if (unavailable) {
        finalKey.object3D.visible = false;
        finalKey.setEnabled(false);
      }
    }
  };
  return { chains, crowbar, finalKey, unlock, revealReward, applyState };
};

export { createWardrobePuzzle };
