import * as THREE from "three";
import { tInteraction, tItem } from "../../../translations/index.js";
import { FocusPuzzle, createNapkinLabelTexture, mark, shadows } from "./KitchenPuzzleBase.js";

class TableSettingPuzzle extends FocusPuzzle {
  constructor({ character, onFocus, onSolved, onPlacementChange = null, napkins = [] }) {
    super("kitchen-family-table", { onFocus });
    this.character = character;
    this.onSolved = onSolved;
    this.onPlacementChange = onPlacementChange;
    this.settings = [];
    this.placements = [null, null, null, null];
    this.napkinsById = new Map(napkins.map((napkin) => [napkin.id, napkin]));

    this.expectedNapkins = [
      "kitchen-napkin-red",
      "kitchen-napkin-green",
      "kitchen-napkin-blue",
      "kitchen-napkin-ochre",
    ];
    this.napkinColors = {
      "kitchen-napkin-red": 0xcbbd9f,
      "kitchen-napkin-blue": 0xcbbd9f,
      "kitchen-napkin-green": 0xcbbd9f,
      "kitchen-napkin-ochre": 0xcbbd9f,
    };
    this.napkinNames = {
      "kitchen-napkin-red": "MAMÁ",
      "kitchen-napkin-blue": "PAPÁ",
      "kitchen-napkin-green": "ALBA",
      "kitchen-napkin-ochre": "JAIME",
    };

    this.napkinLabelTextures = new Map(
      Object.entries(this.napkinNames).map(([id, name]) => [id, createNapkinLabelTexture(name)]),
    );
    this.labelTextures = [];

    const positions = [
      [-2.15, -1.02],
      [-2.15, 1.02],
      [2.15, -1.02],
      [2.15, 1.02],
    ];
    const names = ["MAMÁ", "ALBA", "PAPÁ", "JAIME"];
    const porcelain = new THREE.MeshStandardMaterial({ color: 0xf0eadc, roughness: 0.42 });

    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xcde1df,
      transparent: true,
      opacity: 0.46,
      roughness: 0.08,
      transmission: 0.25,
    });
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9b8b2, metalness: 0.82, roughness: 0.2 });

    positions.forEach(([x, z], index) => {
      const setting = new THREE.Group();
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;

      const context = canvas.getContext("2d");
      context.fillStyle = "#d8c49d";
      context.fillRect(0, 0, 512, 256);
      context.strokeStyle = "#76583c";
      context.lineWidth = 14;
      context.strokeRect(12, 12, 488, 232);
      context.fillStyle = "#4a3324";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "bold 62px Georgia";
      context.fillText(names[index], 256, 128);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.labelTextures.push(texture);

      const placemat = new THREE.Mesh(
        new THREE.BoxGeometry(1.38, 0.035, 1.05),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96 }),
      );
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.055, 32), porcelain);
      plate.position.y = 0.06;

      const innerPlate = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.025, 10, 30), porcelain.clone());
      innerPlate.rotation.x = Math.PI / 2;
      innerPlate.position.y = 0.105;
      const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.09, 0.34, 20, 1, true), glass);
      tumbler.position.set(0.52, 0.22, -0.24);

      const fork = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.6), steel);
      fork.position.set(-0.58, 0.075, 0);
      const knife = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.04, 0.62), steel);
      knife.position.set(0.58, 0.075, 0.08);

      const napkin = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.055, 0.31),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94 }),
      );

      const fold = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.25), base.material.clone());
      fold.position.set(0.07, 0.04, 0);
      fold.rotation.y = -0.16;

      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.09),
        new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.95 }),
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(-0.055, 0.07, -0.095);

      napkin.add(base, fold, label);
      napkin.userData.label = label;
      napkin.position.set(0, 0.15, 0.02);
      napkin.visible = false;

      if (character === "mum") {
        setting.add(placemat);
      } else {
        setting.add(placemat, plate, innerPlate, tumbler, fork, knife, napkin);
      }

      setting.position.set(x, 0.09, z);

      if (index === 0 || index === 2) {
        setting.rotation.y = Math.PI;
      }

      setting.userData.parts = { napkin };
      mark(setting, { kind: "place-setting", value: index });
      this.settings.push(setting);
      this.object3D.add(setting);
    });

    shadows(this.object3D);
  }

  setPlacement(index, napkinId) {
    const setting = this.settings[index];
    if (!setting) return;
    this.placements[index] = napkinId ?? null;
    const napkin = setting.userData.parts.napkin;
    napkin.visible = Boolean(napkinId);

    if (napkinId) {
      napkin.children.slice(0, 2).forEach((part) => part.material.color.setHex(this.napkinColors[napkinId]));
      napkin.userData.label.material.map = this.napkinLabelTextures.get(napkinId);
      napkin.userData.label.material.needsUpdate = true;
    }
  }

  applyPlacements(placements = []) {
    this.settings.forEach((_, index) => this.setPlacement(index, placements[index] ?? null));
  }

  interact(player, control = null) {
    if (!this.available || this.isSolved) return;

    this.player = player;
    if (this.character === "mum") return;

    if (control?.kind === "place-setting") {
      this.handleControl(control, player);
    }
  }

  handleControl(control, player = this.player) {
    if (this.character !== "dad" || !this.available || this.isSolved || control?.kind !== "place-setting") return;

    const index = control.value;
    const placedNapkinId = this.placements[index];

    if (placedNapkinId) {
      const item = this.napkinsById.get(placedNapkinId);
      if (!item || !player?.inventory.add(item)) return;

      this.setPlacement(index, null);
      this.onPlacementChange?.({ operation: "remove", seatIndex: index, napkinId: placedNapkinId });
      return;
    }

    const selected = player?.inventory.getSelectedItem();

    if (!selected || !this.napkinsById.has(selected.id)) return;
    player.removeItemFromInventory(selected.id);
    this.setPlacement(index, selected.id);
    this.onPlacementChange?.({ operation: "place", seatIndex: index, napkinId: selected.id });

    if (this.placements.every((napkinId, seatIndex) => napkinId === this.expectedNapkins[seatIndex])) {
      this.solve();
    }
  }

  solve({ notify = true, placements = this.expectedNapkins } = {}) {
    if (this.isSolved) return;
    this.isSolved = true;
    this.applyPlacements(placements);

    if (notify) {
      this.onSolved?.();
    }
  }

  getInteractionText(player = this.player, control = null) {
    if (!this.available || this.isSolved || this.character === "mum" || control?.kind !== "place-setting") {
      return null;
    }

    const placed = this.placements[control.value];
    if (placed) {
      return tInteraction("pickUp", tItem(placed));
    }

    const selected = player?.inventory.getSelectedItem();
    return selected && this.napkinsById.has(selected.id)
      ? tInteraction("insert", tItem(selected.id))
      : tInteraction("needItem", tItem("napkin"));
  }

  getFocusHint() {
    return tInteraction("exit");
  }

  dispose() {
    this.labelTextures.forEach((texture) => texture.dispose());
    this.napkinLabelTextures.forEach((texture) => texture.dispose());
  }
}

export { TableSettingPuzzle };
