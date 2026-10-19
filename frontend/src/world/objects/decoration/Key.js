import * as THREE from "three";
import { Entity } from "../Entity";
import { tInteraction, tItem } from "../../../translations";

class Key extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    color = 0xb9b4ac,
    scalar = 1,
    inventoryIcon = "/images/icons/key.png",
  } = {}) {
    super(id);
    this.color = color;
    this.inventoryIcon = inventoryIcon;
    this.object3D = this.createObject();
    this.object3D.position.copy(position);
    this.object3D.rotateZ(Math.PI / 2);
    this.object3D.rotateY(Math.PI / 2);
    this.object3D.scale.setScalar(scalar);
  }

  createObject() {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      metalness: 0.8,
      roughness: 0.1,
    });

    const headShape = new THREE.Shape();
    const outerRadius = 0.105;
    const innerRadius = 0.055;
    const sides = 8;

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + Math.PI / 8;
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;

      if (i === 0) {
        headShape.moveTo(x, y);
      } else {
        headShape.lineTo(x, y);
      }
    }
    headShape.closePath();

    const hole = new THREE.Path();
    for (let i = 0; i < sides; i++) {
      const angle = -(i / sides) * Math.PI * 2 + Math.PI / 8;
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;

      if (i === 0) {
        hole.moveTo(x, y);
      } else {
        hole.lineTo(x, y);
      }
    }

    hole.closePath();
    headShape.holes.push(hole);
    const headGeometry = new THREE.ExtrudeGeometry(headShape, {
      depth: 0.025,
      bevelEnabled: false,
    });

    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 0, -0.0125);
    group.add(head);

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.32, 0.025), material);
    shaft.position.y = -0.24;
    group.add(shaft);

    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.03), material);
    collar.position.y = -0.405;
    group.add(collar);

    const bitShape = new THREE.Shape();
    bitShape.moveTo(-0.014, 0.055);
    bitShape.lineTo(0.085, 0.055);
    bitShape.lineTo(0.085, 0.02);
    bitShape.lineTo(0.04, 0.02);
    bitShape.lineTo(0.04, -0.015);
    bitShape.lineTo(0.075, -0.015);
    bitShape.lineTo(0.075, -0.045);
    bitShape.lineTo(-0.014, -0.045);
    bitShape.closePath();

    const bitGeometry = new THREE.ExtrudeGeometry(bitShape, {
      depth: 0.025,
      bevelEnabled: false,
    });

    const bit = new THREE.Mesh(bitGeometry, material);
    bit.position.set(0, -0.455, -0.0125);
    group.add(bit);
    return group;
  }

  getInteractionText() {
    return this.object3D.visible ? tInteraction("pickUp", tItem(this.id)) : null;
  }

  interact(player) {
    const wasAdded = player.inventory.add(this);

    if (!wasAdded) {
      return;
    }

    this.object3D.visible = false;
    this.setEnabled(false);
  }

  update() {
    if (!this.enabled) {
      return;
    }
  }
}

export { Key };
