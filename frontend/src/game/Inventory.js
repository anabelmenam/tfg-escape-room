export const INVENTORY_SIZE = 8;

export class Inventory {
  constructor(size = INVENTORY_SIZE) {
    this.size = size;
    this.items = new Array(size).fill(null);
    this.selectedIndex = 0;
    this.onChange = null;
  }

  add(item) {
    if (!item?.id) {
      return false;
    }

    if (this.has(item.id)) {
      return false;
    }

    const emptyIndex = this.items.findIndex((item) => item === null);
    if (emptyIndex === -1) {
      return false;
    }

    this.items[emptyIndex] = item;
    this.notifyChange();
    return true;
  }

  remove(id) {
    const index = this.items.findIndex((item) => item?.id === id);

    if (index === -1) {
      return null;
    }

    const removedItem = this.items[index];
    this.items[index] = null;
    this.notifyChange();
    return removedItem;
  }

  has(id) {
    return this.items.some((item) => item?.id === id);
  }

  get(id) {
    return this.items.find((item) => item?.id === id) ?? null;
  }

  getAll() {
    return [...this.items];
  }

  select(index) {
    if (index < 0 || index >= this.size) {
      return;
    }

    this.selectedIndex = index;

    this.notifyChange();
  }

  getSelectedItem() {
    return this.items[this.selectedIndex] ?? null;
  }

  hasSelected(id) {
    const selectedItem = this.getSelectedItem();
    return selectedItem?.id === id;
  }

  clear() {
    this.items = new Array(this.size).fill(null);

    this.notifyChange();
  }

  restore(items) {
    const restored = items.filter(Boolean).slice(0, this.size);
    this.items = [...restored, ...new Array(this.size - restored.length).fill(null)];
    if (this.selectedIndex >= this.size) this.selectedIndex = 0;
    this.notifyChange();
  }

  notifyChange() {
    if (typeof this.onChange === "function") {
      this.onChange(this);
    }
  }
}
