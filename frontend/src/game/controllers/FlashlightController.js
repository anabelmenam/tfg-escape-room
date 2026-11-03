import * as THREE from "three";

export class FlashlightController {
  constructor(game) {
    this.game = game;
    this.light = new THREE.SpotLight(0xfff0c2, 65, 45, Math.PI / 7, 0.35, 1.1);
    this.target = new THREE.Object3D();
    this.light.visible = false;
    this.light.target = this.target;
    this.active = false;
    game.scene.add(this.light, this.target);
  }
  toggle() {
    if (!this.game.player.inventory.has("flashlight")) return;
    this.active = !this.active;
    this.light.visible = this.active;
  }
  update() {
    if (!this.active) return;
    const offset = new THREE.Vector3(0.18, -0.14, -0.08).applyQuaternion(this.game.camera.quaternion);
    const direction = new THREE.Vector3();
    this.game.camera.getWorldDirection(direction);
    this.light.position.copy(this.game.camera.position).add(offset);
    this.target.position.copy(this.light.position).addScaledVector(direction, 18);
    this.target.updateMatrixWorld();
  }
}
