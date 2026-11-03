import { getLanguage, t, tItem } from "../../translations/index.js";

export class InventoryController {
  constructor(game) {
    this.game = game;
    this.knownIds = new Set();
    game.inventoryInspectionOpen = false;
    game.inventoryInspectionKey = null;
    game.player.inventory.onChange = (inventory) => {
      const currentIds = new Set(
        inventory
          .getAll()
          .filter(Boolean)
          .map((item) => item.id),
      );
      const added = [...currentIds].filter((id) => !this.knownIds.has(id));
      this.knownIds = currentIds;
      if (game.ready && added.length) game.gameAudio.playPickup();
      this.updateUI();
    };
    this.onLanguageChange = () => this.updateUI();
    this.onInspectionClose = () => this.closeInspection();
    window.addEventListener("escape-room-language-change", this.onLanguageChange);
    document.getElementById("inventory-inspection-close")?.addEventListener("click", this.onInspectionClose);
    this.updateUI();
  }

  updateUI() {
    const inventory = this.game.player.inventory;
    const selectedItem = inventory.getSelectedItem();
    const selectedName = document.getElementById("inventory-selected-name");
    if (selectedName) {
      selectedName.textContent = selectedItem ? tItem(selectedItem.itemName ?? selectedItem.id) : "";
      selectedName.classList.toggle("hidden", !selectedItem);
    }
    for (let index = 0; index < inventory.size; index += 1) {
      const slot = document.getElementById(`inventory-slot-${index}`);
      const itemElement = document.getElementById(`inventory-item-${index}`);
      if (!slot || !itemElement) continue;
      const item = inventory.items[index];
      itemElement.innerHTML = "";
      slot.classList.toggle("border-yellow-400", index === inventory.selectedIndex);
      slot.classList.toggle("border-white/50", index !== inventory.selectedIndex);
      if (!item) continue;
      if (item.inventoryIcon) {
        const image = document.createElement("img");
        image.src = item.inventoryIcon;
        image.alt = item.id;
        image.className = "h-full w-full p-1 object-contain";
        itemElement.appendChild(image);
      }
    }
  }

  inspectSelected(keyCode) {
    const item = this.game.player.inventory.getSelectedItem();
    const inspectionKey = item?.inventoryInspectionKey ?? "KeyI";
    if (!item?.inspectionImage || inspectionKey !== keyCode) return;
    const panel = document.getElementById("inventory-inspection");
    const image = document.getElementById("inventory-inspection-image");
    const title = document.getElementById("inventory-inspection-title");
    const hint = document.getElementById("inventory-inspection-hint");
    const translation = document.getElementById("inventory-inspection-translation");
    if (!panel || !image || !title || !hint || !translation) return;
    image.src = item.inspectionImage;
    image.alt = tItem(item.itemName ?? item.id);
    title.textContent = item.hideInspectionCaption ? "" : tItem(item.itemName ?? item.id);
    title.classList.toggle("hidden", Boolean(item.hideInspectionCaption));
    hint.textContent = t("ui.closeInspection");
    const translationKey = item.inspectionTranslationKey;
    const translatedText = getLanguage() !== "es" && translationKey ? t(translationKey) : "";
    translation.textContent = translatedText;
    translation.classList.toggle("hidden", !translatedText);
    this.game.inventoryInspectionOpen = true;
    this.game.inventoryInspectionKey = inspectionKey;
    panel.classList.remove("hidden");
    panel.classList.add("flex");
    if (this.game.player.fpControls.isLocked) this.game.player.fpControls.unlock();
  }

  closeInspection() {
    if (!this.game.inventoryInspectionOpen) return;
    const panel = document.getElementById("inventory-inspection");
    panel?.classList.add("hidden");
    panel?.classList.remove("flex");
    this.game.inventoryInspectionOpen = false;
    this.game.inventoryInspectionKey = null;
    if (this.game.player.isFirstPerson && !this.game.player.isFocused) this.game.player.requestPointerLock();
  }

  dispose() {
    window.removeEventListener("escape-room-language-change", this.onLanguageChange);
    document.getElementById("inventory-inspection-close")?.removeEventListener("click", this.onInspectionClose);
  }
}
