import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { tInteraction } from "../../translations/index.js";
import { CASTLE_PIECES, ChildrenPuzzle, configureChildrenMeshes, markChildrenControl } from "./ChildrenPuzzleBase.js";

class BlockConstructionPuzzle extends ChildrenPuzzle {
  constructor({ timeline, onFocus, onSolved, onMatLifted } = {}) {
    super("children-blocks", { onFocus });
    this.timeline = timeline;
    this.onSolved = onSolved;
    this.onMatLifted = onMatLifted;
    this.matLifted = false;
    this.matMoveActive = false;
    this.matMoveProgress = 0;
    this.matMoveStartX = 0;
    this.matMoveTargetX = 0;
    this.matMoveStartY = 0;
    this.matMoveTargetY = 0;
    this.matMoveNotify = false;
    this.placed = [];
    this.blocks = [];
    this.startPositions = [];
    this.selectedBlock = null;
    this.selectedBlockY = null;
    this.available = true;
    this.surfaceTop = 1.59;
    this.towerSlots = [-.9, .9];
    this.towerZ = 0.35;
    this.blocksPerTower = 4;
    this.createStation();
  }

  createStation() {
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x718777,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const surface = new THREE.Mesh(new RoundedBoxGeometry(5.9, .3, 3.1, 4, .055), surfaceMaterial);
    surface.position.set(0, this.surfaceTop - .15, 0.35);
    surface.renderOrder = 2;
    markChildrenControl(surface, { kind: "block-surface" });
    this.object3D.add(surface);
    this.surface = surface;

    const borderPoints = [
      new THREE.Vector3(-2.95, this.surfaceTop + 0.009, -1.2),
      new THREE.Vector3(2.95, this.surfaceTop + 0.009, -1.2),
      new THREE.Vector3(2.95, this.surfaceTop + 0.009, 1.9),
      new THREE.Vector3(-2.95, this.surfaceTop + 0.009, 1.9),
    ];
    const border = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(borderPoints),
      new THREE.LineBasicMaterial({ color: 0x3f5548 }),
    );
    border.renderOrder = 3;
    this.object3D.add(border);
    this.border = border;

    this.towerSlots.forEach((x) => {
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.04, 1.04),
        new THREE.MeshStandardMaterial({ color: 0x203229, transparent: true, opacity: .42, roughness: 1, side: THREE.DoubleSide }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, this.surfaceTop + .014, this.towerZ);
      shadow.renderOrder = 4;
      this.object3D.add(shadow);

      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-.56, 0, -.56),
          new THREE.Vector3(.56, 0, -.56),
          new THREE.Vector3(.56, 0, .56),
          new THREE.Vector3(-.56, 0, .56),
        ]),
        new THREE.LineBasicMaterial({ color: 0xaec5b3, transparent: true, opacity: .72 }),
      );
      outline.position.set(x, this.surfaceTop + .018, this.towerZ);
      outline.renderOrder = 5;
      this.object3D.add(outline);
    });

    [-3.7, 3.7].forEach((x, side) => {
      const returnZone = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 3.1),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      );
      returnZone.rotation.x = -Math.PI / 2;
      returnZone.position.set(x, this.surfaceTop + .01, .35);
      markChildrenControl(returnZone, { kind: "block-return", side });
      this.object3D.add(returnZone);
    });

    CASTLE_PIECES.forEach((piece, index) => {
      const block = new THREE.Group(); const material = new THREE.MeshStandardMaterial({ color: piece.color, roughness: .68 });
      let geometry; if (piece.kind === "roof") geometry = new THREE.CylinderGeometry(0, .62, .64, 4); else if (piece.kind === "bridge") geometry = new RoundedBoxGeometry(3.45, .2, .68, 4, .05); else geometry = new RoundedBoxGeometry(.72, .72, .72, 4, .06);
      const shape = new THREE.Mesh(geometry, material); if (piece.kind === "roof") shape.rotation.y = Math.PI / 4; block.add(shape); block.position.set(...(this.timeline === "present" ? piece.target : piece.start)); markChildrenControl(block, { kind: "block", value: index }); this.blocks[index] = block; this.startPositions[index] = new THREE.Vector3(...piece.start); this.object3D.add(block);
    });
    configureChildrenMeshes(this.object3D);
  }

  interact() {
    if (this.timeline === "past" && this.isSolved && !this.matLifted) {
      this.liftMat();
      return;
    }
    if (!this.isSolved) this.onFocus?.(this);
  }

  liftMat({ notify = true } = {}) {
    if (this.matLifted) return;
    this.matLifted = true;
    this.matMoveActive = true;
    this.matMoveProgress = 0;
    this.matMoveStartX = this.object3D.position.x;
    this.matMoveTargetX = this.matMoveStartX - 1.65;
    this.matMoveStartY = this.object3D.position.y;
    this.matMoveTargetY = this.matMoveStartY + .14;
    this.matMoveNotify = notify;
  }

  update(delta) {
    if (!this.matMoveActive) return;
    this.matMoveProgress = Math.min(1, this.matMoveProgress + delta / 1.15);
    const eased = this.matMoveProgress * this.matMoveProgress * (3 - 2 * this.matMoveProgress);
    this.object3D.position.x = THREE.MathUtils.lerp(this.matMoveStartX, this.matMoveTargetX, eased);
    this.object3D.position.y = THREE.MathUtils.lerp(this.matMoveStartY, this.matMoveTargetY, eased);
    if (this.matMoveProgress < 1) return;
    this.matMoveActive = false;
    this.onMatLifted?.({ notify: this.matMoveNotify });
  }

  resolveFocusedIntersection(intersections) {
    const getControl = (object) => {
      let current = object;
      while (current && current !== this.object3D) {
        if (current.userData?.childrenPuzzleControl) return current.userData.childrenPuzzleControl;
        current = current.parent;
      }
      return null;
    };
    return intersections.find(({ object }) => {
      const control = getControl(object);
      return control?.kind === "block" && control.value !== this.selectedBlock;
    })
      ?? intersections.find(({ object }) => getControl(object)?.kind === "block-surface")
      ?? intersections.find(({ object }) => getControl(object));
  }

  handleControl(control, _player, intersection) {
    if (this.timeline !== "past" || !this.available || this.isSolved) return;
    if (control?.kind === "block") {
      if (this.selectedBlock !== null && control.value !== this.selectedBlock) {
        this.placeSelectedBlock(null, this.getStackPosition(control.value));
        return;
      }
      this.selectBlock(control.value);
      return;
    }
    if (control?.kind === "block-surface" && this.selectedBlock !== null && intersection?.point) {
      this.placeSelectedBlock(intersection.point);
      return;
    }
    if (control?.kind === "block-return" && this.selectedBlock !== null) {
      this.returnSelectedBlock();
    }
  }

  returnSelectedBlock() {
    const index = this.selectedBlock;
    if (index === null) return;
    this.blocks[index].position.copy(this.startPositions[index]);
    this.placed = this.placed.filter((placedIndex) => placedIndex !== index);
    this.selectedBlock = null;
    this.selectedBlockY = null;
  }

  selectBlock(index) {
    if (!this.blocks[index]) return;
    if (this.selectedBlock === null && this.hasBlockAbove(index)) return;
    if (this.selectedBlock !== null) {
      this.blocks[this.selectedBlock].position.y = this.selectedBlockY;
    }
    this.selectedBlock = this.selectedBlock === index ? null : index;
    this.selectedBlockY = this.selectedBlock === null ? null : this.blocks[this.selectedBlock].position.y;
    if (this.selectedBlock !== null) {
      this.blocks[this.selectedBlock].position.y += 0.3;
    }
  }

  getPieceSize(index) {
    const kind = CASTLE_PIECES[index]?.kind;
    if (kind === "bridge") return { width: 3.45, height: 0.2, depth: 0.68 };
    if (kind === "roof") return { width: 0.88, height: 0.64, depth: 0.88 };
    return { width: 0.72, height: 0.72, depth: 0.72 };
  }

  hasBlockAbove(index) {
    if (!this.placed.includes(index)) return false;
    const block = this.blocks[index];
    const size = this.getPieceSize(index);
    const top = block.position.y + size.height / 2;
    return this.placed.some((otherIndex) => {
      if (otherIndex === index) return false;
      const other = this.blocks[otherIndex];
      const otherSize = this.getPieceSize(otherIndex);
      const overlapsX = Math.abs(other.position.x - block.position.x) < (otherSize.width + size.width) / 2 - 0.04;
      const overlapsZ = Math.abs(other.position.z - block.position.z) < (otherSize.depth + size.depth) / 2 - 0.04;
      return overlapsX && overlapsZ && other.position.y - otherSize.height / 2 >= top - 0.05;
    });
  }

  getStackPosition(supportIndex) {
    const selectedKind = CASTLE_PIECES[this.selectedBlock]?.kind;
    const support = this.blocks[supportIndex];
    if (selectedKind === "roof" && CASTLE_PIECES[supportIndex]?.kind === "bridge") {
      return { x: CASTLE_PIECES[this.selectedBlock].target[0], z: support.position.z };
    }
    if (selectedKind !== "bridge") return { x: support.position.x, z: support.position.z };

    const supportSize = this.getPieceSize(supportIndex);
    const supportTop = support.position.y + supportSize.height / 2;
    const partnerIndex = this.placed.find((otherIndex) => {
      if (otherIndex === supportIndex || otherIndex === this.selectedBlock) return false;
      const other = this.blocks[otherIndex];
      const otherSize = this.getPieceSize(otherIndex);
      const otherTop = other.position.y + otherSize.height / 2;
      return Math.abs(otherTop - supportTop) < 0.08
        && Math.abs(other.position.z - support.position.z) < 0.45
        && Math.abs(other.position.x - support.position.x) > 0.8;
    });
    if (partnerIndex === undefined) return { x: support.position.x, z: support.position.z };
    const partner = this.blocks[partnerIndex];
    return {
      x: (support.position.x + partner.position.x) / 2,
      z: (support.position.z + partner.position.z) / 2,
    };
  }

  placeSelectedBlock(worldPoint, fixedPosition = null) {
    const index = this.selectedBlock;
    const piece = this.blocks[index];
    const size = this.getPieceSize(index);
    piece.position.y = this.selectedBlockY;
    const localPoint = fixedPosition ?? this.object3D.worldToLocal(worldPoint.clone());
    const x = this.towerSlots.reduce((closest, slot) => (
      Math.abs(slot - localPoint.x) < Math.abs(closest - localPoint.x) ? slot : closest
    ));
    const z = this.towerZ;
    const blocksInTower = this.placed.filter((placedIndex) => {
      if (placedIndex === index) return false;
      const position = this.blocks[placedIndex].position;
      return Math.abs(position.x - x) < .08 && Math.abs(position.z - z) < .08;
    }).length;
    if (blocksInTower >= this.blocksPerTower) {
      piece.position.y = this.selectedBlockY + .3;
      return;
    }

    let supportTop = this.surfaceTop;
    this.placed.forEach((placedIndex) => {
      if (placedIndex === index) return;
      const placedBlock = this.blocks[placedIndex];
      const placedSize = this.getPieceSize(placedIndex);
      const overlapsX = Math.abs(placedBlock.position.x - x) < (placedSize.width + size.width) / 2 - 0.04;
      const overlapsZ = Math.abs(placedBlock.position.z - z) < (placedSize.depth + size.depth) / 2 - 0.04;
      if (overlapsX && overlapsZ) supportTop = Math.max(supportTop, placedBlock.position.y + placedSize.height / 2);
    });

    piece.position.set(x, supportTop + size.height / 2, z);
    if (!this.placed.includes(index)) this.placed.push(index);
    this.selectedBlock = null;
    this.selectedBlockY = null;
    this.checkSolution();
  }

  checkSolution() {
    if (this.placed.length !== CASTLE_PIECES.length) return false;
    const solved = this.towerSlots.every((slot) => this.blocks.filter(({ position }) => (
      Math.abs(position.x - slot) < .08 && Math.abs(position.z - this.towerZ) < .08
    )).length === this.blocksPerTower);
    if (solved) this.solve();
    return solved;
  }

  resetBlocks() {
    this.selectedBlock = null;
    this.selectedBlockY = null;
    this.placed = [];
    this.blocks.forEach((block, index) => block.position.copy(this.startPositions[index]));
  }
  solve({ notify = true } = {}) { if (this.isSolved) return; this.selectedBlock = null; this.selectedBlockY = null; this.isSolved = true; this.placed = CASTLE_PIECES.map((_, index) => index); CASTLE_PIECES.forEach((piece, index) => this.blocks[index].position.set(...piece.target)); if (notify) this.onSolved?.(); this.liftMat({ notify }); }
  getInteractionText() { if (this.timeline === "past" && this.isSolved) return this.matLifted ? null : tInteraction("move", "la construcción"); return tInteraction("examine", "los bloques"); }
  getFocusPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 5.2, 9)); }
  getLookAtPosition() { this.object3D.updateWorldMatrix(true, false); return this.object3D.localToWorld(new THREE.Vector3(0, 2.6, 0)); }
}

export { BlockConstructionPuzzle };
