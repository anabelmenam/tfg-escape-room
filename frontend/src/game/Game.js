import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { Input } from "./Input.js";
import { Player } from "./Player.js";
import { InteractionManager } from "./InteractionManager.js";
import { CollisionManager } from "./CollisionManager.js";
import { InteractableManager } from "./InteractableManager.js";
import { GameState } from "./GameState.js";
import { EventManager } from "./EventManager.js";
import { EntityManager } from "./EntityManager.js";
import { GameAudio } from "./GameAudio.js";
import { startEndingHouseTour, updateEndingTour } from "./ending/EndingTour.js";
import { startEndingExit, updateEndingExit } from "./ending/EndingExit.js";
import { InventoryController } from "./controllers/InventoryController.js";
import { FlashlightController } from "./controllers/FlashlightController.js";
import { MultiplayerSync } from "./controllers/MultiplayerSync.js";
import { GameInputController } from "./controllers/GameInputController.js";
import { initializeGameLevel } from "./initializeGameLevel.js";
import { preloadGameImages } from "./preloadGameImages.js";

export class Game {
  constructor(container, playerRole = "A", options = {}) {
    const {
      onDoorUnlocked, onHallwayAction, onBedroomAction, onChildrenRoomAction, onKitchenAction,
      onLivingRoomAction, onBathroomAction, onPlayerMovement = null, onDiaryEntriesChanged = null,
      onEndingChange = null, onReady = null, onPauseRequest = null, audioController = null,
      testArea = null, testMode = false, isAdmin = false, endingPreview = false, initialCheckpoint = null,
    } = options;
    Object.assign(this, {
      container, playerRole, testArea, testMode, isAdmin, endingPreview, onDoorUnlocked, onHallwayAction,
      onBedroomAction, onChildrenRoomAction, onKitchenAction, onLivingRoomAction, onBathroomAction,
      onPlayerMovement, onDiaryEntriesChanged, onEndingChange, onReady, onPauseRequest,
    });
    this.pendingCheckpoint = initialCheckpoint;
    this.character = null;
    this.endingCinematic = null;
    this.endingTour = null;
    this.ready = false;
    this.paused = false;
    this.sharedState = null;
    this.applyingSharedState = false;
    this.localJournalEntries = testMode
      ? Array.from({ length: 10 }, (_, index) => `family-note-${String(index + 1).padStart(2, "0")}`)
      : [];
    this.roomData = null;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, .1, 1000);
    this.camera.position.set(200, 100, 0);
    this.gameAudio = audioController ?? new GameAudio();
    this.ownsGameAudio = !audioController;
    this.setupLoadingManager();
    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .3;
    this.normalPixelRatio = Math.min(window.devicePixelRatio, 2);
    this.backgroundPixelRatio = Math.min(window.devicePixelRatio, .8);
    this.backgroundPerformanceMode = false;
    this.lastRenderedAt = 0;
    this.renderer.setPixelRatio(this.normalPixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.lockRaycaster = new THREE.Raycaster();
    this.lockMouse = new THREE.Vector2();
    this.input = new Input();
    this.collisionManager = new CollisionManager();
    this.player = new Player(this.camera, this.renderer.domElement, this.input, this.collisionManager);
    this.gameState = new GameState();
    this.gameState.set("living-room-switch", false);
    this.eventManager = new EventManager();
    this.entityManager = new EntityManager();
    this.interactableManager = new InteractableManager();
    this.interactionManager = new InteractionManager({ camera: this.camera, interactableManager: this.interactableManager, player: this.player });

    this.flashlightController = new FlashlightController(this);
    this.multiplayer = new MultiplayerSync(this);
    this.inventoryController = new InventoryController(this);
    this.inputController = new GameInputController(this);
    this.setupWindowEvents();
    this.rafId = 0;
    this.environmentTexture = null;
    this.loop = this.loop.bind(this);
    void this.init();
    this.loop();
  }

  get flashlightOn() { return this.flashlightController.active; }
  get flashlight() { return this.flashlightController.light; }
  get flashlightTarget() { return this.flashlightController.target; }
  get remoteEcho() { return this.multiplayer.remoteEcho; }
  get previewEchoes() { return this.multiplayer.previewEchoes; }

  setupLoadingManager() {
    this.loadingProgress = { loaded: 0, total: 0 };
    this.loadingManagerHandlers = { onStart: THREE.DefaultLoadingManager.onStart, onProgress: THREE.DefaultLoadingManager.onProgress };
    THREE.DefaultLoadingManager.onStart = (url, loaded, total) => { this.loadingProgress = { loaded, total }; this.loadingManagerHandlers.onStart?.(url, loaded, total); };
    THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => { this.loadingProgress = { loaded, total }; this.loadingManagerHandlers.onProgress?.(url, loaded, total); };
  }

  setupWindowEvents() {
    this._onResize = () => this.resize();
    this._onWindowBlur = () => this.setBackgroundPerformanceMode(true);
    this._onWindowFocus = () => this.setBackgroundPerformanceMode(false);
    this._onVisibilityChange = () => this.setBackgroundPerformanceMode(document.hidden || !document.hasFocus());
    window.addEventListener("resize", this._onResize);
    window.addEventListener("blur", this._onWindowBlur);
    window.addEventListener("focus", this._onWindowFocus);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
  }

  async loadEnvironment() {
    try {
      const texture = await new HDRLoader().loadAsync("/hdr/background5.hdr");
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
    await Promise.all([this.loadEnvironment(), this.gameAudio.load(), preloadGameImages()]);
    await initializeGameLevel(this);
    await this.waitForAssets();
    this.ready = true;
    this.onReady?.();
  }

  waitForAssets() {
    return new Promise((resolve) => {
      let stableFrames = 0;
      const check = () => {
        const { loaded, total } = this.loadingProgress;
        stableFrames = total === 0 || loaded >= total ? stableFrames + 1 : 0;
        if (stableFrames >= 3) resolve(); else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  pause() {
    if (!this.ready || this.paused) return;
    this.paused = true;
    this.player.orbitControls.enabled = false;
    if (this.player.fpControls.isLocked) this.player.fpControls.unlock();
  }
  resume({ lockPointer = true } = {}) {
    if (!this.ready || !this.paused) return;
    this.paused = false;
    if (this.player.isFirstPerson && lockPointer) this.player.requestPointerLock();
    else if (!this.player.isFirstPerson) this.player.orbitControls.enabled = true;
  }

  applySharedState(state) {
    if (!state) return;
    this.sharedState = state;
    if (!this.roomData || !this.character) return;
    this.applyingSharedState = true;
    this.roomData.hallway?.applyHallwayState(state);
    this.roomData.bedroom?.applyBedroomState(state);
    this.roomData.childrenRoom?.applyChildrenRoomState(state);
    this.roomData.kitchen?.applyKitchenState(state);
    this.roomData.livingRoom?.applyLivingRoomState(state);
    this.roomData.bathroom?.applyBathroomState(state);
    const currentItems = new Map(this.player.inventory.getAll().filter(Boolean).map((item) => [item.id, item]));
    const worldItems = new Map((this.roomData.entities ?? []).filter((entity) => entity?.id).map((entity) => [entity.id, entity]));
    const restoredItems = (state.inventories?.[this.character] ?? [])
      .map((id) => currentItems.get(id) ?? worldItems.get(id))
      .filter(Boolean);
    restoredItems.forEach((item) => {
      item.object3D.visible = false;
      item.setEnabled?.(false);
    });
    this.player.inventory.restore(restoredItems);
    this.roomData.storyNotes?.forEach((note) => note.setCollected(state.journalEntries?.includes(note.id) ?? false));
    this.onDiaryEntriesChanged?.([...(state.journalEntries ?? [])].sort());
    this.onEndingChange?.(state.ending ?? null);
    if (state.characters?.mum?.puzzles?.["children-globe"]?.solved) this.player.inventory.remove("children-photo-order-note");
    if (state.characters?.dad?.puzzles?.["kitchen-recipe"]?.solved) this.player.inventory.remove("kitchen-recipe-note");
    if (state.characters?.mum?.puzzles?.["bedroom-radio"]?.solved) this.player.inventory.remove("bedroom-radio-note");
    if (state.characters?.dad?.puzzles?.["bedroom-electrical-panel"]?.solved) this.player.inventory.remove("bedroom-electrical-plan");
    const doorState = state.characters?.[this.character]?.objects?.["bedroom-exit-door"];
    if (doorState) {
      const door = this.roomData.door;
      if (doorState.locked === false) door.unlock({ notify: false });
      if (doorState.open) door.open();
    }
    for (const entity of this.roomData.entities ?? []) {
      const objectState = state.characters?.[this.character]?.objects?.[entity?.id];
      if (!objectState) continue;
      if (typeof objectState.active === "boolean" && typeof entity.setActive === "function" && entity.active !== objectState.active) {
        entity.setActive(objectState.active);
        entity.onPress?.(entity);
      }
      if (typeof objectState.open === "boolean" && typeof entity.open === "function" && typeof entity.close === "function") {
        if (objectState.open && !entity.isOpen) entity.open();
        else if (!objectState.open && entity.isOpen) entity.close();
      }
    }
    this.applyingSharedState = false;
  }

  applyCheckpoint(checkpoint) {
    if (!checkpoint?.position) return;
    this.pendingCheckpoint = checkpoint;
    if (!this.roomData || !this.ready) return;
    const { x, y, z } = checkpoint.position;
    if (![x, y, z].every(Number.isFinite)) return;
    this.camera.position.set(x, y, z);
    if (Number.isFinite(checkpoint.rotationY)) {
      const direction = new THREE.Vector3(-Math.sin(checkpoint.rotationY), 0, -Math.cos(checkpoint.rotationY));
      this.player.setLookAt(this.camera.position.clone().add(direction));
    }
    this.collisionManager.previousPosition = this.camera.position.clone();
    this.pendingCheckpoint = null;
  }

  startEndingExit(onComplete, onMoveStart = null) { startEndingExit(this, onComplete, onMoveStart); }
  updateEndingCinematic(delta) { updateEndingExit(this, delta); }
  startEndingHouseTour(callbacks = {}) { startEndingHouseTour(this, callbacks); }
  updateEndingTour(delta) { updateEndingTour(this, delta); }
  updateRemotePlayer(movement) { this.multiplayer.updateRemote(movement); }
  setRemotePlayerConnected(status) { this.multiplayer.setConnected(status); }
  setRemotePlayerIdentity(identity) { this.multiplayer.setIdentity(identity); }
  updateInventoryUI() { this.inventoryController.updateUI(); }
  inspectSelectedInventoryItem(keyCode) { this.inventoryController.inspectSelected(keyCode); }
  closeInventoryInspection() { this.inventoryController.closeInspection(); }
  toggleFlashlight() { this.flashlightController.toggle(); }
  updateFlashlight() { this.flashlightController.update(); }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  setBackgroundPerformanceMode(enabled) {
    if (this.backgroundPerformanceMode === enabled) return;
    this.backgroundPerformanceMode = enabled;
    this.lastRenderedAt = 0;
    this.renderer.setPixelRatio(enabled ? this.backgroundPixelRatio : this.normalPixelRatio);
    this.resize();
  }

  loop() {
    this.rafId = requestAnimationFrame(this.loop);
    const now = performance.now();
    if (this.backgroundPerformanceMode && now - this.lastRenderedAt < 1000 / 15) return;
    this.lastRenderedAt = now;
    this.timer.update();
    const delta = this.timer.getDelta();
    if (this.ready && !this.paused) {
      const endingActive = Boolean(this.endingCinematic || this.endingTour);
      if (!endingActive) this.player.update(delta);
      this.updateEndingCinematic(delta);
      this.updateEndingTour(delta);
      if (!endingActive) this.interactionManager.update();
      this.entityManager.update(delta);
      this.multiplayer.update(delta, endingActive);
      this.updateFlashlight();
      const moving = !endingActive && ["KeyW", "KeyA", "KeyS", "KeyD"].some((code) => this.input.isPressed(code));
      const running = this.input.isPressed("ControlLeft") || this.input.isPressed("ControlRight");
      this.gameAudio.updateFootsteps(delta, { moving: moving && this.player.isFirstPerson && !this.player.isFocused, running, crouching: this.player.isCrouching, grounded: this.player.isGrounded });
    }
    if (this.player.focusedObject?.exitFocusRequested) { this.player.focusedObject.exitFocusRequested = false; this.player.exitFocus(); }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("blur", this._onWindowBlur);
    window.removeEventListener("focus", this._onWindowFocus);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    this.inputController.dispose();
    this.inventoryController.dispose();
    this.input.dispose();
    this.interactionManager.dispose();
    this.interactableManager.dispose();
    this.entityManager.dispose();
    this.multiplayer.dispose();
    if (this.ownsGameAudio) this.gameAudio.dispose();
    THREE.DefaultLoadingManager.onStart = this.loadingManagerHandlers.onStart;
    THREE.DefaultLoadingManager.onProgress = this.loadingManagerHandlers.onProgress;
    this.timer.disconnect();
    this.environmentTexture?.dispose();
    this.environmentTexture = null;
    this.scene.background = null;
    this.scene.environment = null;
    if (this.renderer.domElement.parentNode === this.container) this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}
