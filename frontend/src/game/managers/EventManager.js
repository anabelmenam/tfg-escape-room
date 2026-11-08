export class EventManager {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  emit(event, data = null) {
    if (!this.listeners[event]) {
      return;
    }

    for (const callback of this.listeners[event]) {
      callback(data);
    }
  }
}
