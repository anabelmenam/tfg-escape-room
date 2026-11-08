import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { tInteraction, tItem } from "../../../translations/index.js";
import { ChildrenPuzzle, MELODY, configureChildrenMeshes, markChildrenControl } from "./ChildrenPuzzleBase.js";

const MUSIC_SYMBOLS = ["●", "▲", "■", "★"];
const SYMBOL_LIGHT_COLOR = 0xffd65a;

const createSymbolMaterial = (symbol) => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 256, 256);
  context.fillStyle = "white";
  context.font = "bold 180px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(symbol, 128, 136);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    color: 0x62584d,
    roughness: 0.86,
    side: THREE.DoubleSide,
  });
};

class MusicPuzzle extends ChildrenPuzzle {
  constructor({ character, onFocus, onSolved, onKeyInserted, previewOpenOnPlay = false } = {}) {
    super("children-music", { onFocus });
    this.character = character;
    this.onSolved = onSolved;
    this.onKeyInserted = onKeyInserted;
    this.previewOpenOnPlay = previewOpenOnPlay;
    this.notes = [];
    this.keys = [];
    this.symbolMaterials = [];
    this.melodyTimers = [];
    this.isMelodyPlaying = false;
    this.keyInserted = false;
    this.createInstrument();
  }

  createInstrument() {
    if (this.character === "mum") {
      this.createMusicBox();
    } else {
      this.createXylophone();
    }

    configureChildrenMeshes(this.object3D);
  }

  createMusicBox() {
    const wood = new THREE.MeshStandardMaterial({ color: 0x70412a, roughness: 0.56 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x41251a, roughness: 0.67 });
    const inlay = new THREE.MeshStandardMaterial({ color: 0xc49b63, roughness: 0.55 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xb99050, metalness: 0.72, roughness: 0.32 });

    const base = new THREE.Mesh(new RoundedBoxGeometry(4, 0.13, 2.15, 4, 0.05), darkWood);
    base.position.y = 0.08;

    const interior = new THREE.Mesh(new RoundedBoxGeometry(3.5, 0.12, 1.62, 3, 0.04), darkWood);
    interior.position.y = 0.18;
    const frontWall = new THREE.Mesh(new RoundedBoxGeometry(3.9, 0.86, 0.18, 3, 0.05), wood);
    frontWall.position.set(0, 0.55, 0.94);
    const backWall = frontWall.clone();
    backWall.position.z = -0.94;
    const leftWall = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.86, 1.7, 3, 0.05), wood);
    leftWall.position.set(-1.86, 0.55, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = 1.86;

    const lid = new THREE.Mesh(new RoundedBoxGeometry(4.02, 0.24, 2.17, 4, 0.08), wood);
    lid.position.y = 1.1;
    const inset = new THREE.Mesh(new RoundedBoxGeometry(3.5, 0.025, 1.65, 4, 0.04), darkWood);
    inset.position.y = 1.23;

    this.object3D.add(base, interior, frontWall, backWall, leftWall, rightWall);

    const lidParts = [lid, inset];
    for (let index = 0; index < 8; index += 1) {
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), inlay);
      const angle = (index * Math.PI) / 4;
      petal.rotation.x = -Math.PI / 2;
      petal.rotation.z = angle;
      petal.scale.set(1.35, 0.46, 1);
      petal.position.set(Math.cos(angle) * 0.27, 1.248, Math.sin(angle) * 0.27);
      lidParts.push(petal);
    }

    const center = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), brass);
    center.rotation.x = -Math.PI / 2;
    center.position.y = 1.25;

    const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.28, 0.07, 3, 0.04), brass);
    clasp.position.set(0, 0.98, 1.055);
    lidParts.push(center, clasp);

    [-1.15, 1.15].forEach((x) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 12), brass);
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(x, 1.02, -1.055);
      this.object3D.add(hinge);
    });

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 12), brass);
    stem.rotation.z = Math.PI / 2;
    stem.position.set(2.06, 0.57, 0);
    const key = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 10, 24), brass);
    key.rotation.y = Math.PI / 2;
    key.position.set(2.24, 0.57, 0);

    this.object3D.add(stem, key);

    MUSIC_SYMBOLS.forEach((symbol, index) => {
      const material = createSymbolMaterial(symbol);
      const marker = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), material);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(-1.05 + index * 0.7, 1.266, 0.52);
      this.symbolMaterials.push(material);
      lidParts.push(marker);
    });

    const lidPivot = new THREE.Vector3(0, 1.02, -1.055);
    this.lidGroup = new THREE.Group();
    this.lidGroup.position.copy(lidPivot);
    lidParts.forEach((part) => {
      part.position.sub(lidPivot);
      this.lidGroup.add(part);
    });
    this.object3D.add(this.lidGroup);
  }

  createXylophone() {
    const frame = new THREE.MeshStandardMaterial({ color: 0x704c34, roughness: 0.73 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xb6aa8d, metalness: 0.58, roughness: 0.38 });
    const colors = [0xc75a50, 0xd6a849, 0x699866, 0x5d84a8];

    [-0.62, 0.62].forEach((z) => {
      const rail = new THREE.Mesh(new RoundedBoxGeometry(4.35, 0.2, 0.2, 3, 0.04), frame);
      rail.position.set(0, 0.22, z);
      this.object3D.add(rail);
    });

    [-1.98, 1.98].forEach((x) => {
      const end = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.24, 1.55, 3, 0.04), frame);
      end.position.set(x, 0.22, 0);
      this.object3D.add(end);
    });

    colors.forEach((color, index) => {
      const key = new THREE.Mesh(
        new RoundedBoxGeometry(0.78, 0.16, 1.68 - index * 0.12, 3, 0.04),
        new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.2 }),
      );
      key.position.set(-1.47 + index * 0.98, 0.42, 0);
      markChildrenControl(key, { kind: "music-note", value: index });
      this.keys.push(key);
      this.object3D.add(key);

      const symbol = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), createSymbolMaterial(MUSIC_SYMBOLS[index]));
      symbol.rotation.x = -Math.PI / 2;
      symbol.position.set(key.position.x, 0.515, 0);
      markChildrenControl(symbol, { kind: "music-note", value: index });
      this.object3D.add(symbol);

      [-0.48, 0.48].forEach((z) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), metal);
        pin.position.set(key.position.x, 0.51, z);
        markChildrenControl(pin, { kind: "music-note", value: index });
        this.object3D.add(pin);
      });
    });
  }

  interact(player) {
    if (!this.available) return;

    if (this.character === "mum") {
      if (!this.keyInserted) {
        if (!player?.inventory.hasSelected("music-box-key")) return;
        player.inventory.remove("music-box-key");
        this.setKeyInserted();
      }
      this.playMelody();

      if (this.previewOpenOnPlay) {
        this.openBox();
      }

      return;
    }
    if (!this.isSolved) this.onFocus?.(this);
  }

  handleControl(control) {
    if (!this.available) return;

    if (control?.kind === "music-play" && this.character === "mum") {
      this.playMelody();
      return;
    }

    if (control?.kind !== "music-note" || this.character !== "dad" || this.isSolved) return;

    this.playTone(control.value);
    const expected = MELODY[this.notes.length];
    this.notes = control.value === expected ? [...this.notes, control.value] : [];
    this.trySolve();
  }

  playMelody() {
    if (this.isMelodyPlaying) return;

    this.clearMelody();
    this.isMelodyPlaying = true;

    this.melodyTimers = MELODY.flatMap((note, index) => [
      setTimeout(() => {
        this.playTone(note);
        this.setSymbolActive(note, true);
      }, index * 700),
      setTimeout(() => this.setSymbolActive(note, false), index * 700 + 500),
    ]);

    this.melodyTimers.push(
      setTimeout(
        () => {
          this.melodyTimers = [];
          this.isMelodyPlaying = false;
        },
        MELODY.length * 700 + 300,
      ),
    );
  }

  clearMelody() {
    this.melodyTimers.forEach((timer) => clearTimeout(timer));
    this.melodyTimers = [];
    this.symbolMaterials.forEach((_, index) => this.setSymbolActive(index, false));
    this.isMelodyPlaying = false;
  }

  setSymbolActive(index, active) {
    this.symbolMaterials[index]?.color.setHex(active ? SYMBOL_LIGHT_COLOR : 0x62584d);
  }

  openBox() {
    if (this.lidGroup) {
      this.lidGroup.rotation.x = -1.08;
    }
  }

  setKeyInserted({ notify = true } = {}) {
    if (this.keyInserted) return;
    this.keyInserted = true;
    this.trySolve();
    if (notify) {
      this.onKeyInserted?.();
    }
  }

  trySolve() {
    if (this.character === "dad" && this.keyInserted && this.notes.length === MELODY.length) {
      this.solve();
    }
  }

  setAudioListener(audioController) {
    this.audioController = audioController;
  }

  playTone(note) {
    this.audioController?.playXylophoneTone([261.63, 293.66, 329.63, 392][note]);
  }

  solve({ notify = true } = {}) {
    if (this.isSolved) return;

    this.isSolved = true;
    this.notes = [...MELODY];

    if (this.character === "mum") {
      this.openBox();
    }

    if (notify) {
      this.onSolved?.();
    }
  }

  getInteractionText(player) {
    if (!this.available) {
      return this.character === "mum" ? tInteraction("needItem", tItem("music-box-key")) : null;
    }

    if (this.character === "mum") {
      if (!this.keyInserted) {
        return player?.inventory.hasSelected("music-box-key")
          ? tInteraction("insert", tItem("music-box-key"))
          : tInteraction("needItem", tItem("music-box-key"));
      }

      return tInteraction("listen", tItem("music-sequence"));
    }

    if (this.isSolved) {
      return null;
    }

    return tInteraction("examine", tItem("xylophone"));
  }

  dispose() {
    this.clearMelody();
    this.audioController = null;
  }
}

export { MusicPuzzle };
