import * as THREE from "three";
import { tInteraction, tItem } from "../../../translations";

class DrawerManager {
  constructor({ ownerId, drawerSpeed = 5, lockedDrawers = [], requiredDrawerKeys = {} } = {}) {
    this.ownerId = ownerId;
    this.drawerSpeed = drawerSpeed;

    this.drawers = [];
    this.states = [];
    this.interactables = [];

    this.lockedDrawers = new Set(lockedDrawers);
    this.requiredDrawerKeys = requiredDrawerKeys;
  }

  registerDrawer({ drawer, index, closedZ, openZ }) {
    drawer.userData.drawerIndex = index;
    drawer.userData.closedZ = closedZ;
    drawer.userData.openZ = openZ;

    this.drawers[index] = drawer;

    this.states[index] = {
      isOpen: false,
      locked: this.lockedDrawers.has(index),
      targetZ: closedZ,
    };

    this.interactables[index] = this.createInteractable(index);

    return drawer;
  }

  createInteractable(index) {
    const drawer = this.drawers[index];

    return {
      id: `${this.ownerId}-drawer-${index}`,
      object3D: drawer,
      enabled: true,

      interact: (player) => {
        const state = this.states[index];
        const requiredKey = this.requiredDrawerKeys[index];

        if (state?.locked && requiredKey) {
          if (!player?.hasSelected(requiredKey)) {
            return;
          }

          state.locked = false;
        }

        this.toggle(index);
      },

      getInteractionText: () => {
        const state = this.states[index];

        if (!state) {
          return null;
        }

        if (state.locked) {
          const requiredKey = this.requiredDrawerKeys[index];
          return requiredKey ? tInteraction("needItem", tItem(requiredKey)) : tInteraction("locked", tItem("drawer"));
        }

        return state.isOpen ? tInteraction("close", tItem("drawer")) : tInteraction("open", tItem("drawer"));
      },
    };
  }

  toggle(index) {
    const drawer = this.drawers[index];
    const state = this.states[index];

    if (!drawer || !state || state.locked) {
      return false;
    }

    state.isOpen = !state.isOpen;

    state.targetZ = state.isOpen ? drawer.userData.openZ : drawer.userData.closedZ;

    return true;
  }

  open(index) {
    const drawer = this.drawers[index];
    const state = this.states[index];

    if (!drawer || !state || state.locked) {
      return false;
    }

    state.isOpen = true;
    state.targetZ = drawer.userData.openZ;

    return true;
  }

  close(index) {
    const drawer = this.drawers[index];
    const state = this.states[index];

    if (!drawer || !state) {
      return false;
    }

    state.isOpen = false;
    state.targetZ = drawer.userData.closedZ;

    return true;
  }

  lock(index) {
    const state = this.states[index];

    if (!state) {
      return false;
    }

    if (state.isOpen) {
      this.close(index);
    }

    state.locked = true;

    return true;
  }

  unlock(index) {
    const state = this.states[index];

    if (!state) {
      return false;
    }

    state.locked = false;

    return true;
  }

  isLocked(index) {
    return this.states[index]?.locked ?? false;
  }

  getDrawer(index) {
    return this.drawers[index] ?? null;
  }

  getInteractables() {
    return this.interactables;
  }

  addObject(index, object3D, position = new THREE.Vector3()) {
    const drawer = this.getDrawer(index);

    if (!drawer || !object3D) {
      return false;
    }

    drawer.add(object3D);
    object3D.position.copy(position);

    return true;
  }

  update(deltaTime) {
    this.drawers.forEach((drawer, index) => {
      const state = this.states[index];

      if (!state) {
        return;
      }

      drawer.position.z = THREE.MathUtils.damp(drawer.position.z, state.targetZ, this.drawerSpeed, deltaTime);
    });
  }
}

export { DrawerManager };
