import { createElement, useState } from "react";
import { Gamepad2, Languages, Volume2 } from "lucide-react";
import AudioSettings from "./settings/AudioSettings.jsx";
import LanguageSettings from "./settings/LanguageSettings.jsx";
import MouseSettings from "./settings/MouseSettings.jsx";
import { t } from "../../translations/index.js";

const tabs = [
  { id: "sound", label: "menu.sound", icon: Volume2 },
  { id: "game", label: "settingsScreen.game", icon: Gamepad2 },
  { id: "language", label: "ui.language", icon: Languages },
];

const SettingsPanel = ({
  audioSettings,
  onAudioSettingChange,
  mouseSensitivity,
  onMouseSensitivityChange,
  onLanguageChange,
}) => {
  const [tab, setTab] = useState("sound");

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">{t("menu.settings")}</p>
      <h1 className="mt-1 font-serif text-3xl text-[#f5e8ce] sm:text-4xl">{t("settingsScreen.title")}</h1>
      <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#aa9b84] sm:text-sm">
        {t("settingsScreen.description")}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-1.5 rounded border border-[#6f5940]/60 bg-[#120e0d]/70 p-1">
        {tabs.map((tabConfig) => (
          <button
            key={tabConfig.id}
            type="button"
            onClick={() => setTab(tabConfig.id)}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded px-2 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] transition sm:flex-row sm:text-xs ${tab === tabConfig.id ? "bg-[#bd7939] text-[#1d120b] shadow-lg shadow-black/25" : "text-[#bcae95] hover:bg-[#302119] hover:text-[#f2dfbd]"}`}
          >
            {createElement(tabConfig.icon, { size: 16 })}
            {t(tabConfig.label)}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-[245px] rounded border border-[#6f5940]/45 bg-[#171210]/65 px-4 py-1 sm:px-6">
        {tab === "sound" && <AudioSettings idPrefix="menu" settings={audioSettings} onChange={onAudioSettingChange} />}
        {tab === "game" && (
          <div className="py-2">
            <MouseSettings idPrefix="menu" sensitivity={mouseSensitivity} onChange={onMouseSensitivityChange} />
          </div>
        )}
        {tab === "language" && (
          <div className="py-4">
            <h2 className="font-serif text-2xl text-[#ead8b5]">{t("settingsScreen.languageTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#a99a83]">{t("settingsScreen.languageDescription")}</p>
            <LanguageSettings onChange={onLanguageChange} />
          </div>
        )}
      </div>
    </>
  );
};

export default SettingsPanel;
