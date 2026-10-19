import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { Input } from "./Input.js";
import { Player } from "./Player.js";
import { InteractionManager } from "./InteractionManager.js";
import { CollisionManager } from "./CollisionManager.js";
import { InteractableManager } from "./InteractableManager.js";
import { GameState } from "./GameState";
import { EventManager } from "./EventManager.js";
import { EntityManager } from "./EntityManager.js";
import { createLevel1 } from "../world/levels/createLevel1.js";
import { tItem } from "../translations/index.js";

export class Game {
  constructor(container, playerRole = "A", { onDoorUnlocked, onHallwayAction, onBedroomAction, onLivingRoomAction, onBathroomAction, testArea = null, testMode = false } = {}) {
    this.playerRole = playerRole;
    this.testArea = testArea;
    this.timeline = null;
    this.onDoorUnlocked = onDoorUnlocked;
    this.onHallwayAction = onHallwayAction;
    this.onBedroomAction = onBedroomAction;
    this.onLivingRoomAction = onLivingRoomAction;
    this.onBathroomAction = onBathroomAction;
    this.testMode = testMode;
    this.sharedState = null;
    this.roomData = null;
    this.container = container;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(200, 100, 0);
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);

    this.timer = new THREE.Timer();
    this.timer.connect(document);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.lockRaycaster = new THREE.Raycaster();
    this.lockMouse = new THREE.Vector2();

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.3;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    this.flashlight = new THREE.SpotLight(0xfff0c2, 65, 45, Math.PI / 7, 0.35, 1.1);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlight.visible = false;
    this.flashlight.target = this.flashlightTarget;
    this.flashlightOn = false;
    this.scene.add(this.flashlight, this.flashlightTarget);

    container.appendChild(this.renderer.domElement);

    this.input = new Input();
    this.collisionManager = new CollisionManager();
    this.player = new Player(this.camera, this.renderer.domElement, this.input, this.collisionManager);
    this.player.inventory.onChange = () => {
      this.updateInventoryUI();
    };
    this.inventoryInspectionOpen = false;
    this.inventoryInspectionKey = null;
    this.updateInventoryUI();
    this.gameState = new GameState();
    this.gameState.set("living-room-switch", false);

    this.eventManager = new EventManager();
    this.entityManager = new EntityManager();
    this.interactableManager = new InteractableManager();
    this.interactionManager = new InteractionManager({
      camera: this.camera,
      interactableManager: this.interactableManager,
      player: this.player,
    });

    this._onKeyDown = (event) => {
      void this.audioListener.context.resume().catch(() => {});
      if (this.inventoryInspectionOpen) {
        return;
      }

      if (this.player.isFocused) {
        if (this.player.focusedObject?.handleKey?.(event.code)) { event.preventDefault(); return; }
        if (event.code === "Escape" || event.code === "KeyE") {
          event.preventDefault();
          this.player.focusedObject?.closePanel?.();
          this.player.exitFocus();
        }
        return;
      }

      if ((event.code === "ShiftLeft" || event.code === "ShiftRight") && !event.repeat) {
        this.player.toggleCrouch();
        return;
      }

      if (!this.player.isFocused) {
        if (event.code === "KeyI" || event.code === "KeyR") {
          this.inspectSelectedInventoryItem(event.code);
          return;
        }
        if (event.code === "KeyQ") {
          this.toggleFlashlight();
          return;
        }
        if (event.code === "KeyF") {
          this.player.toggleMode();
        }
        if (event.code === "KeyE" && !event.repeat) {
          this.interactionManager.use();
        }
        if (event.code === "Digit1") {
          this.player.selectInventorySlot(0);
        }

        if (event.code === "Digit2") {
          this.player.selectInventorySlot(1);
        }

        if (event.code === "Digit3") {
          this.player.selectInventorySlot(2);
        }

        if (event.code === "Digit4") {
          this.player.selectInventorySlot(3);
        }

        if (event.code === "Digit5") {
          this.player.selectInventorySlot(4);
        }
      }
    };

    window.addEventListener("keydown", this._onKeyDown);

    this._onWheel = (event) => {
      const inventory = this.player.inventory;

      if (!inventory) {
        return;
      }

      let newIndex = inventory.selectedIndex;

      if (event.deltaY > 0) {

        newIndex++;
      } else if (event.deltaY < 0) {

        newIndex--;
      }

      if (newIndex >= inventory.size) {
        newIndex = 0;
      }

      if (newIndex < 0) {
        newIndex = inventory.size - 1;
      }

      inventory.select(newIndex);
    };

    window.addEventListener("wheel", this._onWheel);

    this._onInspectionClose = () => this.closeInventoryInspection();
    document.getElementById("inventory-inspection-close")?.addEventListener("click", this._onInspectionClose);

    this._onClick = (event) => {
      void this.audioListener.context.resume().catch(() => {});
      if (!this.player.isFocused) {
        this.player.requestPointerLock();
        return;
      }

      const focusedObject = this.player.focusedObject;
      if (!focusedObject) {
        return;
      }

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.lockMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.lockMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.lockRaycaster.setFromCamera(this.lockMouse, this.camera);

      const intersections = this.lockRaycaster.intersectObjects(focusedObject.object3D.children, true);
      if (intersections.length === 0) {
        return;
      }

      const hit = intersections[0].object;
      const digitIndex = hit.userData.lockDigitIndex ?? hit.userData.safeDigitIndex;
      const photoFragmentSlot = hit.userData.photoFragmentSlot;
      const sewingSpoolSlot = hit.userData.sewingSpoolSlot;
      const electricalSwitchIndex = hit.userData.electricalSwitchIndex;
      const emberIndex = hit.userData.emberIndex;
      const radioDialIndex = hit.userData.radioDialIndex;
      const clockHand = hit.userData.clockHand;

      if (clockHand !== undefined) {
        focusedObject.advanceHand?.(clockHand);
        return;
      }

      if (photoFragmentSlot !== undefined) {
        focusedObject.selectFragment?.(photoFragmentSlot);
        return;
      }

      if (sewingSpoolSlot !== undefined) {
        focusedObject.selectSpool?.(sewingSpoolSlot);
        return;
      }

      if (electricalSwitchIndex !== undefined) {
        focusedObject.toggleSwitch?.(electricalSwitchIndex);
        return;
      }
      if (emberIndex !== undefined) {
        focusedObject.rotateEmber?.(emberIndex);
        return;
      }

      if (radioDialIndex !== undefined) {
        focusedObject.incrementDial?.(radioDialIndex);
        return;
      }

      if (digitIndex === undefined) {
        return;
      }

      if (typeof focusedObject.incrementDigit === "function") {
        focusedObject.incrementDigit(digitIndex);
      } else {
        focusedObject.changeDigit?.(digitIndex);
      }
    };

    this.renderer.domElement.addEventListener("click", this._onClick);

    this._onResize = () => {
      this.resize();
    };

    window.addEventListener("resize", this._onResize);
    this.rafId = 0;
    this.environmentTexture = null;
    this.loop = this.loop.bind(this);
    this.init();
    this.loop();
  }

  async loadEnvironment() {
    const hdrLoader = new HDRLoader();

    try {
      const texture = await hdrLoader.loadAsync("/hdr/background5.hdr");
      texture.mapping = THREE.EquirectangularReflectionMapping;

      this.environmentTexture = texture;
      this.scene.background = this.playerRole !== "C" ? texture : null;
      this.scene.environment = texture;

      return texture;
    } catch (error) {
      console.error("No se pudo cargar el fondo HDR:", error);
      this.scene.background = new THREE.Color(0x101820);

      return null;
    }
  }

  async init() {
    await this.loadEnvironment();

    const roomData = await createLevel1({
      playerRole: this.playerRole,
      testArea: this.testArea,
      testMode: this.testMode,
      onSwitchPress: (lightSwitch) => {
        const active = this.gameState.toggle(lightSwitch.id);
        lightSwitch.setActive(active);
        this.eventManager.emit("buttonPressed", {
          id: lightSwitch.id,
          active,
        });
      },
      eventManager: this.eventManager,
      onDoorOpenChange: (isOpen) => {
        this.collisionManager.setDoorOpen(isOpen);
      },
      onDoorUnlocked: () => {
        if (this.timeline === "past") this.onDoorUnlocked?.();
      },
      onHallwayAction: this.onHallwayAction,
      onBedroomAction: this.onBedroomAction,
      onLivingRoomAction: this.onLivingRoomAction,
      onBathroomAction: this.onBathroomAction,
      onObjectFocus: (object) => {
        this.player.focusObject(object);
      },
    });

    this.roomData = roomData;
    if (this.testArea && roomData.hallway?.maze) roomData.hallway.maze.available = true;
    this.timeline = roomData.timeline ?? null;
    this.scene.userData.timeline = this.timeline;

    for (const entity of roomData.entities ?? []) {
      entity.setAudioListener?.(this.audioListener);
      this.entityManager.add(entity);
    }

    this.collisionManager.setObjectColliders(roomData.objectColliders ?? []);
    this.collisionManager.setWallColliders(roomData.wallColliders ?? []);

    this.scene.add(roomData.room);
    roomData.room.updateMatrixWorld(true);
    this.interactionManager.setOccluders(roomData.roomColliders ?? []);

    this.camera.position.copy(roomData.spawnPosition);
    this.collisionManager.previousPosition = this.camera.position.clone();

    if (roomData.spawnLookAt) {
      this.player.setLookAt(roomData.spawnLookAt);
    }

    this.collisionManager.setRoomBounds(roomData.bounds);

    this.collisionManager.setDoorPassage(roomData.doorPassage);
    this.collisionManager.setExteriorBounds(roomData.exteriorBounds);
    if (this.testArea && this.testArea !== "bedroom" && this.testArea !== "icons") {
      this.collisionManager.isOutsideRoom = true;
      this.collisionManager.previousPosition = this.camera.position.clone();
    }

    for (const interactable of roomData.interactables ?? []) {
      this.interactableManager.add(interactable);
    }

    this.applySharedState(this.sharedState);
  }

  applySharedState(state) {
    if (!state) return;
    this.sharedState = state;
    if (!this.roomData || !this.timeline) return;
    this.roomData.hallway?.applyHallwayState(state);
    this.roomData.bedroom?.applyBedroomState(state);
    this.roomData.livingRoom?.applyLivingRoomState(state);
    this.roomData.bathroom?.applyBathroomState(state);
    const doorState = state.timelines?.[this.timeline]?.objects?.["bedroom-exit-door"];
    if (!doorState) return;
    const door = this.roomData.door;
    if (doorState.locked === false) door.unlock({ notify: false });
    if (doorState.open) door.open();
  }

  updateInventoryUI() {
    const inventory = this.player.inventory;
    const selectedName = document.getElementById("inventory-selected-name");
    const selectedItem = inventory.getSelectedItem();

    if (selectedName) {
      selectedName.textContent = selectedItem ? tItem(selectedItem.itemName ?? selectedItem.id) : "";
      selectedName.classList.toggle("hidden", !selectedItem);
    }

    for (let i = 0; i < inventory.size; i++) {
      const slotElement = document.getElementById(`inventory-slot-${i}`);
      const itemElement = document.getElementById(`inventory-item-${i}`);

      if (!slotElement || !itemElement) {
        continue;
      }

      const item = inventory.items[i];
      itemElement.innerHTML = "";

      if (i === inventory.selectedIndex) {
        slotElement.classList.remove("border-white/50");
        slotElement.classList.add("border-yellow-400");
      } else {
        slotElement.classList.remove("border-yellow-400");
        slotElement.classList.add("border-white/50");
      }

      if (!item) {
        continue;
      }

      if (item.inventoryIcon) {
        const image = document.createElement("img");

        image.src = item.inventoryIcon;
        image.alt = item.id;
        image.className = "h-12 w-12 object-contain";

        itemElement.appendChild(image);
      } else {
        const name = document.createElement("span");

        name.textContent = tItem(item.id);
        name.className = "px-1 text-center text-xs text-white";

        itemElement.appendChild(name);
      }
    }
  }

  inspectSelectedInventoryItem(keyCode) {
    const item = this.player.inventory.getSelectedItem();

    const inspectionKey = item?.inventoryInspectionKey ?? "KeyI";
    if (!item?.inspectionImage || inspectionKey !== keyCode) {
      return;
    }

    const panel = document.getElementById("inventory-inspection");
    const image = document.getElementById("inventory-inspection-image");
    const title = document.getElementById("inventory-inspection-title");
    const hint = document.getElementById("inventory-inspection-hint");

    if (!panel || !image || !title || !hint) {
      return;
    }

    image.src = item.inspectionImage;
    image.alt = item.inspectionTitle ?? tItem(item.id);
    title.textContent = item.inspectionTitle ?? tItem(item.id);
    hint.textContent = "Pulsa la × para cerrar";
    this.inventoryInspectionOpen = true;
    this.inventoryInspectionKey = inspectionKey;
    panel.classList.remove("hidden");
    panel.classList.add("flex");

    if (this.player.fpControls.isLocked) {
      this.player.fpControls.unlock();
    }
  }

  closeInventoryInspection() {
    if (!this.inventoryInspectionOpen) {
      return;
    }

    const panel = document.getElementById("inventory-inspection");
    panel?.classList.add("hidden");
    panel?.classList.remove("flex");
    this.inventoryInspectionOpen = false;
    this.inventoryInspectionKey = null;

    if (this.player.isFirstPerson && !this.player.isFocused) {
      this.player.requestPointerLock();
    }
  }

  toggleFlashlight() {
    if (!this.player.inventory.has("flashlight")) {
      return;
    }

    this.flashlightOn = !this.flashlightOn;
    this.flashlight.visible = this.flashlightOn;
  }

  updateFlashlight() {
    if (!this.flashlightOn) {
      return;
    }

    const offset = new THREE.Vector3(0.18, -0.14, -0.08).applyQuaternion(this.camera.quaternion);
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.flashlight.position.copy(this.camera.position).add(offset);
    this.flashlightTarget.position.copy(this.flashlight.position).addScaledVector(direction, 18);
    this.flashlightTarget.updateMatrixWorld();
  }

  resize() {
    const width = this.container.clientWidth;

    const height = this.container.clientHeight;

    if (!width || !height) {
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  loop() {
    this.rafId = requestAnimationFrame(this.loop);
    this.timer.update();

    const delta = this.timer.getDelta();
    this.player.update(delta);
    this.interactionManager.update();
    this.entityManager.update(delta);
    this.updateFlashlight();

    if (this.player.focusedObject?.exitFocusRequested) {
      this.player.focusedObject.exitFocusRequested = false;
      this.player.exitFocus();
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("keydown", this._onKeyDown);
    document.getElementById("inventory-inspection-close")?.removeEventListener("click", this._onInspectionClose);
    this.input.dispose();
    this.interactionManager.dispose();
    this.interactableManager.dispose();
    this.entityManager.dispose();
    this.camera.remove(this.audioListener);
    this.audioListener.gain.disconnect();

    this.timer.disconnect();

    if (this.environmentTexture) {
      this.environmentTexture.dispose();
      this.environmentTexture = null;
    }

    this.scene.background = null;
    this.scene.environment = null;

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.renderer.domElement.removeEventListener("click", this._onClick);

    this.renderer.dispose();
  }
}
