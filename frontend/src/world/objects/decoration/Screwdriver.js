import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Screwdriver extends Entity {
  constructor({ id = "screwdriver", onCollect = null } = {}) {
    super(id);
    this.itemName = "screwdriver";
    this.onCollect = onCollect;
    this.object3D = new THREE.Group();
    this.object3D.name = id;

    const steel = new THREE.MeshStandardMaterial({ color: 0xc4c9c8, metalness: 0.9, roughness: 0.18 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x5f6464, metalness: 0.88, roughness: 0.24 });
    const grip = new THREE.MeshPhysicalMaterial({
      color: 0xc84b32,
      roughness: 0.38,
      clearcoat: 0.32,
      clearcoatRoughness: 0.35,
    });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x351b18, roughness: 0.82 });

    // The varying profile makes the handle read as a moulded hand tool rather
    // than a plain cylinder, even when it is lying inside the shallow drawer.
    const handleProfile = [
      [0.14, -0.72],
      [0.18, -0.67],
      [0.19, -0.55],
      [0.16, -0.42],
      [0.185, -0.29],
      [0.155, -0.15],
      [0.105, -0.08],
    ].map(([radius, y]) => new THREE.Vector2(radius, y));
    const handle = new THREE.Mesh(new THREE.LatheGeometry(handleProfile, 28), grip);

    const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.045, 24), rubber);
    endCap.position.y = -0.705;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.085, 24), darkSteel);
    collar.position.y = -0.04;

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.76, 16), steel);
    shaft.position.y = 0.38;
    const taper = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.14, 12), darkSteel);
    taper.position.y = 0.83;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.11, 0.025), darkSteel);
    blade.position.y = 0.945;

    const gripRings = [-0.55, -0.42, -0.29].map((y) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.169, 0.012, 8, 28), rubber);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      return ring;
    });
    const gripChannels = Array.from({ length: 6 }, (_, index) => {
      const angle = (index / 6) * Math.PI * 2;
      const channel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), rubber);
      channel.position.set(Math.cos(angle) * 0.174, -0.42, Math.sin(angle) * 0.174);
      return channel;
    });

    [shaft, taper, blade, handle, endCap, collar, ...gripRings, ...gripChannels].forEach((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    this.object3D.add(handle, endCap, collar, shaft, taper, blade, ...gripRings, ...gripChannels);
    this.object3D.rotation.z = Math.PI / 2;
    this.object3D.scale.setScalar(0.78);
  }

  interact(player) {
    if (!this.enabled || !player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null;
  }

  dispose() {
    this.object3D.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
  }
}

export { Screwdriver };
