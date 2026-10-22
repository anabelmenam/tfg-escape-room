import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Inventory } from "./Inventory.js";
import * as THREE from "three";
export class Player {
  constructor(camera, domElement, input, collisionManager) {
    this.camera = camera;
    this.domElement = domElement;
    this.input = input;
    this.collisionManager = collisionManager;

    this.isFirstPerson = true;
    this.walkSpeed = 12;
    this.runSpeed = 20;
    this.crouchSpeed = 5;
    this.crouchCameraOffset = 1.3;
    this.crouchTransitionSpeed = 12;
    this.isCrouching = false;
    this.currentCrouchOffset = 0;

    this.inventory = new Inventory();

    this.orbitControls = new OrbitControls(camera, domElement);

    this.orbitControls.enableDamping = true;
    this.orbitControls.target.set(0, 0, 0);
    this.orbitControls.enabled = false;

    this.verticalVelocity = 0;
    this.gravity = 24;
    this.jumpForce = 12;
    this.isGrounded = true;

    this.isFocused = false;
    this.focusedObject = null;
    this.focusPreviousPosition = new THREE.Vector3();
    this.focusPreviousQuaternion = new THREE.Quaternion();
    this.focusPreviousUp = new THREE.Vector3();

    this.fpControls = new PointerLockControls(camera, domElement);
    this.fpControls.addEventListener("lock", () => {
      if (!this.isFocused && this.isFirstPerson) {
        this.domElement.style.cursor = "none";
        const crosshair = document.getElementById("crosshair");
        crosshair?.classList.remove("hidden");
        crosshair?.classList.add("border-white-400");
        crosshair?.classList.remove("border-white");
      }
    });
    this.fpControls.addEventListener("unlock", () => {
      if (this.isFocused || this.isFirstPerson) {
        this.domElement.style.cursor = "default";
        document.getElementById("crosshair")?.classList.add("hidden");
      }
    });
  }

  setLookAt(position) {
    this.orbitControls.target.copy(position);
    this.camera.lookAt(position);
    this.orbitControls.update();
  }

  setMouseSensitivity(sensitivity) {
    this.fpControls.pointerSpeed = THREE.MathUtils.clamp(sensitivity, 0.2, 2);
  }

  focusObject(object) {
    if (this.isFocused) {
      return;
    }

    this.isFocused = true;
    this.focusedObject = object;
    this.focusPreviousPosition.copy(this.camera.position);
    this.focusPreviousQuaternion.copy(this.camera.quaternion);
    this.focusPreviousUp.copy(this.camera.up);
    object.setFocused?.(true);
    this.orbitControls.enabled = false;

    document.getElementById("crosshair")?.classList.add("hidden");
    const interactionText = document.getElementById("interaction-text");
    if (interactionText) {
      interactionText.textContent = object.getFocusHint?.() ?? "[E] Salir";
      interactionText.classList.remove("hidden");
    }
    this.domElement.style.cursor = "default";

    if (this.fpControls.isLocked) {
      this.fpControls.unlock();
    }
    this.camera.position.copy(object.getFocusPosition());
    this.camera.up.copy(object.getFocusUp?.() ?? new THREE.Vector3(0, 1, 0));
    this.camera.lookAt(object.getLookAtPosition());
  }

  exitFocus() {
    if (!this.focusedObject) {
      return;
    }

    this.focusedObject.setFocused?.(false);
    this.camera.position.copy(this.focusPreviousPosition);
    this.camera.quaternion.copy(this.focusPreviousQuaternion);
    this.camera.up.copy(this.focusPreviousUp);
    this.focusedObject = null;
    this.isFocused = false;
    const interactionText = document.getElementById("interaction-text");
    if (interactionText) {
      interactionText.textContent = "";
      interactionText.classList.add("hidden");
    }

    if (this.isFirstPerson) {
      this.requestPointerLock();
    } else {
      this.orbitControls.enabled = true;
      this.domElement.style.cursor = "default";
    }
  }

  setMode(firstPerson) {
    this.isFirstPerson = firstPerson;

    const crosshair = document.getElementById("crosshair");

    if (this.isFirstPerson) {
      this.orbitControls.enabled = false;
      crosshair?.classList.add("border-white-400");
      crosshair?.classList.remove("border-white");
      this.requestPointerLock();
    } else {
      this.fpControls.unlock();

      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      this.orbitControls.target.copy(this.camera.position).add(direction.multiplyScalar(10));

      this.orbitControls.enabled = true;
      this.domElement.style.cursor = "default";

      crosshair?.classList.add("hidden");
      crosshair?.classList.remove("border-white-400");
      crosshair?.classList.add("border-white");
    }
  }

  toggleMode() {
    this.setMode(!this.isFirstPerson);
  }

  toggleCrouch() {
    if (!this.isFocused) {
      this.isCrouching = !this.isCrouching;
    }
  }

  requestPointerLock() {
    if (this.isFirstPerson && !this.isFocused && !this.fpControls.isLocked) {
      this.domElement.style.cursor = "default";
      document.getElementById("crosshair")?.classList.add("hidden");
      this.fpControls.lock();
    }
  }

  hasSelected(id) {
    return this.inventory.hasSelected(id);
  }

  removeItemFromInventory(id) {
    return this.inventory.remove(id);
  }

  selectInventorySlot(index) {
    this.inventory.select(index);
  }

  update(delta) {
    if (this.isFocused) {
      return;
    }

    if (!this.isFirstPerson) {
      this.orbitControls.update();
      return;
    }

    const previousCrouchOffset = this.currentCrouchOffset;
    const targetCrouchOffset = this.isCrouching ? this.crouchCameraOffset : 0;
    this.currentCrouchOffset = THREE.MathUtils.damp(
      this.currentCrouchOffset,
      targetCrouchOffset,
      this.crouchTransitionSpeed,
      delta,
    );

    if (this.isGrounded) {
      this.camera.position.y += previousCrouchOffset - this.currentCrouchOffset;
    }

    const isRunning = this.input.isPressed("ControlLeft") || this.input.isPressed("ControlRight");
    const standingSpeed = isRunning ? this.runSpeed : this.walkSpeed;
    const speed = this.isCrouching ? this.crouchSpeed : standingSpeed;
    const movement = speed * delta;

    if (this.input.isPressed("KeyW")) {
      this.fpControls.moveForward(movement);
    }

    if (this.input.isPressed("KeyS")) {
      this.fpControls.moveForward(-movement);
    }

    if (this.input.isPressed("KeyA")) {
      this.fpControls.moveRight(-movement);
    }

    if (this.input.isPressed("KeyD")) {
      this.fpControls.moveRight(movement);
    }

    if (this.input.isPressed("Space") && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;

      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * delta;
    }

    this.camera.position.y += this.verticalVelocity * delta;
    const collisionResult = this.collisionManager.resolvePlayerCollision(this.camera, this.currentCrouchOffset);

    if (collisionResult?.isGrounded) {
      this.isGrounded = true;

      if (this.verticalVelocity < 0) {
        this.verticalVelocity = 0;
      }
    }
  }
}
