import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class HallwayMazeMirror extends Entity {
  constructor({ position = new THREE.Vector3(), rotationY = 0, onToggle = null, showScrews = true } = {}) {
    super("hallway-maze-mirror");
    this.onToggle = onToggle;
    this.showScrews = showScrews;
    this.isReleased = false;
    this.isOpen = false;
    this.object3D = new THREE.Group();
    this.object3D.name = this.id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;

    this.hinge = new THREE.Group();
    this.hinge.position.x = -1.82;
    const leaf = new THREE.Group();
    leaf.position.x = 1.82;

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x55402d, roughness: 0.62, metalness: 0.12 });
    const mirrorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbfc8c5,
      metalness: 0.82,
      roughness: 0.1,
      clearcoat: 0.65,
      clearcoatRoughness: 0.08,
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.24, 3.24), mirrorMaterial);
    glass.position.z = 0.115;
    leaf.add(glass);

    [[3.7, 0.18, 0, 1.77], [3.7, 0.18, 0, -1.77], [0.18, 3.7, -1.76, 0], [0.18, 3.7, 1.76, 0]]
      .forEach(([width, height, x, y]) => {
        const border = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.18), frameMaterial);
        border.position.set(x, y, 0);
        border.castShadow = true;
        leaf.add(border);
      });

    const screwMaterial = new THREE.MeshStandardMaterial({ color: 0x858a88, metalness: 0.9, roughness: 0.2 });
    this.screws = [[-1.55, 1.55], [1.55, 1.55], [-1.55, -1.55], [1.55, -1.55]].map(([x, y]) => {
      const screw = new THREE.Group();
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 18), screwMaterial);
      head.rotation.x = Math.PI / 2;
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.095, 0.018, 0.018),
        new THREE.MeshStandardMaterial({ color: 0x303332, metalness: 0.75, roughness: 0.3 }),
      );
      slot.position.z = 0.025;
      screw.position.set(x, y, 0.13);
      screw.add(head, slot);
      leaf.add(screw);
      screw.visible = this.showScrews;
      return screw;
    });

    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 3.5, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x35291f, roughness: 0.88 }),
    );
    backing.position.z = -0.04;
    leaf.add(backing);
    this.hinge.add(leaf);
    this.object3D.add(this.hinge);
  }

  setReleased(released) {
    this.isReleased = Boolean(released);
    this.screws.forEach((screw) => { screw.visible = this.showScrews && !this.isReleased; });
  }

  setOpen(open, { notify = false } = {}) {
    const nextOpen = Boolean(open);
    const changed = nextOpen !== this.isOpen;
    this.isOpen = nextOpen;
    if (changed && notify) this.onToggle?.(this.isOpen);
  }

  toggle({ notify = true } = {}) {
    this.setOpen(!this.isOpen, { notify });
  }

  interact(player) {
    if (!this.isReleased) {
      if (!player?.hasSelected("screwdriver")) return;
      player.removeItemFromInventory("screwdriver");
      this.setReleased(true);
    }
    this.toggle();
  }

  getInteractionText(player) {
    if (!this.isReleased) {
      return player?.hasSelected("screwdriver")
        ? tInteraction("unscrew", tItem("mirror"))
        : tInteraction("needItem", tItem("screwdriver"));
    }
    return this.isOpen ? tInteraction("close", tItem("mirror")) : tInteraction("open", tItem("mirror"));
  }

  update(deltaTime) {
    this.hinge.rotation.y = THREE.MathUtils.damp(this.hinge.rotation.y, this.isOpen ? -Math.PI * 0.82 : 0, 3, deltaTime);
  }
}

export { HallwayMazeMirror };
