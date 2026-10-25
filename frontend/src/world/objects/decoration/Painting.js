import * as THREE from "three";
import { Entity } from "../Entity.js";
import { Scissors } from "../../puzzles/Scissors.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const paintingColumns = 3;
const paintingRows = 2;
const paintingPieceCount = paintingColumns * paintingRows;
const missingPieces = [0, 4];
const initialPieces = [1, 2, 3, 5];
const waitingLandscapePieces = [];
const landscapeTexture = new THREE.TextureLoader().load("/images/puzzles/mountain-lake-landscape.png", () => {
  waitingLandscapePieces.splice(0).forEach(({ material, index }) => {
    material.map = createLandscapePieceTexture(index);
    material.needsUpdate = true;
  });
});
landscapeTexture.colorSpace = THREE.SRGBColorSpace;

const createLandscapePieceTexture = (index) => {
  if (!landscapeTexture.image) return null;
  const texture = landscapeTexture.clone();
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  const column = index % paintingColumns;
  const row = Math.floor(index / paintingColumns);
  texture.repeat.set(1 / paintingColumns, 1 / paintingRows);
  texture.offset.set(column / paintingColumns, 1 - (row + 1) / paintingRows);
  texture.needsUpdate = true;
  return texture;
};

const createPainting = ({ complete = false, pieces = [] } = {}) => {
  const group = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x48291b, roughness: 0.72 });
  const canvasMaterial = new THREE.MeshStandardMaterial({ color: 0x26323a, roughness: 0.94 });
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.75), canvasMaterial);
  canvas.position.z = 0.075;
  group.add(canvas);

  [
    [2.95, 0.16, 0, 0.96],
    [2.95, 0.16, 0, -0.96],
    [0.16, 1.9, -1.4, 0],
    [0.16, 1.9, 1.4, 0],
  ].forEach(([width, height, x, y]) => {
    const border = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.16), frameMaterial);
    border.position.set(x, y, 0);
    border.castShadow = true;
    group.add(border);
  });

  const visiblePieces = complete ? Array.from({ length: paintingPieceCount }, (_, index) => index) : pieces;
  visiblePieces.forEach((index) => {
    const texture = createLandscapePieceTexture(index);
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
    if (!texture) waitingLandscapePieces.push({ material, index });
    const piece = new THREE.Mesh(
      new THREE.PlaneGeometry(0.83, 0.78),
      material,
    );
    piece.position.set(-0.85 + (index % paintingColumns) * 0.85, 0.4 - Math.floor(index / paintingColumns) * 0.8, 0.09);
    group.add(piece);
  });
  return group;
};

class PaintingFragment extends Entity {
  constructor({ id, index, position = new THREE.Vector3(), rotation = new THREE.Euler(-Math.PI / 2, 0, 0), onCollect = null } = {}) {
    super(id);
    this.onCollect = onCollect;
    this.index = index;
    this.paintingPieceIndex = index;
    this.inventoryIcon = index === 0
      ? "/images/icons/living-room/painting-fragment-1.png"
      : "/images/icons/living-room/painting-fragment-2.png";
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.copy(rotation);
    const fragment = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.9, 0.04),
      new THREE.MeshStandardMaterial({ map: createLandscapePieceTexture(index), roughness: 0.82 }),
    );
    fragment.castShadow = true;
    this.object3D.add(fragment);
  }

  interact(player) {
    if (!player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem("painting-piece")) : null;
  }
}

class FallenPainting extends Entity {
  constructor({
    id = "living-room-fallen-painting",
    position = new THREE.Vector3(),
    rotationY = 0,
    visible = false,
    onCollect = null,
  } = {}) {
    super(id);
    this.onCollect = onCollect;
    this.inventoryIcon = "/images/icons/living-room/fallen-painting.png";
    this.object3D = createPainting({ pieces: initialPieces });
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.set(Math.PI / 2, rotationY, 0);
    this.object3D.visible = visible;
    this.setEnabled(false);
  }

  reveal() {
    if (this.collected) return;
    this.object3D.visible = true;
    this.setEnabled(true);
  }

  interact(player) {
    if (!player?.inventory.add(this)) return;
    this.collected = true;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem("fallen-painting")) : null;
  }
}

class PaintingSlot extends Entity {
  constructor({
    id = "living-room-painting-slot",
    character,
    position = new THREE.Vector3(),
    rotationY = 0,
    onPlaced = null,
    onPieceInserted = null,
  } = {}) {
    super(id);
    this.character = character;
    this.onPlaced = onPlaced;
    this.onPieceInserted = onPieceInserted;
    this.isPlaced = character === "dad";
    this.restored = false;
    this.restoredPieces = [];
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    // Keep the mounting reference stable when the silhouette becomes a framed painting.
    this.wallMountObject = new THREE.Mesh(new THREE.PlaneGeometry(2.96, 2.08));
    this.wallMountObject.position.z = -0.08;
    this.wallMountObject.visible = false;
    if (character === "dad") {
      this.hiddenScissors = new Scissors();
      this.hiddenScissors.object3D.position.set(1.48, -0.25, -0.1);
    }
    this.render();
  }

  render() {
    this.object3D.clear();
    this.object3D.add(this.wallMountObject);
    if (!this.isPlaced) {
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 2),
        new THREE.MeshStandardMaterial({ color: 0x16181a, transparent: true, opacity: 0.72, roughness: 1, side: THREE.DoubleSide }),
      );
      shadow.position.z = -0.07;
      this.object3D.add(shadow);
      return;
    }
    const painting = createPainting({
      complete: this.character === "dad",
      pieces: [...initialPieces, ...this.restoredPieces],
    });
    this.hinge = new THREE.Group();
    this.hinge.position.x = -1.48;
    painting.position.x = 1.48;
    this.hinge.add(painting);
    if (this.hiddenScissors) {
      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 1.9, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x795d40 }),
      );
      backing.position.set(1.48, 0, -0.04);
      this.hinge.add(backing, this.hiddenScissors.object3D);
      const tape = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.1, 0.008),
        new THREE.MeshStandardMaterial({ color: 0xd9c79a, transparent: true, opacity: 0.65 }),
      );
      tape.position.set(1.48, 0.02, -0.145);
      this.hinge.add(tape);
    }
    this.object3D.add(this.hinge);
  }

  setPlaced(placed) {
    if (this.isPlaced === placed) return;
    this.isPlaced = placed;
    this.render();
  }

  interact(player) {
    if (this.character === "mum" && !this.isPlaced && player?.hasSelected("living-room-fallen-painting")) {
      player.removeItemFromInventory("living-room-fallen-painting");
      this.isPlaced = true;
      this.render();
      this.onPlaced?.();
      return;
    }
    if (this.character !== "mum" || !this.isPlaced) return;
    const selected = player?.inventory.getSelectedItem();
    const index = selected?.paintingPieceIndex;
    if (!missingPieces.includes(index) || this.restoredPieces.includes(index)) return;
    player.removeItemFromInventory(selected.id);
    this.restorePiece(index);
    this.onPieceInserted?.(index);
  }

  restorePiece(index) {
    if (!missingPieces.includes(index) || this.restoredPieces.includes(index)) return;
    this.restoredPieces.push(index);
    if (this.character === "mum") this.render();
    if (missingPieces.every((piece) => this.restoredPieces.includes(piece))) this.setRestored();
  }

  setRestored() {
    this.restored = true;
  }

  update(deltaTime) {
    if (this.character !== "dad" || !this.restored || !this.hinge) return;
    this.hinge.rotation.y = THREE.MathUtils.damp(this.hinge.rotation.y, -2.1, 2, deltaTime);
    if (this.hinge.rotation.y < -1.7 && this.hiddenScissors.object3D.visible) this.hiddenScissors.setEnabled(true);
  }

  getInteractionText(player) {
    if (this.character !== "mum") return null;
    const selected = player?.inventory.getSelectedItem();
    if (!this.isPlaced) {
      if (selected?.id === "living-room-fallen-painting") {
        return tInteraction("insert", tItem("living-room-fallen-painting"));
      }
      return tInteraction("needItem", tItem("living-room-fallen-painting"));
    }

    if (this.restored) return null;
    return missingPieces.includes(selected?.paintingPieceIndex) &&
      !this.restoredPieces.includes(selected.paintingPieceIndex)
      ? tInteraction("insert", tItem("painting-piece"))
      : tInteraction("needItem", tItem("painting-piece"));
  }
}

export { FallenPainting, PaintingFragment, PaintingSlot };
