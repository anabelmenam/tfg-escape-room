import * as THREE from "three";
import { Entity } from "../../objects/index.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class DisplayCase extends Entity {
  constructor({
    id = "living-room-display-case",
    position = new THREE.Vector3(),
    keepsakeIds = [],
    onInsert = null,
    onOpen = null,
  } = {}) {
    super(id);
    this.onOpen = onOpen;
    this.onInsert = onInsert;
    this.keepsakeIds = keepsakeIds;
    this.insertedKeepsakes = new Set();
    this.keepsakesAvailable = false;
    this.unlocked = false;
    this.opened = false;
    this.contentsRevealed = false;
    this.lidAngle = 0;
    this.targetLidAngle = 0;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);

    const width = 3.15;
    const height = 1.16;
    const depth = 1.12;

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbfe8ee,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.35,
      side: THREE.DoubleSide,
    });
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2419, roughness: 0.7 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xa67a3b, metalness: 0.45, roughness: 0.35 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.22, 0.16, depth + 0.22), woodMaterial);
    base.position.y = 0.08;
    const back = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.035), glassMaterial);
    back.position.set(0, 0.16 + height / 2, -depth / 2);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.035, height, depth), glassMaterial);
    left.position.set(-width / 2, 0.16 + height / 2, 0);
    const right = left.clone();
    right.position.x = width / 2;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), glassMaterial);
    roof.position.set(0, 0.16 + height, 0);

    this.frontLid = new THREE.Group();
    this.frontLid.name = `${id}-front-lid`;
    this.frontLid.position.set(0, 0.16 + height, depth / 2);

    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.035), glassMaterial);
    frontGlass.position.y = -height / 2;
    const lidRails = [
      [width + 0.06, 0.045, 0, -0.02],
      [width + 0.06, 0.045, 0, -height + 0.02],
      [0.045, height, -width / 2, -height / 2],
      [0.045, height, width / 2, -height / 2],
    ];
    this.frontLid.add(frontGlass);

    lidRails.forEach(([railWidth, railHeight, x, y]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(railWidth, railHeight, 0.06), trimMaterial);
      rail.position.set(x, y, 0.02);
      this.frontLid.add(rail);
    });

    this.keepsakeSlots = keepsakeIds.map((_, index) => {
      const slot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.035, 20),
        new THREE.MeshStandardMaterial({ color: 0x2e2119, metalness: 0.35, roughness: 0.55 }),
      );

      slot.rotation.x = -Math.PI / 2;
      slot.position.set((index - (keepsakeIds.length - 1) / 2) * 0.68, 0.19, 0.38);
      return slot;
    });

    this.object3D.add(base, back, left, right, roof, this.frontLid, ...this.keepsakeSlots);
  }

  unlock() {
    this.unlocked = true;
    this.revealContents();
  }

  activateKeepsakes() {
    this.keepsakesAvailable = true;
  }

  setKeepsakeInserted(keepsakeId) {
    const index = this.keepsakeIds.indexOf(keepsakeId);
    if (index === -1 || this.insertedKeepsakes.has(keepsakeId)) {
      return false;
    }

    this.insertedKeepsakes.add(keepsakeId);
    const material = this.keepsakeSlots[index]?.material;
    if (material) {
      material.color.setHex(0xb68a43);
    }

    if (this.insertedKeepsakes.size === this.keepsakeIds.length) {
      this.unlock();
    }

    return true;
  }

  interact(player) {
    if (!this.unlocked) {
      const selected = player?.inventory.getSelectedItem();
      if (!selected || !this.keepsakeIds.includes(selected.id)) return;
      if (!player.removeItemFromInventory(selected.id)) return;
      this.setKeepsakeInserted(selected.id);
      this.onInsert?.(selected.id);
      return;
    }

    this.opened = !this.opened;
    this.targetLidAngle = this.opened ? -Math.PI / 2 : 0;
    this.revealContents();
  }

  setOpened() {
    if (this.contentsRevealed) return;

    this.opened = true;
    this.targetLidAngle = -Math.PI / 2;
    this.lidAngle = this.targetLidAngle;
    this.frontLid.rotation.x = this.lidAngle;
    this.revealContents();
  }

  revealContents() {
    if (!this.opened || !this.unlocked || this.contentsRevealed) return;

    this.contentsRevealed = true;
    this.onOpen?.();
  }

  update(deltaTime) {
    if (this.lidAngle === this.targetLidAngle) return;
    this.lidAngle = THREE.MathUtils.damp(this.lidAngle, this.targetLidAngle, 8, deltaTime);

    if (Math.abs(this.lidAngle - this.targetLidAngle) < 0.001) {
      this.lidAngle = this.targetLidAngle;
    }

    this.frontLid.rotation.x = this.lidAngle;
  }

  getInteractionText(player) {
    if (!this.keepsakesAvailable && this.keepsakeIds.length) {
      return null;
    }

    if (!this.unlocked && this.keepsakeIds.length === 0) {
      return null;
    }

    if (!this.unlocked) {
      const selected = player?.inventory.getSelectedItem();
      return this.keepsakeIds.includes(selected?.id)
        ? tInteraction("insert", tItem(selected.id))
        : tInteraction("needKeepsakes");
    }

    return tInteraction(this.opened ? "close" : "open", tItem("display-case"));
  }
}

export { DisplayCase };
