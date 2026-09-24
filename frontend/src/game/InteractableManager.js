export class InteractableManager {
  constructor() {
    this.interactables = [];
  }

  add(entity) {
    if (!entity?.object3D) {
      return;
    }

    this.interactables.push(entity);
  }

  getAll() {
    return this.interactables;
  }

  dispose() {
    this.interactables = [];
  }
}
