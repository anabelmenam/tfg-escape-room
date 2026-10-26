class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.style = {};
    this.children = [];
    this.userData = {};
    this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
    this.listeners = new Map();
    this.width = 1024;
    this.height = 768;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  remove() {}
  setAttribute() {}
  getAttribute() { return null; }
  getRootNode() { return this.ownerDocument ?? globalThis.document; }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
  setPointerCapture() {}
  releasePointerCapture() {}
  requestPointerLock() {
    if (globalThis.document) globalThis.document.pointerLockElement = this;
    this.listeners.get("pointerlockchange")?.();
  }
  focus() {}
  click() {}
  toDataURL() { return "data:image/png;base64,"; }

  getContext() {
    const gradient = { addColorStop() {} };
    return new Proxy({
      canvas: this,
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      createPattern: () => null,
      measureText: (text) => ({ width: String(text).length * 8 }),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    }, {
      get(target, property) {
        if (property in target) return target[property];
        return () => {};
      },
      set(target, property, value) {
        target[property] = value;
        return true;
      },
    });
  }

  set src(value) {
    this._src = value;
    queueMicrotask(() => this.listeners.get("load")?.({ target: this }));
  }

  get src() { return this._src; }
}

class FakeAudio extends FakeElement {
  constructor(src = "") {
    super("audio");
    this.src = src;
    this.volume = 1;
    this.currentTime = 0;
    this.paused = true;
    this.readyState = 4;
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() { this.paused = true; }
  load() { queueMicrotask(() => this.listeners.get("canplaythrough")?.({ target: this })); }
  cloneNode() { return new FakeAudio(this.src); }
}

const installBrowserMocks = () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  };
  const elements = new Map();
  globalThis.document = {
    body: new FakeElement("body"),
    documentElement: new FakeElement("html"),
    createElement: (tagName) => { const element = new FakeElement(tagName); element.ownerDocument = globalThis.document; return element; },
    createElementNS: (_namespace, tagName) => { const element = new FakeElement(tagName); element.ownerDocument = globalThis.document; return element; },
    getElementById: (id) => elements.get(id) ?? null,
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
    pointerLockElement: null,
    exitPointerLock() { this.pointerLockElement = null; },
    __elements: elements,
  };
  globalThis.document.body.ownerDocument = globalThis.document;
  globalThis.document.documentElement.ownerDocument = globalThis.document;
  globalThis.window = globalThis;
  globalThis.window.innerWidth = 1280;
  globalThis.window.innerHeight = 720;
  globalThis.window.devicePixelRatio = 1;
  globalThis.window.location = { origin: "http://localhost:5173", search: "" };
  globalThis.window.addEventListener = () => {};
  globalThis.window.removeEventListener = () => {};
  globalThis.window.dispatchEvent = () => true;
  globalThis.Image = FakeElement;
  globalThis.Audio = FakeAudio;
  globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0);
  globalThis.cancelAnimationFrame = clearTimeout;
};

export { FakeAudio, FakeElement, installBrowserMocks };
