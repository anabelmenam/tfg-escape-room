import * as THREE from "three";
import { TemporalEcho } from "../TemporalEcho.js";

export class MultiplayerSync {
  constructor(game) {
    this.game = game;
    this.broadcastElapsed = 0;
    this.heartbeatElapsed = 0;
    this.lastPosition = new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0);
    this.lastRotationY = Number.POSITIVE_INFINITY;
    this.remoteEcho = null;
    this.previewEchoes = [];
    this.identity = null;
    this.charactersHidden = false;
  }
  initialize() {
    const game = this.game;
    if (!game.testMode && game.character) {
      this.remoteEcho = new TemporalEcho({ role: game.character === "mum" ? "papa" : "mama" });
      if (this.identity) this.remoteEcho.setName(this.identity.displayName);
      game.scene.add(this.remoteEcho.object3D);
    } else if (game.testMode && game.character) {
      this.previewEchoes = [new TemporalEcho({ role: "mama", name: "Personaje A" }), new TemporalEcho({ role: "papa", name: "Personaje B" })];
      this.previewEchoes.forEach((echo) => game.scene.add(echo.object3D));
    }
  }
  placePreviewEchoes() {
    if (!this.previewEchoes.length) return;
    const direction = new THREE.Vector3(); this.game.camera.getWorldDirection(direction); direction.y = 0; direction.normalize();
    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    const center = this.game.camera.position.clone().addScaledVector(direction, 5.2);
    const facingCamera = Math.atan2(direction.x, direction.z);
    this.previewEchoes.forEach((echo, index) => {
      const position = center.clone().addScaledVector(right, index === 0 ? -1.35 : 1.35);
      echo.setTarget({ position: { x: position.x, y: 5.25, z: position.z }, rotationY: facingCamera + (index === 0 ? -.08 : .08) });
      if (this.charactersHidden) echo.object3D.visible = false;
    });
  }
  update(delta) {
    this.remoteEcho?.update(delta); this.previewEchoes.forEach((echo) => echo.update(delta));
    if (this.charactersHidden) {
      if (this.remoteEcho) this.remoteEcho.object3D.visible = false;
      this.previewEchoes.forEach((echo) => { echo.object3D.visible = false; });
    }
    this.broadcastElapsed += delta; this.heartbeatElapsed += delta;
    if (this.broadcastElapsed < .125 || this.game.player.isFocused) return;
    this.broadcastElapsed = 0;
    const direction = new THREE.Vector3(); this.game.camera.getWorldDirection(direction);
    const rotationY = Math.atan2(-direction.x, -direction.z);
    const moved = this.lastPosition.distanceToSquared(this.game.camera.position) > .0004;
    const turned = Math.abs(Math.atan2(Math.sin(rotationY - this.lastRotationY), Math.cos(rotationY - this.lastRotationY))) > .008;
    if (moved || turned || this.heartbeatElapsed >= 1) {
      const position = this.game.camera.position;
      const roomKey = this.game.roomRegions?.find(({ box }) => position.x >= box.min.x && position.x <= box.max.x && position.z >= box.min.z && position.z <= box.max.z)?.key ?? null;
      this.game.onPlayerMovement?.({ position: { x: position.x, y: position.y, z: position.z }, rotationY, roomKey });
      this.lastPosition.copy(this.game.camera.position); this.lastRotationY = rotationY; this.heartbeatElapsed = 0;
    }
  }
  updateRemote(movement) {
    if (!this.remoteEcho || movement.character === this.game.character) return;
    this.remoteEcho.setTarget(movement);
    if (this.charactersHidden) this.remoteEcho.object3D.visible = false;
  }
  setConnected({ character, connected }) {
    if (!this.remoteEcho || character === this.game.character) return;
    this.remoteEcho.setConnected(connected);
    if (this.charactersHidden) this.remoteEcho.object3D.visible = false;
  }
  setCharactersHidden(hidden = true) {
    this.charactersHidden = hidden;
    if (this.remoteEcho) this.remoteEcho.object3D.visible = !hidden && this.remoteEcho.connected;
    this.previewEchoes.forEach((echo) => { echo.object3D.visible = !hidden; });
  }
  setIdentity({ character, displayName }) { if (character !== this.game.character) { this.identity = { character, displayName }; this.remoteEcho?.setName(displayName); } }
  dispose() { this.remoteEcho?.dispose(); this.previewEchoes.forEach((echo) => echo.dispose()); }
}
