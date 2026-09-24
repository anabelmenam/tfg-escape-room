export class Input {
  constructor() {
    this.keys = {};

    this._onKeyDown = (e) => {
      this.keys[e.code] = true;
    };

    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    this._onBlur = () => {
      this.keys = {};
    };

    window.addEventListener("blur", this._onBlur);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  isPressed(code) {
    return !!this.keys[code];
  }

  dispose() {
    window.removeEventListener("blur", this._onBlur);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}
