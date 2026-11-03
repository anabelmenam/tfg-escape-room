import { getLanguage, setLanguage, t } from "../translations/index.js";

const LanguageSettings = ({ onChange = null }) => (
  <label className="mt-4 block text-sm text-[#d8c9ad]">
    <span className="mb-2 block font-semibold">{t("ui.language")}</span>
    <select
      className="w-full rounded border border-amber-100/25 bg-[#120e0d] px-3 py-2 text-amber-50"
      value={getLanguage()}
      onChange={(event) => {
        setLanguage(event.target.value);
        onChange?.(event.target.value);
      }}
    >
      <option value="es">{t("ui.spanish")}</option>
      <option value="en">{t("ui.english")}</option>
      <option value="fr">{t("ui.french")}</option>
    </select>
  </label>
);

export default LanguageSettings;
