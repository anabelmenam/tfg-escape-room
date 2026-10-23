import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Flashlight extends Entity {
  constructor({ id = "flashlight", position = new THREE.Vector3(), scale = 1, onCollect = null } = {}) {
    super(id);
    this.inventoryIcon = "/images/icons/bedroom/flashlight.png";
    this.onCollect = onCollect;
    this.object3D = this.createObject();
    this.object3D.position.copy(position);
    this.object3D.scale.setScalar(scale);
  }

  createObject() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x29343c, metalness: 0.78, roughness: 0.26 });
    const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x101519, roughness: 0.82 });
    const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xaeb9be, metalness: 0.9, roughness: 0.16 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xd09a2c, metalness: 0.65, roughness: 0.28 });
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: 0xffedb0,
      roughness: 0.16,
    });

    const orientAlongLength = (mesh) => {
      mesh.rotation.z = Math.PI / 2;
      return mesh;
    };

    const grip = orientAlongLength(new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.17, 0.92, 24), gripMaterial));
    const tailCap = orientAlongLength(new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.175, 0.15, 24), bodyMaterial));
    const rearBand = orientAlongLength(
      new THREE.Mesh(new THREE.CylinderGeometry(0.177, 0.177, 0.07, 24), accentMaterial),
    );
    const neck = orientAlongLength(new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.21, 0.18, 24), bodyMaterial));
    const head = orientAlongLength(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.2, 24), bodyMaterial));
    const bezel = orientAlongLength(new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.11, 24), metalMaterial));

    tailCap.position.x = -0.535;
    rearBand.position.x = -0.43;
    neck.position.x = 0.53;
    head.position.x = 0.68;
    bezel.position.x = 0.835;

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.225, 24), lensMaterial);
    lens.rotation.y = Math.PI / 2;
    lens.position.x = 0.895;

    const reflector = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.205, 24), metalMaterial);
    reflector.rotation.y = Math.PI / 2;
    reflector.position.x = 0.9;

    [-0.27, -0.08, 0.11, 0.3].forEach((x) => {
      const gripRing = new THREE.Mesh(new THREE.TorusGeometry(0.173, 0.012, 8, 20), bodyMaterial);
      gripRing.rotation.y = Math.PI / 2;
      gripRing.position.x = x;
      group.add(gripRing);
    });

    const switchBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.2), bodyMaterial);
    const switchButton = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.045, 0.13), accentMaterial);
    switchBase.position.set(0.02, 0.17, 0);
    switchButton.position.set(0.02, 0.22, 0);

    const lanyard = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.018, 8, 20, Math.PI * 1.3),
      new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 }),
    );
    lanyard.rotation.set(0, Math.PI / 2, Math.PI / 2);
    lanyard.position.set(-0.67, -0.13, 0);

    [grip, tailCap, rearBand, neck, head, bezel, lens, reflector, switchBase, switchButton, lanyard].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
      group.add(part);
    });

    return group;
  }

  interact(player) {
    if (!player?.inventory.add(this)) {
      return;
    }

    this.object3D.visible = false;
    this.setEnabled(false);
    this.onCollect?.();
  }

  getInteractionText() {
    return this.enabled ? tInteraction("pickUp", tItem(this.id)) : null;
  }
}

export { Flashlight };
