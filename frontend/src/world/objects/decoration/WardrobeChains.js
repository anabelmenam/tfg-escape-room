import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";
import { createBoltCuttersModel } from "./items/BoltCutters.js";

class WardrobeChains extends Entity {
  constructor({ onCut = null } = {}) {
    super("children-wardrobe-chains");
    this.onCut = onCut;
    this.isCut = false;
    this.isCutting = false;
    this.cutProgress = 0;
    this.cutDuration = 1.65;
    this.object3D = new THREE.Group();
    this.object3D.name = this.id;
    this.chainGroups = [];
    this.chainLinks = [];
    const metal = new THREE.MeshStandardMaterial({ color: 0x555a5b, metalness: 0.9, roughness: 0.3 });
    const wornMetal = new THREE.MeshStandardMaterial({ color: 0x3f4546, metalness: 0.82, roughness: 0.42 });

    for (const direction of [-1, 1]) {
      const chain = new THREE.Group();
      for (let index = 0; index < 18; index += 1) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.048, 10, 20), index % 3 === 0 ? wornMetal : metal);
        const progress = index / 17;
        const y = direction === 1 ? 2.8 + progress * 4.4 : 7.2 - progress * 4.4;
        link.position.set(-2.5 + progress * 5, y, 0.06);
        link.rotation.z = direction * -0.93;
        link.rotation.y = index % 2 === 0 ? 0 : Math.PI / 2;
        link.userData.cutStartPosition = link.position.clone();
        link.userData.cutStartRotation = link.rotation.clone();
        link.userData.cutEndPosition = new THREE.Vector3(
          direction * (0.28 + progress * 2.2),
          0.16 + (index % 3) * 0.055,
          0.08 + Math.sin(index * 1.15) * 0.28,
        );
        link.userData.cutEndRotation = new THREE.Euler(
          Math.PI / 2 + (index % 2) * 0.12,
          index * 0.42,
          direction * (0.18 + index * 0.08),
        );
        this.chainLinks.push(link);
        chain.add(link);
      }
      this.chainGroups.push(chain);
      this.object3D.add(chain);
    }

    this.padlock = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.68, 0.28), wornMetal);
    body.position.y = -0.12;
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 10, 22, Math.PI), metal);
    shackle.position.y = 0.28;
    const keyhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.025, 16),
      new THREE.MeshStandardMaterial({ color: 0x171a1a, roughness: 0.7 }),
    );
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.set(0, -0.16, 0.16);
    this.padlock.add(body, shackle, keyhole);
    this.padlock.position.set(0, 5, 0.08);
    this.object3D.add(this.padlock);

    this.cutterAnimation = createBoltCuttersModel();
    this.cutterAnimation.position.set(0, 5.05, 0.48);
    this.cutterAnimation.rotation.z = Math.PI;
    this.cutterAnimation.scale.setScalar(0.72);
    this.cutterAnimation.visible = false;
    this.object3D.add(this.cutterAnimation);
    this.object3D.traverse((part) => {
      if (part.isMesh) part.castShadow = true;
    });
  }

  interact(player) {
    if (this.isCut || this.isCutting || !player?.inventory.hasSelected("bolt-cutters")) return;
    player.inventory.remove("bolt-cutters");
    this.cut({ notify: true });
  }

  cut({ notify = false, immediate = false } = {}) {
    if (this.isCut || this.isCutting) return;
    this.setEnabled(false);
    if (immediate) {
      this.applyCutPose(1);
      this.isCut = true;
      if (notify) this.onCut?.();
      return;
    }
    this.isCutting = true;
    this.cutProgress = 0;
    this.notifyAfterCut = notify;
    this.cutterAnimation.visible = true;
  }

  applyCutPose(progress) {
    const fall = THREE.MathUtils.smoothstep(progress, 0.45, 1);
    const gravityFall = fall * fall;
    this.chainLinks.forEach((link) => {
      link.position.lerpVectors(link.userData.cutStartPosition, link.userData.cutEndPosition, gravityFall);
      const start = link.userData.cutStartRotation;
      const end = link.userData.cutEndRotation;
      link.rotation.set(
        THREE.MathUtils.lerp(start.x, end.x, fall),
        THREE.MathUtils.lerp(start.y, end.y, fall),
        THREE.MathUtils.lerp(start.z, end.z, fall),
      );
    });
    this.padlock.position.set(0.22 * fall, 5 - 4.62 * gravityFall, 0.08 + 0.32 * fall);
    this.padlock.rotation.set((Math.PI / 2) * fall, 0.25 * fall, -0.62 * fall);
  }

  update(deltaTime) {
    if (!this.isCutting) return;
    this.cutProgress = Math.min(1, this.cutProgress + deltaTime / this.cutDuration);
    const progress = this.cutProgress;
    const arms = this.cutterAnimation.userData.cutterArms ?? [];
    const closeProgress = THREE.MathUtils.smoothstep(progress, 0.12, 0.48);
    arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1;
      arm.rotation.z = side * THREE.MathUtils.lerp(-0.34, -0.06, closeProgress);
    });
    this.cutterAnimation.position.y = 5.05 + Math.sin(Math.min(progress, 0.5) * Math.PI * 2) * 0.04;
    this.applyCutPose(progress);
    if (progress < 1) return;
    this.isCutting = false;
    this.isCut = true;
    this.cutterAnimation.visible = false;
    if (this.notifyAfterCut) this.onCut?.();
  }

  getInteractionText(player) {
    if (this.isCut || this.isCutting) return null;
    return player?.inventory.hasSelected("bolt-cutters")
      ? tInteraction("cut", tItem("chains"))
      : tInteraction("needItem", tItem("bolt-cutters"));
  }
}

export { WardrobeChains };
