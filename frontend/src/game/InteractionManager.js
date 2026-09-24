import * as THREE from "three";

export class InteractionManager {
  constructor({ camera, interactableManager, player }) {
    this.camera = camera;
    this.interactableManager = interactableManager;
    this.player = player;

    this.raycaster = new THREE.Raycaster();

    this.interactable = null;
    this.occluders = [];
    this.interactionDistance = 8;

    this.screenCenter = new THREE.Vector2(0, 0);
  }

  setOccluders(objects) {
    this.occluders = objects;
  }

  update() {
    if (this.player.isFocused) {
      this.setInteractable(null);
      return;
    }

    this.camera.updateWorldMatrix(true, false);
    this.raycaster.setFromCamera(this.screenCenter, this.camera);
    const entities = this.interactableManager.getAll();
    const objects = entities.map((entity) => entity.object3D);
    const intersections = this.raycaster.intersectObjects(objects, true);
    if (intersections.length === 0) {
      this.setInteractable(null);
      return;
    }

    const intersection = intersections[0];
    if (intersection.distance > this.interactionDistance) {
      this.setInteractable(null);
      return;
    }
    const obstruction = this.raycaster.intersectObjects(this.occluders, true)[0];
    if (obstruction && obstruction.distance < intersection.distance) {
      this.setInteractable(null);
      return;
    }
    const entity = this.findEntityFromObject(intersection.object);
    this.setInteractable(entity);
  }

  findEntityFromObject(object) {
    const entities = this.interactableManager.getAll();

    let currentObject = object;

    while (currentObject) {
      const entity = entities.find((candidate) => candidate.object3D === currentObject);

      if (entity) {
        return entity;
      }

      currentObject = currentObject.parent;
    }

    return null;
  }

  setInteractable(entity) {
    const interactionText = document.getElementById("interaction-text");
    if (!interactionText) {
      return;
    }

    const text = entity?.enabled ? entity.getInteractionText?.(this.player) : null;
    if (!entity || !text) {
      this.interactable = null;
      interactionText.textContent = "";
      interactionText.classList.add("hidden");
      return;
    }

    this.interactable = entity;
    interactionText.textContent = text;
    interactionText.classList.remove("hidden");
  }

  use() {
    this.update();
    if (!this.interactable || !this.interactable.enabled || this.player.isFocused) {
      return;
    }

    const currentInteractable = this.interactable;
    currentInteractable.interact(this.player);
    if (!currentInteractable.enabled || !currentInteractable.getInteractionText?.(this.player)) {
      this.setInteractable(null);
    }
  }

  dispose() {
    this.occluders = [];
    this.setInteractable(null);
  }
}
