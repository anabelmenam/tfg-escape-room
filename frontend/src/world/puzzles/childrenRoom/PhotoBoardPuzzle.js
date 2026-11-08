import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { tInteraction, tItem } from "../../../translations/index.js";
import { ChildrenPuzzle, configureChildrenMeshes, markChildrenControl } from "./ChildrenPuzzleBase.js";

const MEMORIES = [
  { id: "home", name: "CASA", image: "/images/puzzles/children-memories/memory-home.jpg" },
  { id: "school", name: "ESCUELA", image: "/images/puzzles/children-memories/memory-school.jpg" },
  { id: "park", name: "PARQUE", image: "/images/puzzles/children-memories/memory-park.jpg" },
  { id: "station", name: "ESTACIÓN", image: "/images/puzzles/children-memories/memory-station.jpg" },
];
const MEMORY_PHOTO_IDS = MEMORIES.map((memory) => `children-memory-photo-${memory.id}`);
const SLOT_POSITIONS = [
  [-2.45, 1.62],
  [-0.82, 2.55],
  [0.82, 1.82],
  [2.45, 2.68],
];
const SLOT_ROTATIONS = [-0.09, 0.07, -0.05, 0.1];
const MISSING_PIN_SLOT = 2;

const createPhotoShadowMaterial = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 286;
  const context = canvas.getContext("2d");
  context.fillStyle = "#77736d";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#aaa59d";
  context.lineWidth = 10;
  context.setLineDash([18, 14]);
  context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, material: new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }) };
};

class PhotoBoardPuzzle extends ChildrenPuzzle {
  constructor({ character, onFocus, onSolved, onPinInserted, onCollect = null } = {}) {
    super("children-globe", { onFocus });
    this.character = character;
    this.onSolved = onSolved;
    this.onPinInserted = onPinInserted;
    this.onCollect = onCollect;

    if (character === "dad") {
      this.id = "children-photo-order-note";
      this.object3D.name = this.id;
      this.itemName = "photo-order-note";
      this.inventoryInspectionKey = "KeyR";
      this.inspectionTranslationKey = "papers.children-photo-order-note";
    }

    this.pinInserted = false;
    this.placements = new Array(MEMORIES.length).fill(null);
    this.placedItems = new Array(MEMORIES.length).fill(null);
    this.pins = [];
    this.photoDisplays = [];
    this.photoTextures = [];
    this.ownedTextures = [];
    this.hinge = null;
    this.hiddenReward = null;
    this.targetHingeAngle = 0;
    this.createBoardOrDiary();
  }

  createBoardOrDiary() {
    if (this.character === "dad") {
      const imagePath = "/images/puzzles/photo-order-diary.png";
      const diaryTexture = new THREE.TextureLoader().load(imagePath);
      diaryTexture.colorSpace = THREE.SRGBColorSpace;

      const page = new THREE.Mesh(
        new THREE.PlaneGeometry(2.35, 3.5),
        new THREE.MeshStandardMaterial({ map: diaryTexture, roughness: 0.94, side: THREE.DoubleSide }),
      );
      page.rotation.x = -Math.PI / 2;
      page.position.y = 0.02;

      this.object3D.add(page);
      this.ownedTextures.push(diaryTexture);
      this.inventoryIcon = imagePath;
      this.inspectionImage = imagePath;
      this.inspectionTitle = "mi día";
      configureChildrenMeshes(this.object3D);

      return;
    }

    const frame = new THREE.Mesh(
      new RoundedBoxGeometry(7.2, 3.9, 0.28, 4, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x5b3826, roughness: 0.82 }),
    );
    frame.position.y = 1.9;

    const cork = new THREE.Mesh(
      new RoundedBoxGeometry(6.75, 3.45, 0.08, 3, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xb9824d, roughness: 0.96 }),
    );
    cork.position.set(0, 1.9, 0.18);

    this.object3D.add(frame, cork);

    const textureLoader = new THREE.TextureLoader();

    MEMORIES.forEach((memory, index) => {
      const [x, y] = SLOT_POSITIONS[index];
      const shadowData = createPhotoShadowMaterial();
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 1.18), shadowData.material);
      shadow.position.set(x, y, 0.23);
      shadow.rotation.z = SLOT_ROTATIONS[index];
      markChildrenControl(shadow, { kind: "memory-slot", value: index });
      this.ownedTextures.push(shadowData.texture);
      this.object3D.add(shadow);

      const photoTexture = textureLoader.load(memory.image);
      photoTexture.colorSpace = THREE.SRGBColorSpace;

      const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.42, 0.92),
        new THREE.MeshStandardMaterial({ map: photoTexture, roughness: 0.92 }),
      );
      photo.position.set(x, y, 0.245);
      photo.rotation.z = SLOT_ROTATIONS[index];
      photo.visible = false;
      markChildrenControl(photo, { kind: "memory-slot", value: index });
      this.photoTextures.push(photoTexture);
      this.photoDisplays.push(photo);
      this.object3D.add(photo);

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 16, 10),
        new THREE.MeshStandardMaterial({ color: 0xb62f2f, roughness: 0.42 }),
      );
      pin.position.set(x, y + 0.49, 0.32);
      pin.visible = index !== MISSING_PIN_SLOT;
      markChildrenControl(pin, { kind: "memory-slot", value: index });
      this.pins.push(pin);
      this.object3D.add(pin);
    });

    this.emptySocket = new THREE.Mesh(
      new THREE.CircleGeometry(0.065, 18),
      new THREE.MeshStandardMaterial({ color: 0x291b14, roughness: 0.9, side: THREE.DoubleSide }),
    );

    this.emptySocket.position.copy(this.pins[MISSING_PIN_SLOT].position);
    this.emptySocket.position.z = 0.27;
    this.object3D.add(this.emptySocket);
    this.hinge = new THREE.Group();
    this.hinge.position.x = -3.6;
    const boardParts = [...this.object3D.children];

    this.object3D.remove(...boardParts);

    boardParts.forEach((part) => {
      part.position.x += 3.6;
      this.hinge.add(part);
    });

    this.object3D.add(this.hinge);
    configureChildrenMeshes(this.object3D);
    this.pins[MISSING_PIN_SLOT].visible = false;
  }

  setHiddenReward(reward) {
    if (this.character !== "mum" || !this.hinge || !reward?.object3D) return;

    this.hiddenReward = reward;
    reward.object3D.position.set(3.6, 1.76, -0.19);
    reward.object3D.rotation.set(0, 0, -0.18);
    reward.object3D.scale.setScalar(1.8);
    reward.object3D.visible = false;
    reward.setEnabled(false);

    const tape = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.11, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xd9c79a, transparent: true, opacity: 0.68, roughness: 0.95 }),
    );
    tape.position.set(3.6, 1.88, -0.225);
    tape.rotation.z = -0.08;
    this.hinge.add(reward.object3D, tape);
  }

  revealHiddenReward() {
    if (this.hiddenReward) {
      this.hiddenReward.object3D.visible = true;
    }
  }

  setOpen(open = true, { immediate = false } = {}) {
    this.targetHingeAngle = open ? -Math.PI / 2 : 0;
    if (immediate && this.hinge) {
      this.hinge.rotation.y = this.targetHingeAngle;
    }
  }

  interact(player) {
    if (!this.available) return;
    if (this.character === "mum" && this.isSolved) {
      this.setOpen(this.targetHingeAngle >= -0.1);
      return;
    }

    if (this.character === "dad") {
      if (!player?.inventory.add(this)) return;

      this.object3D.visible = false;
      this.setEnabled(false);
      this.onCollect?.();
      return;
    }

    if (this.character === "mum" && !this.pinInserted && player?.inventory.hasSelected("globe-pushpin")) {
      player.inventory.remove("globe-pushpin");
      this.setPinInserted();

      return;
    }

    this.onFocus?.(this);
  }

  setPinInserted({ notify = true } = {}) {
    if (this.pinInserted || this.character !== "mum") return;

    this.pinInserted = true;
    this.pins[MISSING_PIN_SLOT].visible = true;
    this.emptySocket.visible = false;

    if (notify) {
      this.onPinInserted?.();
    }
  }

  handleControl(control, player) {
    if (this.character !== "mum" || !this.available || this.isSolved || control?.kind !== "memory-slot") return;

    const slot = control.value;
    if (slot === MISSING_PIN_SLOT && !this.pinInserted) return;

    const selectedItem = player?.inventory.getSelectedItem();
    const selectedMemory = MEMORY_PHOTO_IDS.indexOf(selectedItem?.id);
    const currentItem = this.placedItems[slot];

    if (selectedMemory === -1) {
      if (currentItem && player?.inventory.add(currentItem)) {
        this.placements[slot] = null;
        this.placedItems[slot] = null;
        this.photoDisplays[slot].visible = false;
        this.updatePinFeedback();
      }
      return;
    }

    const item = player.inventory.remove(selectedItem.id);

    if (!item) return;
    if (currentItem && !player.inventory.add(currentItem)) {
      player.inventory.add(item);
      return;
    }

    this.placements[slot] = selectedMemory;
    this.placedItems[slot] = item;
    this.photoDisplays[slot].material.map = this.photoTextures[selectedMemory];
    this.photoDisplays[slot].material.needsUpdate = true;
    this.photoDisplays[slot].visible = true;
    this.updatePinFeedback();

    if (this.placements.every((memoryIndex, index) => memoryIndex === index)) {
      this.solve();
    }
  }

  updatePinFeedback() {
    const boardIsFull = this.placements.every((placement) => placement !== null);

    this.pins.forEach((pin, index) => {
      const isCorrect = this.placements[index] === index;
      pin.material.color.setHex(!isCorrect && boardIsFull ? 0x8b2424 : 0xb62f2f);
    });
  }

  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.isSolved = true;

    if (this.character === "mum") {
      if (!this.pinInserted) {
        this.setPinInserted({ notify: false });
      }

      this.setOpen(true);
      this.revealHiddenReward();
      this.placements = MEMORIES.map((_, index) => index);

      this.photoDisplays.forEach((photo, index) => {
        photo.material.map = this.photoTextures[index];
        photo.material.needsUpdate = true;
        photo.visible = true;
      });

      this.pins.forEach((pin) => pin.material.color.setHex(0xb62f2f));
    }

    if (notify) {
      this.onSolved?.();
    }
  }

  update(deltaTime) {
    if (!this.hinge) return;
    this.hinge.rotation.y = THREE.MathUtils.damp(this.hinge.rotation.y, this.targetHingeAngle, 2, deltaTime);

    if (!this.hiddenReward || !this.hiddenReward.object3D.visible) return;
    this.hiddenReward.setEnabled(this.hinge.rotation.y < -1.3);
  }

  getInteractionText(player) {
    if (!this.available) {
      return null;
    }

    if (this.character === "mum" && this.isSolved) {
      return this.targetHingeAngle < -0.1
        ? tInteraction("close", tItem("noticeboard"))
        : tInteraction("open", tItem("noticeboard"));
    }

    if (this.character === "dad") {
      return tInteraction("pickUp", tItem(this.itemName));
    }

    if (this.character === "mum" && !this.pinInserted && player?.inventory.hasSelected("globe-pushpin")) {
      return tInteraction("insert", tItem("globe-pushpin"));
    }

    return tInteraction("examine", tItem(this.character === "mum" ? "noticeboard" : "photo-order-note"));
  }

  getFocusPosition() {
    if (this.character !== "dad") {
      return super.getFocusPosition();
    }

    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3(0, 5, 0));
  }

  getLookAtPosition() {
    if (this.character !== "dad") {
      return super.getLookAtPosition();
    }

    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3(0, 0, 0));
  }

  getFocusUp() {
    if (this.character !== "dad") {
      return new THREE.Vector3(0, 1, 0);
    }

    const worldQuaternion = this.object3D.getWorldQuaternion(new THREE.Quaternion());
    return new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuaternion).normalize();
  }

  dispose() {
    this.ownedTextures.forEach((texture) => texture.dispose());
    this.photoTextures.forEach((texture) => texture.dispose());
  }
}

export { PhotoBoardPuzzle, MEMORIES, MEMORY_PHOTO_IDS };
