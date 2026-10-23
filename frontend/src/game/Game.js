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
import { GameAudio } from "./GameAudio.js";
import { createLevel1 } from "../world/levels/createLevel1.js";
import { t, tItem } from "../translations/index.js";
import { TemporalEcho } from "./TemporalEcho.js";

export class Game {
  constructor(container, playerRole = "A", { onDoorUnlocked, onHallwayAction, onBedroomAction, onChildrenRoomAction, onKitchenAction, onLivingRoomAction, onBathroomAction, onPlayerMovement = null, onDiaryEntry = null, onEndingChange = null, onReady = null, onPauseRequest = null, audioController = null, testArea = null, testMode = false, endingPreview = false } = {}) {
    this.playerRole = playerRole;
    this.testArea = testArea;
    this.timeline = null;
    this.onDoorUnlocked = onDoorUnlocked;
    this.onHallwayAction = onHallwayAction;
    this.onBedroomAction = onBedroomAction;
    this.onChildrenRoomAction = onChildrenRoomAction;
    this.onKitchenAction = onKitchenAction;
    this.onLivingRoomAction = onLivingRoomAction;
    this.onBathroomAction = onBathroomAction;
    this.onPlayerMovement = onPlayerMovement;
    this.onDiaryEntry = onDiaryEntry;
    this.onEndingChange = onEndingChange;
    this.movementBroadcastElapsed = 0;
    this.movementHeartbeatElapsed = 0;
    this.lastBroadcastPosition = new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0);
    this.lastBroadcastRotationY = Number.POSITIVE_INFINITY;
    this.remoteEcho = null;
    this.previewEchoes = [];
    this.remotePlayerIdentity = null;
    this.testMode = testMode;
    this.endingPreview = endingPreview;
    this.endingCinematic = null;
    this.endingTour = null;
    this.onReady = onReady;
    this.onPauseRequest = onPauseRequest;
    this.ready = false;
    this.paused = false;
    this.sharedState = null;
    this.roomData = null;
    this.container = container;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(200, 100, 0);
    this.gameAudio = audioController ?? new GameAudio();
    this.ownsGameAudio = !audioController;
    this.loadingProgress = { loaded: 0, total: 0 };
    this.loadingManagerHandlers = {
      onStart: THREE.DefaultLoadingManager.onStart,
      onProgress: THREE.DefaultLoadingManager.onProgress,
    };
    THREE.DefaultLoadingManager.onStart = (url, loaded, total) => {
      this.loadingProgress = { loaded, total };
      this.loadingManagerHandlers.onStart?.(url, loaded, total);
    };
    THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
      this.loadingProgress = { loaded, total };
      this.loadingManagerHandlers.onProgress?.(url, loaded, total);
    };

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
    this.normalPixelRatio = Math.min(window.devicePixelRatio, 2);
    this.backgroundPixelRatio = Math.min(window.devicePixelRatio, .8);
    this.backgroundPerformanceMode = false;
    this.lastRenderedAt = 0;
    this.renderer.setPixelRatio(this.normalPixelRatio);
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
    this.knownInventoryIds = new Set();
    this.player.inventory.onChange = (inventory) => {
      const currentIds = new Set(inventory.getAll().filter(Boolean).map((item) => item.id));
      const pickedUpItem = [...currentIds].some((id) => !this.knownInventoryIds.has(id));
      const diaryIds = new Set(["bedroom-radio-note", "bedroom-electrical-plan", "children-photo-order-note", "kitchen-recipe-note", "living-room-vitrine-letter"]);
      [...currentIds].filter((id) => !this.knownInventoryIds.has(id) && diaryIds.has(id)).forEach((id) => this.onDiaryEntry?.(id));
      this.knownInventoryIds = currentIds;
      if (this.ready && pickedUpItem) this.gameAudio.playPickup();
      this.updateInventoryUI();
    };
    this._onPointerUnlock = () => {
      if (this.ready && !this.paused && !this.inventoryInspectionOpen && !this.player.isFocused && this.player.isFirstPerson) {
        this.onPauseRequest?.();
      }
    };
    this.player.fpControls.addEventListener("unlock", this._onPointerUnlock);
    this.inventoryInspectionOpen = false;
    this.inventoryInspectionKey = null;
    this.updateInventoryUI();
    this._onLanguageChange = () => this.updateInventoryUI();
    window.addEventListener("escape-room-language-change", this._onLanguageChange);
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
      this.gameAudio.unlock();
      if (!this.ready) return;
      if (this.endingCinematic || this.endingTour) return;
      if (this.paused) {
        if (event.code === "Escape") this.onPauseRequest?.();
        return;
      }
      if (this.inventoryInspectionOpen) {
        if (event.code === "Escape") this.closeInventoryInspection();
        return;
      }

      if (this.player.isFocused) {
        if (/^Digit[1-5]$/.test(event.code)) {
          this.player.selectInventorySlot(Number(event.code.slice(-1)) - 1);
          return;
        }
        if (this.player.focusedObject?.handleKey?.(event.code)) { event.preventDefault(); return; }
        if (event.code === "Escape" || event.code === "KeyE") {
          event.preventDefault();
          this.player.focusedObject?.closePanel?.();
          this.player.exitFocus();
        }
        return;
      }

      if (event.code === "Escape") {
        event.preventDefault();
        if (this.player.fpControls.isLocked) this.player.fpControls.unlock();
        else this.onPauseRequest?.();
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
      if (!this.ready) return;
      if (this.endingCinematic || this.endingTour) return;
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
      this.gameAudio.unlock();
      if (!this.ready) return;
      if (this.endingCinematic || this.endingTour) return;
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

      const findControl = (object, key) => {
        let current = object;
        while (current && current !== focusedObject.object3D) {
          if (current.userData?.[key] !== undefined) return current.userData[key];
          current = current.parent;
        }
        return undefined;
      };
      const intersection = focusedObject.resolveFocusedIntersection?.(intersections) ?? intersections.find(({ object }) =>
        findControl(object, "childrenPuzzleControl")?.kind === "block",
      ) ?? intersections.find(({ object }) =>
        findControl(object, "childrenPuzzleControl") !== undefined
        || findControl(object, "roomPuzzleControl") !== undefined,
      ) ?? intersections[0];
      const hit = intersection.object;
      const digitIndex = hit.userData.lockDigitIndex ?? hit.userData.safeDigitIndex;
      const photoFragmentSlot = hit.userData.photoFragmentSlot;
      const sewingSpoolSlot = hit.userData.sewingSpoolSlot;
      const electricalSwitchIndex = hit.userData.electricalSwitchIndex;
      const emberIndex = hit.userData.emberIndex;
      const radioDialIndex = hit.userData.radioDialIndex;
      const clockHand = hit.userData.clockHand;
      const childrenPuzzleControl = findControl(hit, "childrenPuzzleControl");
      const roomPuzzleControl = findControl(hit, "roomPuzzleControl");

      if (childrenPuzzleControl !== undefined || roomPuzzleControl !== undefined) {
        focusedObject.handleControl?.(roomPuzzleControl ?? childrenPuzzleControl, this.player, intersection);
        return;
      }

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
    this._onWindowBlur = () => this.setBackgroundPerformanceMode(true);
    this._onWindowFocus = () => this.setBackgroundPerformanceMode(false);
    this._onVisibilityChange = () => this.setBackgroundPerformanceMode(document.hidden || !document.hasFocus());
    window.addEventListener("blur", this._onWindowBlur);
    window.addEventListener("focus", this._onWindowFocus);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    this.rafId = 0;
    this.environmentTexture = null;
    this.loop = this.loop.bind(this);
    void this.init();
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
    await Promise.all([this.loadEnvironment(), this.gameAudio.load()]);

    const withGameAudio = (handler) => (type, ...args) => {
      this.gameAudio.playAction(type);
      handler?.(type, ...args);
    };
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
      onHallwayAction: withGameAudio(this.onHallwayAction),
      onBedroomAction: withGameAudio(this.onBedroomAction),
      onChildrenRoomAction: withGameAudio(this.onChildrenRoomAction),
      onKitchenAction: withGameAudio(this.onKitchenAction),
      onLivingRoomAction: withGameAudio(this.onLivingRoomAction),
      onBathroomAction: withGameAudio(this.onBathroomAction),
      onObjectFocus: (object) => {
        this.player.focusObject(object);
      },
      isFlashlightOn: () => this.flashlightOn,
      isInteractHeld: () => this.input.isPressed("KeyE"),
    });

    this.roomData = roomData;
    if (this.testArea && roomData.hallway?.maze) roomData.hallway.maze.available = true;
    this.timeline = roomData.timeline ?? null;
    this.scene.userData.timeline = this.timeline;
    if (this.endingPreview) {
      const finalBoltStates = {
        "final-bolt-bedroom": { unlocked: true },
        "final-bolt-living-room": { unlocked: true },
        "final-bolt-children": { unlocked: true },
        "final-bolt-bathroom": { unlocked: true },
        "hallway-street-door": { locked: true, open: false },
      };
      this.sharedState = {
        timelines: {
          past: { objects: structuredClone(finalBoltStates), puzzles: {} },
          present: { objects: structuredClone(finalBoltStates), puzzles: {} },
        },
        inventories: { past: [], present: [] },
        ending: { phase: "threshold", holding: { past: false, present: false }, choice: null, sacrificeTimeline: null },
      };
    }
    if (!this.testMode && this.timeline) {
      this.remoteEcho = new TemporalEcho({ role: this.timeline === "past" ? "papa" : "mama" });
      if (this.remotePlayerIdentity) this.remoteEcho.setName(this.remotePlayerIdentity.displayName);
      this.scene.add(this.remoteEcho.object3D);
    } else if (this.testMode && this.timeline) {
      this.previewEchoes = [
        new TemporalEcho({ role: "mama", name: "Personaje A" }),
        new TemporalEcho({ role: "papa", name: "Personaje B" }),
      ];
      this.previewEchoes.forEach((echo) => this.scene.add(echo.object3D));
    }

    for (const entity of roomData.entities ?? []) {
      entity.setAudioListener?.(this.gameAudio);
      this.entityManager.add(entity);
    }

    this.collisionManager.setObjectColliders(roomData.objectColliders ?? []);
    this.collisionManager.setWallColliders(roomData.wallColliders ?? []);

    this.scene.add(roomData.room);
    roomData.room.updateMatrixWorld(true);
    this.interactionManager.setOccluders(roomData.roomColliders ?? []);

    if (this.endingPreview) {
      const streetDoor = roomData.hallway?.hallwayDoors?.find((door) => door.id === "hallway-street-door");
      if (streetDoor) {
        const doorParent = streetDoor.object3D.parent;
        const parentQuaternion = new THREE.Quaternion();
        doorParent.getWorldQuaternion(parentQuaternion);
        const closedQuaternion = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          streetDoor.closedRotation,
        );
        const doorwayCenter = streetDoor.object3D.position.clone().add(
          new THREE.Vector3(2.5, 0, 0).applyQuaternion(closedQuaternion),
        );
        doorParent.localToWorld(doorwayCenter);
        const doorwayNormal = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(parentQuaternion.clone().multiply(closedQuaternion))
          .setY(0)
          .normalize();
        const hallwayCenter = new THREE.Vector3();
        roomData.hallway.room.getWorldPosition(hallwayCenter);
        if (hallwayCenter.clone().sub(doorwayCenter).dot(doorwayNormal) < 0) doorwayNormal.negate();
        roomData.spawnPosition = doorwayCenter.clone().addScaledVector(doorwayNormal, 4.2);
        roomData.spawnPosition.y = 5.2;
        roomData.spawnLookAt = doorwayCenter.clone();
        roomData.spawnLookAt.y = 3.1;
      }
    }

    this.camera.position.copy(roomData.spawnPosition);
    this.collisionManager.previousPosition = this.camera.position.clone();

    if (roomData.spawnLookAt) {
      this.player.setLookAt(roomData.spawnLookAt);
    }
    if (this.previewEchoes.length) {
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();
      const right = new THREE.Vector3(-direction.z, 0, direction.x);
      const center = this.camera.position.clone().addScaledVector(direction, 5.2);
      const facingCamera = Math.atan2(direction.x, direction.z);
      this.previewEchoes.forEach((echo, index) => {
        const position = center.clone().addScaledVector(right, index === 0 ? -1.35 : 1.35);
        echo.setTarget({
          position: { x: position.x, y: 5.25, z: position.z },
          rotationY: facingCamera + (index === 0 ? -.08 : .08),
        });
      });
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
        if (stableFrames >= 3) resolve();
        else requestAnimationFrame(check);
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

  resume() {
    if (!this.ready || !this.paused) return;
    this.paused = false;
    if (this.player.isFirstPerson) this.player.requestPointerLock();
    else this.player.orbitControls.enabled = true;
  }

  applySharedState(state) {
    if (!state) return;
    this.sharedState = state;
    if (!this.roomData || !this.timeline) return;
    this.roomData.hallway?.applyHallwayState(state);
    this.roomData.bedroom?.applyBedroomState(state);
    this.roomData.childrenRoom?.applyChildrenRoomState(state);
    this.roomData.kitchen?.applyKitchenState(state);
    this.roomData.livingRoom?.applyLivingRoomState(state);
    this.roomData.bathroom?.applyBathroomState(state);
    this.onEndingChange?.(state.ending ?? null);
    if (state.timelines?.past?.puzzles?.["children-globe"]?.solved) {
      this.player.inventory.remove("children-photo-order-note");
    }
    if (state.timelines?.present?.puzzles?.["kitchen-recipe"]?.solved) {
      this.player.inventory.remove("kitchen-recipe-note");
    }
    const doorState = state.timelines?.[this.timeline]?.objects?.["bedroom-exit-door"];
    if (!doorState) return;
    const door = this.roomData.door;
    if (doorState.locked === false) door.unlock({ notify: false });
    if (doorState.open) door.open();
  }

  startEndingExit(onComplete, onMoveStart = null) {
    const streetDoor = this.roomData?.hallway?.hallwayDoors?.find((door) => door.id === "hallway-street-door");
    if (!streetDoor || this.endingCinematic) return;
    this.player.fpControls.enabled = false;
    // The ending is shown as an empty memory of the house. Hide both the
    // network echo and the two test characters before crossing the last door.
    if (this.remoteEcho?.object3D) this.remoteEcho.object3D.visible = false;
    this.previewEchoes.forEach((echo) => {
      echo.object3D.visible = false;
    });

    const doorParent = streetDoor.object3D.parent;
    const parentQuaternion = new THREE.Quaternion();
    doorParent.getWorldQuaternion(parentQuaternion);
    const closedDoorQuaternion = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), streetDoor.closedRotation);
    const doorwayQuaternion = parentQuaternion.clone().multiply(closedDoorQuaternion);
    const doorwayCenter = streetDoor.object3D.position.clone().add(
      new THREE.Vector3(2.5, 0, 0).applyQuaternion(closedDoorQuaternion),
    );
    doorParent.localToWorld(doorwayCenter);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(doorwayQuaternion).setY(0).normalize();
    const cameraSide = Math.sign(this.camera.position.clone().sub(doorwayCenter).dot(normal)) || 1;
    const exitDirection = normal.multiplyScalar(-cameraSide);
    const start = this.camera.position.clone();
    const approach = doorwayCenter.clone().addScaledVector(exitDirection, -1.45);
    const threshold = doorwayCenter.clone().addScaledVector(exitDirection, .75);
    const end = doorwayCenter.clone().addScaledVector(exitDirection, 4.8);
    approach.y = start.y;
    threshold.y = start.y;
    end.y = start.y;
    const lookTarget = end.clone().addScaledVector(exitDirection, 5).setY(start.y - .35);
    const orientationGuide = this.camera.clone();
    orientationGuide.position.copy(start);
    orientationGuide.lookAt(lookTarget);

    this.endingCinematic = {
      elapsed: 0,
      delay: 1.05,
      duration: 2.65,
      start,
      approach,
      threshold,
      end,
      startQuaternion: this.camera.quaternion.clone(),
      endQuaternion: orientationGuide.quaternion.clone(),
      movementStarted: false,
      onMoveStart,
      onComplete,
    };
  }

  updateEndingCinematic(delta) {
    const cinematic = this.endingCinematic;
    if (!cinematic) return;
    cinematic.elapsed += delta;
    if (!cinematic.movementStarted && cinematic.elapsed >= cinematic.delay) {
      cinematic.movementStarted = true;
      cinematic.onMoveStart?.();
    }
    const rawProgress = THREE.MathUtils.clamp((cinematic.elapsed - cinematic.delay) / cinematic.duration, 0, 1);
    const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    if (progress < .44) {
      const approachProgress = THREE.MathUtils.smoothstep(progress / .44, 0, 1);
      this.camera.position.lerpVectors(cinematic.start, cinematic.approach, approachProgress);
    } else if (progress < .66) {
      const crossingProgress = THREE.MathUtils.smoothstep((progress - .44) / .22, 0, 1);
      this.camera.position.lerpVectors(cinematic.approach, cinematic.threshold, crossingProgress);
    } else {
      const exitProgress = THREE.MathUtils.smoothstep((progress - .66) / .34, 0, 1);
      this.camera.position.lerpVectors(cinematic.threshold, cinematic.end, exitProgress);
    }
    const rotationProgress = THREE.MathUtils.smoothstep(Math.min(progress / .5, 1), 0, 1);
    this.camera.quaternion.slerpQuaternions(cinematic.startQuaternion, cinematic.endQuaternion, rotationProgress);
    this.collisionManager.previousPosition.copy(this.camera.position);

    if (rawProgress < 1) return;
    this.endingCinematic = null;
    cinematic.onComplete?.();
  }

  startEndingHouseTour({ onBeat, onFade, onComplete } = {}) {
    if (this.endingTour || !this.roomData) return;
    this.paused = false;
    const cleanState = structuredClone(this.sharedState);
    const solved = (timeline, id, extra = {}) => {
      cleanState.timelines[timeline].puzzles[id] = {
        ...cleanState.timelines[timeline].puzzles[id],
        solved: true,
        ...extra,
      };
    };
    ["bedroom-radio", "bedroom-sewing-box", "hallway-clock", "bathroom-hot-water", "children-blocks", "children-music-key", "children-globe-pin", "children-globe", "children-wardrobe-chains", "living-room-painting", "living-room-embers", "kitchen-oven"].forEach((id) => solved("past", id));
    ["bedroom-family-photo", "bedroom-electrical-panel", "bedroom-light-reveal-puzzle", "hallway-maze", "living-room-rainbow-books", "children-music", "kitchen-stove", "bathroom-sequence"].forEach((id) => solved("present", id));
    solved("present", "kitchen-recipe", { placements: ["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"] });
    solved("present", "kitchen-family-table", { placements: ["kitchen-napkin-red", "kitchen-napkin-green", "kitchen-napkin-blue", "kitchen-napkin-ochre"] });
    solved("present", "bathroom-mosaic", { tileInserted: true });
    cleanState.timelines.past.objects["living-room-painting-slot"] = { placed: true, restoredPieces: [0, 1] };
    cleanState.timelines.present.objects["living-room-sofa-cushion"] = { cut: true, searched: true };
    this.roomData.hallway?.applyHallwayState(cleanState);
    this.roomData.bedroom?.applyBedroomState(cleanState);
    this.roomData.childrenRoom?.applyChildrenRoomState(cleanState);
    this.roomData.kitchen?.applyKitchenState(cleanState);
    this.roomData.livingRoom?.applyLivingRoomState(cleanState);
    this.roomData.bathroom?.applyBathroomState(cleanState);

    for (const entity of this.roomData.entities ?? []) {
      // Leave the clues solved, but stage the house as it looked before anyone
      // started opening or moving its furniture.
      if (entity.id === "living-room-shelf-1" && entity.mechanismStartPosition) {
        entity.object3D.position.copy(entity.mechanismStartPosition);
        entity.object3D.rotation.y = entity.mechanismStartRotation;
        entity.mechanismTargetRotation = entity.mechanismStartRotation;
        entity.mechanismProgress = 0;
        entity.isMechanismMoving = false;
        entity.refreshCollider?.();
      }
      entity.drawerManager?.states?.forEach((state, index) => {
        const drawer = entity.drawerManager.drawers[index];
        state.isOpen = false;
        state.targetZ = drawer.userData.closedZ;
        drawer.position.z = drawer.userData.closedZ;
      });
      entity.panelManager?.states?.forEach((state, index) => {
        const panel = entity.panelManager.panels[index];
        state.isOpen = false;
        state.targetRotation = state.closedRotation;
        panel.rotation[state.axis] = state.closedRotation;
      });
      if (Array.isArray(entity.doorStates)) {
        entity.doorStates.forEach((state, index) => {
          if (typeof state === "boolean") {
            entity.doorStates[index] = false;
            if (entity.doors?.[index]) entity.doors[index].rotation.y = 0;
          } else if (state) {
            state.isOpen = false;
            state.targetRotation = 0;
            if (entity.cabinetDoors?.[index]) entity.cabinetDoors[index].rotation.y = 0;
          }
        });
      }
      if (Array.isArray(entity.drawerStates)) {
        entity.drawerStates.fill(false);
        entity.drawers?.forEach((drawer) => {
          drawer.position.z = entity.closedDrawerZ;
        });
      }
      if (entity.doorPivot && "targetDoorRotation" in entity) {
        entity.isOpen = false;
        entity.targetDoorRotation = 0;
        entity.doorPivot.rotation.y = 0;
      }
      if (entity.lidPivot && "lidTargetRotation" in entity) {
        entity.isLidOpen = false;
        entity.lidTargetRotation = 0;
        entity.lidPivot.rotation.x = 0;
      }
      if (entity.id === "children-globe") entity.setOpen?.(false, { immediate: true });
      if (entity.id === "children-music" && entity.lidGroup) entity.lidGroup.rotation.x = 0;
      if (entity.id === "living-room-painting-slot" && entity.hinge) {
        entity.hinge.rotation.y = 0;
        if (entity.timeline === "present") entity.restored = false;
      }
      if (entity.id === "living-room-display-case" && entity.frontLid) {
        entity.opened = false;
        entity.targetLidAngle = 0;
        entity.lidAngle = 0;
        entity.frontLid.rotation.x = 0;
      }
      if (entity.id === "living-room-chest" && entity.lidPivot) {
        entity.isOpen = false;
        entity.targetOpen = false;
        entity.lidPivot.rotation.x = 0;
      }
    }
    const worldPoint = (parent, localPoint) => parent.localToWorld(localPoint.clone());
    const makeDoorView = (area, openingWorld, { height = 4.7 } = {}) => {
      const { minX, maxX, minZ, maxZ } = area.bounds;
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const targetLocal = new THREE.Vector3(centerX, 3.05, centerZ);
      const target = area.room.localToWorld(targetLocal);
      const inward = target.clone().sub(openingWorld).setY(0).normalize();
      const start = openingWorld.clone().addScaledVector(inward, 1.8);
      const startLocal = area.room.worldToLocal(start.clone());
      startLocal.x = THREE.MathUtils.clamp(startLocal.x, minX + 1.4, maxX - 1.4);
      startLocal.z = THREE.MathUtils.clamp(startLocal.z, minZ + 1.4, maxZ - 1.4);
      startLocal.y = height;
      area.room.localToWorld(startLocal);
      const guide = this.camera.clone();
      guide.position.copy(startLocal);
      guide.lookAt(target);
      return { start: startLocal, end: startLocal.clone(), target, quaternion: guide.quaternion.clone() };
    };
    const makeLocalView = (area, startLocal, targetLocal) => {
      const start = area.room.localToWorld(startLocal.clone());
      const target = area.room.localToWorld(targetLocal.clone());
      const guide = this.camera.clone();
      guide.position.copy(start);
      guide.lookAt(target);
      return { start, end: start.clone(), target, quaternion: guide.quaternion.clone() };
    };
    const bedroomOpening = worldPoint(this.roomData.bedroom.room, this.roomData.bedroom.doorOpening.position);
    const livingOpening = worldPoint(this.roomData.hallway.room, this.roomData.hallway.livingRoomOpening.position);
    const childrenOpening = worldPoint(this.roomData.hallway.room, this.roomData.hallway.childrenRoomOpening.position);
    const kitchenOpening = worldPoint(this.roomData.hallway.room, this.roomData.hallway.kitchenOpening.position);
    const bathroomOpening = worldPoint(this.roomData.hallway.room, this.roomData.hallway.bathroomOpening.position);
    const scenes = [
      makeDoorView(this.roomData.bedroom, bedroomOpening),
      makeDoorView(this.roomData.livingRoom, livingOpening),
      makeDoorView(this.roomData.childrenRoom, childrenOpening),
      makeDoorView(this.roomData.kitchen, kitchenOpening),
      makeDoorView(this.roomData.bathroom, bathroomOpening, { height: 4.2 }),
      // Final shot: inside the entrance, with the closed street door directly
      // behind the camera and the length of the hallway in front of it.
      makeLocalView(
        this.roomData.hallway,
        new THREE.Vector3(this.roomData.hallway.dimensions.width / 2 - 2.2, 4.7, 0),
        new THREE.Vector3(this.roomData.hallway.dimensions.width / 2 - 13, 3.1, 0),
      ),
    ];

    const tourDoors = [
      this.roomData.bedroom.door,
      this.roomData.hallway.livingRoomDoor,
      ...this.roomData.hallway.hallwayDoors,
      this.roomData.livingRoom.door,
      this.roomData.livingRoom.kitchenDoor,
    ].filter(Boolean);
    tourDoors.forEach((door) => {
      door.isOpen = false;
      door.targetRotation = door.closedRotation;
      door.object3D.rotation.y = door.closedRotation;
      door.object3D.visible = true;
    });

    this.camera.position.copy(scenes[0].start);
    this.camera.quaternion.copy(scenes[0].quaternion);
    this.endingTour = {
      scenes,
      sceneIndex: 0,
      phase: "hold",
      elapsed: 0,
      doors: tourDoors,
      onBeat,
      onFade,
      onComplete,
    };
    onFade?.(false);
    onBeat?.(0);
  }

  updateEndingTour(delta) {
    const tour = this.endingTour;
    if (!tour) return;
    tour.elapsed += delta;
    const scene = tour.scenes[tour.sceneIndex];
    this.camera.position.copy(scene.start);
    this.camera.quaternion.copy(scene.quaternion);
    if (tour.phase === "hold") {
      const duration = tour.sceneIndex === 0 ? 10 : 8;
      if (tour.elapsed < duration) return;
      const nextSceneIndex = tour.sceneIndex + 1;
      if (nextSceneIndex >= tour.scenes.length) {
        tour.phase = "finalFade";
        tour.elapsed = 0;
        tour.onBeat?.(null);
        tour.onFade?.(true);
        return;
      }
      tour.elapsed = 0;
      tour.phase = "fade";
      tour.onBeat?.(null);
      tour.onFade?.(true);
      return;
    }
    if (tour.phase === "finalFade") {
      if (tour.elapsed < 1.15) return;
      this.endingTour = null;
      tour.onComplete?.();
      return;
    }
    if (tour.phase === "reveal") {
      if (tour.elapsed < .55) return;
      tour.phase = "hold";
      tour.elapsed = 0;
      tour.onBeat?.(tour.sceneIndex);
      return;
    }
    if (tour.elapsed < .65) return;
    tour.sceneIndex += 1;
    const nextScene = tour.scenes[tour.sceneIndex];
    this.camera.position.copy(nextScene.start);
    this.camera.quaternion.copy(nextScene.quaternion);
    tour.phase = "reveal";
    tour.elapsed = 0;
    tour.onFade?.(false);
  }

  updateRemotePlayer(movement) {
    if (!this.remoteEcho || movement.timeline === this.timeline) return;
    this.remoteEcho.setTarget(movement);
  }

  setRemotePlayerConnected({ timeline, connected }) {
    if (!this.remoteEcho || timeline === this.timeline) return;
    this.remoteEcho.setConnected(connected);
  }

  setRemotePlayerIdentity({ timeline, displayName }) {
    if (timeline === this.timeline) return;
    this.remotePlayerIdentity = { timeline, displayName };
    this.remoteEcho?.setName(displayName);
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
    const translation = document.getElementById("inventory-inspection-translation");

    if (!panel || !image || !title || !hint || !translation) {
      return;
    }

    image.src = item.inspectionImage;
    image.alt = tItem(item.itemName ?? item.id);
    title.textContent = tItem(item.itemName ?? item.id);
    hint.textContent = t("ui.closeInspection");
    const translatedText = t(`papers.${item.id}`);
    translation.textContent = translatedText.startsWith("papers.") ? "" : translatedText;
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
      const endingSequenceActive = Boolean(this.endingCinematic || this.endingTour);
      if (!endingSequenceActive) this.player.update(delta);
      this.updateEndingCinematic(delta);
      this.updateEndingTour(delta);
      if (!endingSequenceActive) this.interactionManager.update();
      this.entityManager.update(delta);
      this.remoteEcho?.update(delta);
      this.previewEchoes.forEach((echo) => echo.update(delta));
      this.movementBroadcastElapsed += delta;
      this.movementHeartbeatElapsed += delta;
      if (this.movementBroadcastElapsed >= .125 && !this.player.isFocused) {
        this.movementBroadcastElapsed = 0;
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const rotationY = Math.atan2(-direction.x, -direction.z);
        const moved = this.lastBroadcastPosition.distanceToSquared(this.camera.position) > .0004;
        const turned = Math.abs(Math.atan2(
          Math.sin(rotationY - this.lastBroadcastRotationY),
          Math.cos(rotationY - this.lastBroadcastRotationY),
        )) > .008;
        if (moved || turned || this.movementHeartbeatElapsed >= 1) {
          this.onPlayerMovement?.({
            position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
            rotationY,
          });
          this.lastBroadcastPosition.copy(this.camera.position);
          this.lastBroadcastRotationY = rotationY;
          this.movementHeartbeatElapsed = 0;
        }
      }
      this.updateFlashlight();
      const moving = !endingSequenceActive && ["KeyW", "KeyA", "KeyS", "KeyD"].some((code) => this.input.isPressed(code));
      const running = this.input.isPressed("ControlLeft") || this.input.isPressed("ControlRight");
      this.gameAudio.updateFootsteps(delta, {
        moving: moving && this.player.isFirstPerson && !this.player.isFocused,
        running,
        crouching: this.player.isCrouching,
        grounded: this.player.isGrounded,
      });
    }

    if (this.player.focusedObject?.exitFocusRequested) {
      this.player.focusedObject.exitFocusRequested = false;
      this.player.exitFocus();
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("blur", this._onWindowBlur);
    window.removeEventListener("focus", this._onWindowFocus);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("escape-room-language-change", this._onLanguageChange);
    document.getElementById("inventory-inspection-close")?.removeEventListener("click", this._onInspectionClose);
    this.input.dispose();
    this.interactionManager.dispose();
    this.interactableManager.dispose();
    this.entityManager.dispose();
    this.remoteEcho?.dispose();
    this.previewEchoes.forEach((echo) => echo.dispose());
    this.player.fpControls.removeEventListener("unlock", this._onPointerUnlock);
    if (this.ownsGameAudio) this.gameAudio.dispose();
    THREE.DefaultLoadingManager.onStart = this.loadingManagerHandlers.onStart;
    THREE.DefaultLoadingManager.onProgress = this.loadingManagerHandlers.onProgress;
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
