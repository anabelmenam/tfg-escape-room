export class EntityManager {
  constructor() {
    this.entities = [];
  }

  add(entity) {
    this.entities.push(entity);
  }

  remove(entity) {
    this.entities = this.entities.filter((e) => e !== entity);
  }

  update(delta) {
    for (const entity of this.entities) {
      entity.update(delta);
    }
  }

  dispose() {
    for (const entity of this.entities) {
      entity.dispose();
    }

    this.entities = [];
  }
}
