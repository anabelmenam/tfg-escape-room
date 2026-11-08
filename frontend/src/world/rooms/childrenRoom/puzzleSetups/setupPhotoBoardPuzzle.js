import * as THREE from "three";
import { Key, Paper } from "../../../objects/index.js";
import { MEMORIES, MEMORY_PHOTO_IDS, PhotoBoardPuzzle } from "../../../puzzles/index.js";

const setupPhotoBoardPuzzle = ({ character, furniture, onFocus, onAction, onSolved }) => {
  const { dresser, wardrobes, desks } = furniture;
  const musicBoxKey =
    character === "mum"
      ? new Key({
          id: "music-box-key",
          color: 0xd6a43b,
          scalar: 1.1,
          onCollect: () => onAction?.("item.pickup", "music-box-key"),
        })
      : null;
  if (musicBoxKey) {
    musicBoxKey.object3D.visible = false;
    musicBoxKey.setEnabled(false);
  }

  const puzzle = new PhotoBoardPuzzle({
    character,
    onFocus,
    onSolved: () => {
      puzzle.revealHiddenReward();
      onSolved?.();
      onAction?.("puzzle.solved", "children-globe");
    },
    onPinInserted: () => onAction?.("puzzle.solved", "children-globe-pin"),
    onCollect: () => onAction?.("item.pickup", "children-photo-order-note"),
  });
  puzzle.setAvailable(true);

  if (character === "mum") {
    puzzle.object3D.position.set(-7.1, 5.4, -9.72);
    puzzle.object3D.scale.setScalar(0.7);
  } else {
    puzzle.object3D.scale.setScalar(0.5);
    puzzle.object3D.rotation.z = -0.08;
    desks[0].addObjectToDrawer(0, puzzle.object3D, new THREE.Vector3(0, -0.28, -1.05));
  }
  if (musicBoxKey) puzzle.setHiddenReward(musicBoxKey);

  const photos =
    character === "mum"
      ? MEMORIES.map(
          (memory, index) =>
            new Paper({
              id: MEMORY_PHOTO_IDS[index],
              width: 1.42,
              height: 0.92,
              rotation: new THREE.Euler(-Math.PI / 2, 0, index % 2 === 0 ? -0.08 : 0.1),
              imagePath: memory.image,
              imageFit: "cover",
              imagePadding: 0,
              collectible: true,
              itemName: `memory-photo-${memory.id}`,
              inspectionTitle: `foto de ${memory.name.toLocaleLowerCase("es")}`,
              onCollect: () => onAction?.("item.pickup", MEMORY_PHOTO_IDS[index]),
            }),
        )
      : [];

  if (photos.length) {
    dresser.addObjectToDrawer(5, photos[0].object3D, new THREE.Vector3(0, -0.16, -0.72));
    wardrobes[1].addObjectToDrawer(0, photos[1].object3D, new THREE.Vector3(0, -0.405, -1.1));
    desks[1].addObjectToDrawer(0, photos[2].object3D, new THREE.Vector3(0, -0.22, -0.9));
    dresser.addObjectToDrawer(4, photos[3].object3D, new THREE.Vector3(0, -0.16, -0.72));
  }

  const applyState = (state) => {
    const inserted = Boolean(state.characters?.mum?.puzzles?.["children-globe-pin"]?.solved);
    if (inserted) puzzle.setPinInserted({ notify: false });
    const solved = Boolean(state.characters?.mum?.puzzles?.["children-globe"]?.solved);
    if (character === "dad" && (state.inventories?.dad?.includes("children-photo-order-note") || solved)) {
      puzzle.object3D.visible = false;
      puzzle.setEnabled(false);
    }
    photos.forEach((photo) => {
      if (state.inventories?.mum?.includes(photo.id) || solved) {
        photo.object3D.visible = false;
        photo.setEnabled(false);
      }
    });
    const keyCollected = Boolean(state.inventories?.mum?.includes("music-box-key"));
    const keyInserted = Boolean(state.characters?.mum?.puzzles?.["children-music-key"]?.solved);

    if (musicBoxKey && (keyCollected || keyInserted)) {
      musicBoxKey.object3D.visible = false;
      musicBoxKey.setEnabled(false);
    }
    if (solved) {
      if (character === "mum") {
        puzzle.solve({ notify: false });
      }
      onSolved?.();
      if (!keyCollected && !keyInserted) {
        puzzle.revealHiddenReward();
      }
    }
  };
  return { puzzle, musicBoxKey, photos, applyState };
};

export { setupPhotoBoardPuzzle };
