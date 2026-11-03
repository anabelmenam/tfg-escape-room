import * as THREE from "three";
import { Entity } from "../objects/index.js";
import { tInteraction, tItem } from "../../translations/index.js";

const SOLUTION = [0, 1, 2, 3]; // primavera, verano, otoño, invierno
const SEASON_COLORS = [0x6f9b54, 0xe1b342, 0xb86a32, 0xc7d4df];

const createSeasonIcon = (season, { ash = false } = {}) => {
  const group = new THREE.Group();
  const color = ash ? 0x8c8378 : SEASON_COLORS[season];
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: ash ? 0x000000 : color,
    emissiveIntensity: ash ? 0 : 0.28,
  });
  const addBar = (rotation, length = 0.24, distance = 0) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.026, length, 0.02), material);
    bar.rotation.z = rotation;
    bar.position.set(Math.sin(rotation) * distance, Math.cos(rotation) * distance, 0);
    group.add(bar);
  };
  if (season === 0) {
    for (let index = 0; index < 5; index += 1) {
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), material);
      const angle = (index / 5) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.09, Math.sin(angle) * 0.09, 0);
      group.add(petal);
    }
    group.add(
      new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 12),
        new THREE.MeshStandardMaterial({ color: ash ? 0x71685e : 0xf1d36b }),
      ),
    );
  } else if (season === 1) {
    group.add(new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), material));
    for (let index = 0; index < 8; index += 1) {
      const ray = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.095, 0.018), material);
      const angle = (index / 8) * Math.PI * 2;
      ray.rotation.z = angle;
      ray.position.set(Math.sin(angle) * 0.18, Math.cos(angle) * 0.18, 0);
      group.add(ray);
    }
  } else if (season === 2) {
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.2);
    leafShape.bezierCurveTo(0.19, -0.1, 0.18, 0.15, 0, 0.24);
    leafShape.bezierCurveTo(-0.18, 0.15, -0.19, -0.1, 0, -0.2);
    const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape), material);
    leaf.rotation.z = -0.28;
    group.add(leaf);
    const veinMaterial = new THREE.MeshStandardMaterial({ color: ash ? 0x635c54 : 0x6b341b, roughness: 0.9 });
    const vein = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.28, 0.018), veinMaterial);
    vein.rotation.z = -0.28;
    group.add(vein);
    for (const side of [-1, 1]) {
      const branch = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.018), veinMaterial);
      branch.position.set(side * 0.045, 0.01, 0.01);
      branch.rotation.z = side * 0.85;
      group.add(branch);
    }
  } else {
    for (const angle of [0, Math.PI / 3, (Math.PI * 2) / 3]) addBar(angle, 0.3);
  }
  return group;
};

const createDial = ({ index, rotation = 0, active = false } = {}) => {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.07, 20),
    new THREE.MeshStandardMaterial({ color: active ? 0x6e2416 : 0x3b2820, emissive: active ? 0x401007 : 0x000000 }),
  );
  disc.rotation.x = Math.PI / 2;
  const pointer = createSeasonIcon(Math.round(rotation / (Math.PI / 2)) % 4);
  if ([1, 2].includes(Math.round(rotation / (Math.PI / 2)) % 4)) pointer.scale.setScalar(0.66);
  pointer.position.z = 0.05;
  group.add(disc, pointer);
  group.userData.emberIndex = index;
  group.traverse((child) => (child.userData.emberIndex = index));
  return { group, pointer, disc };
};

class EmberClue extends Entity {
  constructor({ pattern = SOLUTION } = {}) {
    super("living-room-ember-clue");
    this.object3D = new THREE.Group();
    this.object3D.rotation.x = -Math.PI / 2;
    pattern.forEach((value, index) => {
      const symbol = createSeasonIcon(value, { ash: true });
      symbol.position.set((index - 1.5) * 0.55, 0, 0.01);
      this.object3D.add(symbol);
    });
  }
}

class EmberPuzzle extends Entity {
  constructor({ onFocus = null, onSolved = null } = {}) {
    super("living-room-embers");
    this.onFocus = onFocus;
    this.onSolved = onSolved;
    this.values = [2, 0, 3, 1];
    this.available = false;
    this.isSolved = false;
    this.object3D = new THREE.Group();
    this.dials = this.values.map((value, index) => {
      const dial = createDial({ index, rotation: (value * Math.PI) / 2, active: true });
      dial.group.position.set((index - 1.5) * 0.55, 0, 0);
      this.object3D.add(dial.group);
      return dial;
    });
  }

  reveal() {
    this.available = true;
    if (!this.isSolved) this.trySolve();
  }

  rotateEmber(index) {
    if (this.isSolved || index < 0 || index >= this.values.length) return;
    this.values[index] = (this.values[index] + 1) % 4;
    this.dials[index].group.remove(this.dials[index].pointer);
    this.dials[index].pointer = createSeasonIcon(this.values[index]);
    if ([1, 2].includes(this.values[index])) this.dials[index].pointer.scale.setScalar(0.66);
    this.dials[index].pointer.position.z = 0.05;
    this.dials[index].pointer.traverse((child) => (child.userData.emberIndex = index));
    this.dials[index].group.add(this.dials[index].pointer);
    this.trySolve();
  }

  trySolve() {
    if (this.available && this.values.every((value, i) => value === SOLUTION[i])) this.solve();
  }

  solve({ notify = true } = {}) {
    if (this.isSolved) return;
    this.values = [...SOLUTION];
    this.values.forEach((value, index) => {
      this.dials[index].group.remove(this.dials[index].pointer);
      this.dials[index].pointer = createSeasonIcon(value);
      if ([1, 2].includes(value)) this.dials[index].pointer.scale.setScalar(0.66);
      this.dials[index].pointer.position.z = 0.05;
      this.dials[index].pointer.traverse((child) => (child.userData.emberIndex = index));
      this.dials[index].group.add(this.dials[index].pointer);
    });
    this.isSolved = true;
    if (notify) {
      this.exitFocusRequested = true;
      this.onSolved?.();
    }
  }

  interact() {
    if (!this.isSolved) this.onFocus?.(this);
  }
  getInteractionText() {
    return this.isSolved ? null : tInteraction("examine", tItem("seasons"));
  }
  setFocused(focused) {
    this.focused = focused;
  }
  getFocusPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3(0, 0, 2.5));
  }
  getLookAtPosition() {
    this.object3D.updateWorldMatrix(true, false);
    return this.object3D.localToWorld(new THREE.Vector3());
  }
}

export { EmberClue, EmberPuzzle };
