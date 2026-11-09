import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ControlsPanel from "./menu/ControlsPanel.jsx";
import SettingsPanel from "./menu/SettingsPanel.jsx";
import SaveSlots from "./SaveSlots.jsx";
import AdminUsers from "./AdminUsers.jsx";
import { t } from "../translations/index.js";

const MenuButton = ({ children, secondary = false, onClick }) => (
  <button
    type="button"
    className={`lobby-menu-button w-full rounded-sm border px-5 py-3 text-left font-bold uppercase tracking-[0.14em] transition ${secondary ? "border-[#9a8061]/60 bg-[#171210]/75 text-[#e4d2ae] hover:border-[#d7b77b] hover:bg-[#302119]" : "border-[#d99b55] bg-[#bd7939] text-[#1d120b] hover:bg-[#d69851]"}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const Lobby = ({
  account,
  initialView = "menu",
  onLogout,
  onEnterLobby,
  audioSettings,
  onAudioSettingChange,
  mouseSensitivity,
  onMouseSensitivityChange,
  onLanguageChange,
}) => {
  const [view, setView] = useState(initialView);

  return (
    <main className="relative flex min-h-screen min-h-dvh items-center justify-center overflow-hidden bg-[#110f10] px-4 py-4 text-[#f2e7d1] before:pointer-events-none before:absolute before:inset-6 before:border before:border-[#d5b67c]/20 after:pointer-events-none after:absolute after:inset-8 after:border after:border-[#d5b67c]/[.08] sm:px-5">
      <section
        className={`lobby-panel relative z-10 max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-sm border border-[#d7b77b]/40 bg-[#211916]/95 p-5 shadow-2xl shadow-black/60 sm:p-7 ${view === "controls" ? "controls-panel-shell" : ""} ${view === "play" || view === "settings" || view === "controls" || view === "tests" || view === "users" ? "max-w-4xl" : "max-w-lg"}`}
      >
        {view !== "menu" && view !== "play" && (
          <button
            type="button"
            className="mb-3 flex items-center gap-2 text-sm text-[#c9ba9e] transition hover:text-[#f5e8ce]"
            onClick={() => setView("menu")}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            {t("menu.back")}
          </button>
        )}

        {view === "menu" && (
          <>
            <p className="lobby-menu-eyebrow mb-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">
              {t("menu.cooperative")}
            </p>
            <img
              src="/logo/logo-name.png"
              alt=""
              aria-hidden="true"
              className="lobby-menu-logo mx-auto mb-4 w-full max-w-[16rem] drop-shadow-[0_14px_22px_rgba(0,0,0,0.45)]"
            />
            <h1 className="sr-only">{t("menu.title")}</h1>
            <p className="lobby-menu-tagline mx-auto mb-10 max-w-md text-center leading-relaxed text-[#c9ba9e]">
              {t("menu.tagline")}
            </p>
            <div className="lobby-menu-actions mx-auto flex max-w-sm flex-col gap-3">
              <MenuButton onClick={() => setView("play")}>{t("menu.play")}</MenuButton>
              <MenuButton secondary onClick={() => setView("settings")}>
                {t("menu.settings")}
              </MenuButton>
              <MenuButton secondary onClick={() => setView("controls")}>
                {t("menu.controls")}
              </MenuButton>
              {account.role === "admin" && (
                <MenuButton secondary onClick={() => setView("tests")}>
                  {t("menu.tests")}
                </MenuButton>
              )}
              {account.role === "admin" && (
                <MenuButton secondary onClick={() => setView("users")}>
                  {t("adminUsers.menu")}
                </MenuButton>
              )}
            </div>
            <div className="lobby-menu-footer mt-8 flex items-center justify-between border-t border-[#675641]/50 pt-5 text-sm text-[#958772]">
              <span>{account.displayName}</span>
              <button type="button" onClick={onLogout} className="hover:text-[#f2dfbd]">
                {t("account.logout")}
              </button>
            </div>
          </>
        )}

        {view === "play" && <SaveSlots onContinue={onEnterLobby} onBack={() => setView("menu")} />}

        {view === "settings" && (
          <SettingsPanel
            audioSettings={audioSettings}
            onAudioSettingChange={onAudioSettingChange}
            mouseSensitivity={mouseSensitivity}
            onMouseSensitivityChange={onMouseSensitivityChange}
            onLanguageChange={onLanguageChange}
          />
        )}

        {view === "controls" && <ControlsPanel isAdmin={account.role === "admin"} />}

        {view === "tests" && account.role === "admin" && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[.24em] text-[#d8aa64]">{t("menu.tests")}</p>
            <h1 className="mt-2 font-serif text-4xl text-[#f5e8ce]">{t("testAccess")}</h1>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["mum", "dad"].map((character) => (
                <button
                  key={character}
                  type="button"
                  onClick={() => onEnterLobby({ testMode: true, adminTour: true, character, testArea: "bedroom" })}
                  className="border border-[#806644] bg-[#171210] px-4 py-4 text-left hover:border-[#d7b77b]"
                >
                  <strong className="block text-[#f2dfbd]">
                    {t(`characterSelection.${character === "mum" ? "mama" : "papa"}`)}
                  </strong>
                  <span className="text-sm text-[#a99a83]">{t("menu.fullTour")}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => onEnterLobby({ testMode: true, testPlayerRole: "C", testArea: "icons" })}
                className="border border-[#806644] bg-[#171210] px-4 py-4 text-left hover:border-[#d7b77b]"
              >
                <strong>{t("menu.iconStudio")}</strong>
              </button>
              <button
                type="button"
                onClick={() =>
                  onEnterLobby({
                    testMode: true,
                    character: "dad",
                    testArea: "hallway",
                    endingPreview: true,
                    endingReplay: true,
                  })
                }
                className="border border-[#806644] bg-[#171210] px-4 py-4 text-left hover:border-[#d7b77b]"
              >
                <strong>{t("menu.viewEnding")}</strong>
              </button>
            </div>
          </div>
        )}

        {view === "users" && account.role === "admin" && <AdminUsers currentUserId={account.id} />}
      </section>
    </main>
  );
};

export default Lobby;
