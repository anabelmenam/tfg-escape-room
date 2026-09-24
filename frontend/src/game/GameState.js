export class GameState {
  constructor() {
    this.state = {};
  }

  set(key, value) {
    this.state[key] = value;
  }

  get(key) {
    return this.state[key];
  }

  toggle(key) {
    const newValue = !this.state[key];

    this.state[key] = newValue;

    return newValue;
  }
}
