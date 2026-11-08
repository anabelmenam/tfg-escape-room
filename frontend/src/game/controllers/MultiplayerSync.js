import * as THREE from "three";
import { PlayerAvatar } from "../PlayerAvatar.js";

export class MultiplayerSync {
  constructor(game) {
    this.game = game;
    this.broadcastElapsed = 0;
    this.heartbeatElapsed = 0;
    this.lastPosition = new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0);
    this.lastRotationY = Number.POSITIVE_INFINITY;
    this.remoteAvatar = null;
    this.previewAvatars = [];
    this.identity = null;
    this.charactersHidden = false;
  }
  initialize() {
    const game = this.game;
    if (!game.testMode && game.character) {
      this.remoteAvatar = new PlayerAvatar({ role: game.character === "mum" ? "papa" : "mama" });
      if (this.identity) this.remoteAvatar.setName(this.identity.displayName);
      game.scene.add(this.remoteAvatar.object3D);
    }
  }
  placePreviewEchoes() {
    if (!this.previewAvatars.length) return;
    const direction = new THREE.Vector3();
    this.game.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    const center = this.game.camera.position.clone().addScaledVector(direction, 5.2);
    const facingCamera = Math.atan2(direction.x, direction.z);
    this.previewAvatars.forEach((avatar, index) => {
      const position = center.clone().addScaledVector(right, index === 0 ? -1.35 : 1.35);
      avatar.setTarget({
        position: { x: position.x, y: 5.25, z: position.z },
        rotationY: facingCamera + (index === 0 ? -0.08 : 0.08),
      });
      if (this.charactersHidden) avatar.object3D.visible = false;
    });
  }
  update(delta) {
    this.remoteAvatar?.update(delta);
    this.previewAvatars.forEach((avatar) => avatar.update(delta));
    if (this.charactersHidden) {
      if (this.remoteAvatar) this.remoteAvatar.object3D.visible = false;
      this.previewAvatars.forEach((avatar) => {
        avatar.object3D.visible = false;
      });
    }
    this.broadcastElapsed += delta;
    this.heartbeatElapsed += delta;
    if (this.broadcastElapsed < 0.125 || this.game.player.isFocused) return;
    this.broadcastElapsed = 0;
    const direction = new THREE.Vector3();
    this.game.camera.getWorldDirection(direction);
    const rotationY = Math.atan2(-direction.x, -direction.z);
    const moved = this.lastPosition.distanceToSquared(this.game.camera.position) > 0.0004;
    const turned =
      Math.abs(Math.atan2(Math.sin(rotationY - this.lastRotationY), Math.cos(rotationY - this.lastRotationY))) > 0.008;
    if (moved || turned || this.heartbeatElapsed >= 1) {
      const position = this.game.camera.position;
      const roomKey =
        this.game.roomRegions?.find(
          ({ box }) =>
            position.x >= box.min.x && position.x <= box.max.x && position.z >= box.min.z && position.z <= box.max.z,
        )?.key ?? null;
      this.game.onPlayerMovement?.({ position: { x: position.x, y: position.y, z: position.z }, rotationY, roomKey });
      this.lastPosition.copy(this.game.camera.position);
      this.lastRotationY = rotationY;
      this.heartbeatElapsed = 0;
    }
  }
  updateRemote(movement) {
    if (!this.remoteAvatar || movement.character === this.game.character) return;
    this.remoteAvatar.setTarget(movement);
    if (this.charactersHidden) this.remoteAvatar.object3D.visible = false;
  }
  setConnected({ character, connected }) {
    if (!this.remoteAvatar || character === this.game.character) return;
    this.remoteAvatar.setConnected(connected);
    if (this.charactersHidden) this.remoteAvatar.object3D.visible = false;
  }
  setCharactersHidden(hidden = true) {
    this.charactersHidden = hidden;
    if (this.remoteAvatar) this.remoteAvatar.object3D.visible = !hidden && this.remoteAvatar.connected;
    this.previewAvatars.forEach((avatar) => {
      avatar.object3D.visible = !hidden;
    });
  }
  setIdentity({ character, displayName }) {
    if (character !== this.game.character) {
      this.identity = { character, displayName };
      this.remoteAvatar?.setName(displayName);
    }
  }
  dispose() {
    this.remoteAvatar?.dispose();
    this.previewAvatars.forEach((avatar) => avatar.dispose());
  }
}
