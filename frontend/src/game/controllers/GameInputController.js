const findControl = (object, root, key) => {
  let current = object;
  while (current && current !== root) {
    if (current.userData?.[key] !== undefined) return current.userData[key];
    current = current.parent;
  }
  return undefined;
};

export class GameInputController {
  constructor(game) {
    this.game = game;
    this.onPointerUnlock = () => {
      if (game.ready && !game.paused && !game.inventoryInspectionOpen && !game.player.isFocused && game.player.isFirstPerson) game.onPauseRequest?.();
    };
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.onWheel = (event) => this.handleWheel(event);
    this.onClick = (event) => this.handleClick(event);
    game.player.fpControls.addEventListener("unlock", this.onPointerUnlock);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("wheel", this.onWheel);
    game.renderer.domElement.addEventListener("click", this.onClick);
  }

  handleKeyDown(event) {
    const game = this.game;
    game.gameAudio.unlock();
    if (!game.ready || game.endingCinematic || game.endingTour) return;
    if (game.paused) { if (event.code === "Escape") game.onPauseRequest?.(); return; }
    if (game.inventoryInspectionOpen) { if (event.code === "Escape") game.closeInventoryInspection(); return; }
    if (game.player.isFocused) {
      if (/^Digit[1-5]$/.test(event.code)) { game.player.selectInventorySlot(Number(event.code.slice(-1)) - 1); return; }
      if (game.player.focusedObject?.handleKey?.(event.code)) { event.preventDefault(); return; }
      if (event.code === "Escape" || event.code === "KeyE") { event.preventDefault(); game.player.focusedObject?.closePanel?.(); game.player.exitFocus(); }
      return;
    }
    if (event.code === "Escape") { event.preventDefault(); if (game.player.fpControls.isLocked) game.player.fpControls.unlock(); else game.onPauseRequest?.(); return; }
    if ((event.code === "ShiftLeft" || event.code === "ShiftRight") && !event.repeat) { game.player.toggleCrouch(); return; }
    if (event.code === "KeyI" || event.code === "KeyR") game.inspectSelectedInventoryItem(event.code);
    else if (event.code === "KeyQ") game.toggleFlashlight();
    else if (event.code === "KeyF") game.player.toggleMode();
    else if (event.code === "KeyE" && !event.repeat) game.interactionManager.use();
    else if (/^Digit[1-5]$/.test(event.code)) game.player.selectInventorySlot(Number(event.code.slice(-1)) - 1);
  }

  handleWheel(event) {
    const game = this.game;
    if (!game.ready || game.endingCinematic || game.endingTour) return;
    const inventory = game.player.inventory;
    if (!inventory) return;
    let index = inventory.selectedIndex + (event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0);
    if (index >= inventory.size) index = 0;
    if (index < 0) index = inventory.size - 1;
    inventory.select(index);
  }

  handleClick(event) {
    const game = this.game;
    game.gameAudio.unlock();
    if (!game.ready || game.endingCinematic || game.endingTour) return;
    if (!game.player.isFocused) { game.player.requestPointerLock(); return; }
    const focused = game.player.focusedObject;
    if (!focused) return;
    const rect = game.renderer.domElement.getBoundingClientRect();
    game.lockMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    game.lockMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    game.lockRaycaster.setFromCamera(game.lockMouse, game.camera);
    const intersections = game.lockRaycaster.intersectObjects(focused.object3D.children, true);
    if (!intersections.length) return;
    const intersection = focused.resolveFocusedIntersection?.(intersections)
      ?? intersections.find(({ object }) => findControl(object, focused.object3D, "childrenPuzzleControl")?.kind === "block")
      ?? intersections.find(({ object }) => findControl(object, focused.object3D, "childrenPuzzleControl") !== undefined || findControl(object, focused.object3D, "roomPuzzleControl") !== undefined)
      ?? intersections[0];
    const hit = intersection.object;
    const childrenControl = findControl(hit, focused.object3D, "childrenPuzzleControl");
    const roomControl = findControl(hit, focused.object3D, "roomPuzzleControl");
    if (childrenControl !== undefined || roomControl !== undefined) { focused.handleControl?.(roomControl ?? childrenControl, game.player, intersection); return; }
    const actions = [
      [hit.userData.clockHand, "advanceHand"], [hit.userData.photoFragmentSlot, "selectFragment"],
      [hit.userData.sewingSpoolSlot, "selectSpool"], [hit.userData.electricalSwitchIndex, "toggleSwitch"],
      [hit.userData.emberIndex, "rotateEmber"], [hit.userData.radioDialIndex, "incrementDial"],
    ];
    for (const [value, method] of actions) { if (value !== undefined) { focused[method]?.(value); return; } }
    const digit = hit.userData.lockDigitIndex ?? hit.userData.safeDigitIndex;
    if (digit !== undefined) { if (typeof focused.incrementDigit === "function") focused.incrementDigit(digit); else focused.changeDigit?.(digit); }
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("wheel", this.onWheel);
    this.game.renderer.domElement.removeEventListener("click", this.onClick);
    this.game.player.fpControls.removeEventListener("unlock", this.onPointerUnlock);
  }
}
