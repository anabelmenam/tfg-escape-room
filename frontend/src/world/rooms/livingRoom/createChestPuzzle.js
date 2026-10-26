import * as THREE from "three";
import { Chest, FinalKey, Key, Lock } from "../../objects/index.js";

const addCombinationLockHasp = (chest) => {
  const metal = new THREE.MeshStandardMaterial({ color: 0x655744, roughness: .48, metalness: .72 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x292622, roughness: .56, metalness: .68 });
  const frontZ = chest.depth / 2 + .035;
  chest.bodyGroup.getObjectByName(`${chest.id}-lock`)?.removeFromParent();
  chest.bodyGroup.getObjectByName(`${chest.id}-keyhole`)?.removeFromParent();

  const lowerPlate = new THREE.Mesh(new THREE.BoxGeometry(.31, .17, .045), metal);
  lowerPlate.position.set(0, chest.bodyHeight - .12, frontZ);
  chest.bodyGroup.add(lowerPlate);
  const upperPlate = new THREE.Mesh(new THREE.BoxGeometry(.31, .16, .045), metal);
  upperPlate.position.set(0, .105, .03);
  chest.lidGroup.add(upperPlate);

  const tongueShape = new THREE.Shape();
  tongueShape.moveTo(-.075, .14);
  tongueShape.lineTo(.075, .14);
  tongueShape.lineTo(.075, -.16);
  tongueShape.lineTo(-.075, -.16);
  tongueShape.closePath();
  const shackleOpening = new THREE.Path();
  shackleOpening.absellipse(0, -.09, .043, .052, 0, Math.PI * 2, false);
  tongueShape.holes.push(shackleOpening);
  const tongue = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tongueShape, { depth: .035, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 2 }),
    metal,
  );
  tongue.position.set(0, -.02, .05);
  chest.lidGroup.add(tongue);

  const rivetGeometry = new THREE.CylinderGeometry(.025, .025, .018, 14);
  [-.12, .12].forEach((x) => {
    const lowerRivet = new THREE.Mesh(rivetGeometry, darkMetal);
    lowerRivet.rotation.x = Math.PI / 2;
    lowerRivet.position.set(x, chest.bodyHeight - .12, frontZ + .037);
    chest.bodyGroup.add(lowerRivet);
    const upperRivet = lowerRivet.clone();
    upperRivet.position.set(x, .105, .063);
    chest.lidGroup.add(upperRivet);
  });
  [lowerPlate, upperPlate, tongue].forEach((part) => {
    part.castShadow = true;
    part.receiveShadow = true;
  });
};

const createChestPuzzle = ({ character, testMode, shelf, woodStyle, hasLetter, onAction, onFocus }) => {
  const chest = character === "dad" ? new Chest({
    id: "living-room-chest",
    position: new THREE.Vector3(17, 2, 12),
    scale: 1,
    width: 1.5,
    height: 1,
    depth: 1,
    locked: true,
    ...woodStyle,
  }) : null;
  if (chest) addCombinationLockHasp(chest);

  const studyKey = character === "dad" ? new Key({ id: "study-key", color: 0xb07c32, scalar: 1.45 }) : null;
  const finalKey = character === "dad"
    ? new FinalKey({
        id: "final-key-living-room",
        symbol: "flame",
        color: 0xb56b38,
        onCollect: () => onAction?.("item.pickup", "final-key-living-room"),
      })
    : null;
  let finalKeyEarned = false;
  let finalKeyUnavailable = false;
  let studyKeyUnavailable = false;

  if (finalKey) {
    finalKey.object3D.visible = false;
    finalKey.setEnabled(false);
    chest.addItem(finalKey, { position: new THREE.Vector3(-.34, .22, 0), scale: .38, visible: false });
  }
  if (studyKey) {
    studyKey.setEnabled(false);
    studyKey.object3D.visible = false;
    studyKey.interact = (player) => {
      if (!player.inventory.add(studyKey)) return;
      studyKeyUnavailable = true;
      studyKey.object3D.visible = false;
      studyKey.setEnabled(false);
      onAction?.("item.pickup", "study-key");
    };
    chest.addItem(studyKey, { position: new THREE.Vector3(.02, .22, 0), scale: 1.2, visible: false });
  }

  const lock = character === "dad"
    ? new Lock({
        id: "living-room-chest-lock",
        position: new THREE.Vector3(0, .405, .61),
        scale: .12,
        password: "3816",
        onFocus,
        canUnlock: () => testMode || hasLetter(),
        onUnlock: () => {
          chest.unlock();
          onAction?.("object.interact", "living-room-chest");
        },
      })
    : null;
  if (lock) chest.object3D.add(lock.object3D);

  if (chest) chest.onOpenChange = ({ isOpen }) => {
    if (!isOpen) return;
    if (studyKey && !studyKeyUnavailable && !studyKey.object3D.visible) {
      studyKey.object3D.visible = true;
      studyKey.setEnabled(true);
    }
    if (finalKey && finalKeyEarned && !finalKeyUnavailable && !finalKey.object3D.visible) finalKey.reveal();
  };
  if (chest) shelf.addToShelf(chest.object3D, { shelf: 1, x: 0, z: 2, placeOnSurface: false });

  const applyState = (state) => {
    const chestState = state.characters?.dad?.objects?.["living-room-chest"];
    if (chest && chestState?.locked === false) {
      finalKeyEarned = true;
      chest.unlock();
      lock?.setUnlocked();
    }
    if (finalKey) {
      finalKeyUnavailable = state.inventories?.dad?.includes("final-key-living-room")
        || ["mum", "dad"].some((era) => state.characters?.[era]?.objects?.["final-bolt-living-room"]?.unlocked);
      if (finalKeyUnavailable) {
        finalKey.object3D.visible = false;
        finalKey.setEnabled(false);
      }
    }
    const childrenRoomDoorUnlocked = state.characters?.dad?.objects?.["hallway-children-room-door"]?.locked === false;
    if (studyKey && (state.inventories?.[character]?.includes("study-key") || childrenRoomDoorUnlocked)) {
      studyKeyUnavailable = true;
      studyKey.object3D.visible = false;
      studyKey.setEnabled(false);
    }
  };

  return { chest, lock, studyKey, finalKey, applyState };
};

export { createChestPuzzle };
