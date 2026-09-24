class Entity {
  constructor(id = null) {
    this.id = id;
    this.object3D = null;
    this.interactionText = "";
    this.enabled = true;
  }

  interact() {}

  update() {}

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  getInteractionText() {
    return null;
  }

  dispose() {}
}

export { Entity };
