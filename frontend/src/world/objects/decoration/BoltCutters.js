import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const createJawGeometry = (side) => {
  const shape = new THREE.Shape();
  shape.moveTo(side * .07, 0);
  shape.lineTo(side * .28, .62);
  shape.lineTo(side * .08, .88);
  shape.lineTo(side * -.035, .56);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: .11,
    bevelEnabled: true,
    bevelSize: .018,
    bevelThickness: .018,
  });
};

const createBoltCuttersModel = () => {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x596268, metalness: .88, roughness: .23 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x30373a, metalness: .82, roughness: .3 });
  const grip = new THREE.MeshStandardMaterial({ color: 0xa72e28, roughness: .76 });
  const gripEnd = new THREE.MeshStandardMaterial({ color: 0x2b2020, roughness: .9 });
  const arms = [];

  [-1, 1].forEach((side) => {
    const arm = new THREE.Group();
    arm.rotation.z = side * -.12;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.075, .09, 1.72, 18), steel);
    shaft.position.y = -.88;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.12, 20), grip);
    sleeve.position.y = -1.18;
    const endCap = new THREE.Mesh(new THREE.CylinderGeometry(.125, .125, .1, 20), gripEnd);
    endCap.position.y = -1.77;
    const jaw = new THREE.Mesh(createJawGeometry(side), darkSteel);
    jaw.position.set(0, .04, -.055);
    const bevel = new THREE.Mesh(new THREE.BoxGeometry(.08, .46, .13), steel);
    bevel.position.set(side * .09, .53, .01);
    bevel.rotation.z = side * -.21;
    arm.add(shaft, sleeve, endCap, jaw, bevel);
    arms.push(arm);
    group.add(arm);
  });

  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .2, 24), darkSteel);
  pivot.rotation.x = Math.PI / 2;
  const pivotCap = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .215, 20), steel);
  pivotCap.rotation.x = Math.PI / 2;
  group.add(pivot, pivotCap);
  group.traverse((part) => {
    if (!part.isMesh) return;
    part.castShadow = true;
    part.receiveShadow = true;
  });
  group.userData.cutterArms = arms;
  return group;
};

class BoltCutters extends Entity {
  constructor({ onCollect = null } = {}) {
    super("bolt-cutters");
    this.itemName = "bolt-cutters";
    this.onCollect = onCollect;
    this.object3D = createBoltCuttersModel();
    this.object3D.name = this.id;
    this.object3D.visible = false;
    this.setEnabled(false);
  }

  reveal() { this.object3D.visible = true; this.setEnabled(true); }

  interact(player) {
    if (!this.enabled || !player?.inventory.add(this)) return;
    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() { return this.enabled ? tInteraction("pickUp", tItem(this.itemName)) : null; }
}

export { BoltCutters, createBoltCuttersModel };
