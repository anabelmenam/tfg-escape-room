import * as THREE from "three";
import { Entity } from "../Entity.js";
import { t } from "../../../translations/index.js";

class FinalThreshold extends Entity {
  constructor({ timeline, isInteractHeld = () => false, onHoldChange = null } = {}) {
    super("hallway-final-threshold");
    this.timeline = timeline;
    this.isInteractHeld = isInteractHeld;
    this.onHoldChange = onHoldChange;
    this.holding = false;
    this.object3D = new THREE.Group();
    this.object3D.name = this.id;

    const interactionZone = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 7.6, .5),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    interactionZone.position.set(0, 0, .25);
    this.object3D.add(interactionZone);
    this.setEnabled(false);
  }

  interact() {
    if (!this.enabled || this.holding) return;
    this.holding = true;
    this.onHoldChange?.(true);
  }

  update() {
    if (!this.holding || this.isInteractHeld()) return;
    this.holding = false;
    this.onHoldChange?.(false);
  }

  applyEndingState(ending) {
    const phase = ending?.phase;
    this.setEnabled(phase === "threshold");
    if (phase !== "threshold") this.holding = false;
  }

  getInteractionText() {
    if (!this.enabled) return null;
    return this.holding ? t("finalWaiting") : t("ending.holdDoor");
  }
}

export { FinalThreshold };
