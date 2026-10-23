import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class Match extends Entity {
  constructor({ id = "living-room-match", onCollect = null } = {}) {
    super(id);
    this.inventoryIcon = "/images/icons/living-room/match.png";
    this.onCollect = onCollect;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    const wood = new THREE.MeshStandardMaterial({ color: 0xc89055, roughness: 0.75 });
    const head = new THREE.MeshStandardMaterial({ color: 0xa83b26, roughness: 0.8 });
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.035), wood);
    stick.position.y = 0.26;
    const matchHead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), head);
    matchHead.position.y = 0.54;
    this.object3D.add(stick, matchHead);
    this.setEnabled(false);
  }

  interact(player) {
    if (!player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem("match")) : null;
  }
}

class Cushion extends Entity {
  constructor({
    id = "living-room-cushion",
    parent = null,
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    color = 0x6b8d91,
    accentColor = 0xe3c89b,
    sewn = false,
    onCut = null,
    onSearch = null,
  } = {}) {
    super(id);
    this.onCut = onCut;
    this.onSearch = onSearch;
    this.sewn = sewn;
    this.cut = false;
    this.searched = false;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.copy(rotation);

    const fabric = new THREE.MeshStandardMaterial({ color, roughness: 0.96, metalness: 0 });
    const tearMaterial = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.8 });
    const cushionGeometry = new RoundedBoxGeometry(0.92, 0.82, 0.22, 5, 0.12);
    this.cushion = new THREE.Mesh(cushionGeometry, fabric);
    this.cushion.castShadow = true;
    this.cushion.receiveShadow = true;

    this.seam = new THREE.Group();
    this.seam.name = `${id}-stitched-tear`;
    const tear = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.4, 0.025), tearMaterial);
    tear.position.z = 0.15;
    this.seam.add(tear);
    for (let index = -3; index <= 3; index++) {
      const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.018), tearMaterial);
      stitch.position.set(0, index * 0.055, 0.16);
      stitch.rotation.z = index % 2 === 0 ? 0.42 : -0.42;
      this.seam.add(stitch);
    }
    this.seam.visible = sewn;
    this.cutSeam = new THREE.Group();
    this.cutSeam.name = `${id}-cut-tear`;
    const cutThread = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.8 });
    for (const y of [-0.17, -0.115, -0.06, 0.06, 0.115, 0.17]) {
      const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.018), cutThread);
      stitch.position.set(0, y, 0.16);
      stitch.rotation.z = y < 0 ? -0.42 : 0.42;
      this.cutSeam.add(stitch);
    }
    this.cutSeam.visible = false;
    this.object3D.add(this.cushion, this.seam, this.cutSeam);
    parent?.add(this.object3D);
  }

  interact(player) {
    if (!this.sewn || this.searched) return;
    if (!this.cut) {
      if (!player?.hasSelected("living-room-scissors")) return;
      player.removeItemFromInventory("living-room-scissors");
      this.setCut();
      this.onCut?.();
      return;
    }
    this.searched = true;
    this.onSearch?.(player);
  }

  setCut() {
    this.cut = true;
    this.seam.visible = false;
    this.cutSeam.visible = true;
  }

  getInteractionText(player) {
    if (this.searched) return null;
    if (this.cut) return tInteraction("search", tItem("cushion"));
    if (!this.sewn) return null;
    return player?.hasSelected("living-room-scissors") ? tInteraction("cut", tItem("stitched-cushion")) : tInteraction("examine", tItem("stitched-cushion"));
  }
}

export { Cushion, Match };
