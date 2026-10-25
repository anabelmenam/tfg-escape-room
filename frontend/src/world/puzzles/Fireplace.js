import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

class Fireplace extends Entity {
  constructor({ id = "living-room-fireplace", position, onSolved = null } = {}) {
    super(id);
    this.onSolved = onSolved;
    this.solved = false;
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.structure = new THREE.Group();
    this.structure.name = `${id}-structure`;
    const brickMaterial = new THREE.MeshStandardMaterial({ color: 0x623d2c, roughness: 0.9 });
    const cavityDepth = 1.15;
    const back = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.12), brickMaterial);
    back.position.z = -cavityDepth / 2;
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.2, cavityDepth), brickMaterial);
    side.position.x = -1.675;
    const rightSide = side.clone();
    rightSide.position.x = 1.675;
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.75, cavityDepth), brickMaterial);
    top.position.y = 1.225;
    const hearth = top.clone();
    hearth.position.y = -1.225;
    const opening = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.7), new THREE.MeshStandardMaterial({ color: 0x171312, roughness: 1 }));
    opening.position.set(0, -0.15, -cavityDepth / 2 + 0.07);
    const logMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2518, roughness: 0.95 });
    for (const rotation of [-0.35, 0.35]) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), logMaterial);
      log.rotation.z = Math.PI / 2 + rotation;
      log.position.set(0, -0.55, 0.2);
      this.object3D.add(log);
    }
    this.flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.92, 12),
      new THREE.MeshStandardMaterial({ color: 0xff7b28, emissive: 0xff4210, emissiveIntensity: 2.2 }),
    );
    this.flame.position.set(0, -0.25, 0.25);
    this.flame.visible = false;
    this.structure.add(back, side, rightSide, top, hearth, opening);
    this.object3D.add(this.structure, this.flame);
  }

  interact(player) {
    if (this.solved || !player?.hasSelected("living-room-match")) return;
    player.removeItemFromInventory("living-room-match");
    this.solved = true;
    this.flame.visible = true;
    this.onSolved?.();
  }

  getInteractionText(player) {
    if (this.solved) return null;
    return player?.hasSelected("living-room-match") ? tInteraction("light", tItem("fireplace")) : tInteraction("examine", tItem("fireplace"));
  }

  getCollider() {
    this.object3D.updateWorldMatrix(true, false);
    return new THREE.Box3().setFromObject(this.structure);
  }
}

export { Fireplace };
