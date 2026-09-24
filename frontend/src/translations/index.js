import es from "./es";

const locale = es;

export function tItem(id) {
  return locale.items[id] ?? id;
}

export function tInteraction(key, ...args) {
  const value = locale.interactions[key];

  if (typeof value === "function") {
    return value(...args);
  }

  return value ?? key;
}
