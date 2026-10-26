import es from "./es.js";
import en from "./en.js";
import fr from "./fr.js";

const locales = { es, en, fr };
let language = localStorage.getItem("escape-room-language") ?? "es";
if (!locales[language]) language = "es";

export const getLanguage = () => language;
export const setLanguage = (nextLanguage) => {
  if (!locales[nextLanguage]) return;
  language = nextLanguage;
  localStorage.setItem("escape-room-language", language);
  window.dispatchEvent(new CustomEvent("escape-room-language-change", { detail: language }));
};

const resolve = (path) => path.split(".").reduce((value, key) => value?.[key], locales[language]);
export const t = (path) => resolve(path) ?? path;

export function tItem(id) {
  return locales[language].items[id] ?? id;
}

export function tInteraction(key, ...args) {
  const value = locales[language].interactions[key];

  if (typeof value === "function") {
    return value(...args);
  }

  return value ?? key;
}
