import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ControlsPanel from "../menu/ControlsPanel.jsx";
import SettingsPanel from "../menu/SettingsPanel.jsx";
import { t } from "../../translations/index.js";

const BackButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-3 w-full rounded-lg border border-amber-100/35 px-4 py-2 text-sm font-semibold hover:bg-amber-50/10"
  >
    {t("menu.back")}
  </button>
);

const withoutSignature = (text) => text.replace(/\s+—\s+(Mamá|Papá|Mum|Dad|Maman|Papa)\s*$/, "");

const DiaryBook = ({ diaryEntries, onBack }) => {
  const [selectedEntry, setSelectedEntry] = useState("introduction");
  const foundEntries = new Set(diaryEntries);
  const entries = Array.from({ length: 10 }, (_, index) => `family-note-${String(index + 1).padStart(2, "0")}`);
  const isIntroduction = selectedEntry === "introduction";
  const title = isIntroduction ? t("diaryBook.introduction") : t(`storyNotes.${selectedEntry}.title`);
  const body = isIntroduction ? t("story.mum") : withoutSignature(t(`storyNotes.${selectedEntry}.body`));
  const noteNumber = isIntroduction ? null : Number(selectedEntry.slice(-2));
  const author = noteNumber ? t(`diaryBook.${noteNumber % 2 ? "mother" : "father"}`) : t("diaryBook.familyStory");

  return (
    <>
      <div className="relative overflow-hidden rounded-sm border border-[#6c4d31] bg-[#392719] p-2 shadow-2xl shadow-black/70">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-sm border border-[#72583d]/50 bg-[#e5d2a9]/90 px-3 py-1.5 text-sm font-semibold text-[#493426] shadow hover:bg-[#f1e1bd]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {t("menu.back")}
        </button>
        <div className="grid h-[min(78vh,42rem)] grid-cols-2 overflow-hidden bg-[#e6d4aa] text-[#3e2c20]">
          <section className="relative overflow-hidden border-r border-[#8a6b47]/40 bg-[linear-gradient(90deg,#cdb88c_0%,#eadbb8_8%,#eadbb8_92%,#c8ae7b_100%)] px-6 pb-9 pt-7 md:px-9">
            <p className="text-center font-serif text-2xl font-semibold md:text-3xl">{t("ui.diary")}</p>
            <p className="mt-1 text-center text-xs uppercase tracking-[.2em] text-[#765d43]">{t("diaryBook.shared")}</p>
            <div className="mt-4 grid gap-0.5 md:mt-5">
              <button
                type="button"
                onClick={() => setSelectedEntry("introduction")}
                className={`border-b border-[#8e7457]/30 px-3 py-1.5 text-left font-serif italic transition ${selectedEntry === "introduction" ? "translate-x-1 bg-[#806044]/10 font-semibold text-[#5b3528]" : "hover:bg-[#806044]/10"}`}
              >
                00 · {t("diaryBook.introduction")}
              </button>
              {entries.map((entryId, index) => {
                const found = foundEntries.has(entryId);
                const label = found ? t(`storyNotes.${entryId}.title`) : t("diaryBook.undiscovered");
                return (
                  <button
                    key={entryId}
                    type="button"
                    disabled={!found}
                    onClick={() => setSelectedEntry(entryId)}
                    className={`border-b border-[#8e7457]/30 px-3 py-1.5 text-left font-serif italic transition ${selectedEntry === entryId ? "translate-x-1 bg-[#806044]/10 font-semibold text-[#5b3528]" : found ? "hover:bg-[#806044]/10" : "cursor-default text-[#756957]/45"}`}
                  >
                    {String(index + 1).padStart(2, "0")} · {label}
                  </button>
                );
              })}
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center font-serif text-xs text-[#806b50]">1</p>
          </section>
          <article className="relative overflow-hidden bg-[repeating-linear-gradient(0deg,transparent_0,transparent_32px,rgba(98,111,111,.13)_33px),linear-gradient(90deg,#c8ae7b_0%,#f0e2bf_8%,#ead8ad_100%)] p-6 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8b5d4d]">{author}</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold italic text-[#4d3328] md:text-3xl">{title}</h2>
            <p className="mt-5 whitespace-pre-line font-serif text-sm italic leading-7 text-[#4e3c30] md:mt-7 md:text-lg md:leading-[2.05rem]">
              {body}
            </p>
            <p className="mt-6 text-right font-serif text-sm italic text-[#806b50]">
              {isIntroduction ? "" : `— ${author}`}
            </p>
            <p className="absolute bottom-4 left-0 right-0 text-center font-serif text-xs text-[#806b50]">2</p>
          </article>
        </div>
      </div>
    </>
  );
};

const PauseOverlay = ({
  view,
  setView,
  diaryEntries,
  hintHistory,
  isAdmin,
  onRequestHint,
  onResume,
  onExit,
  audioSettings,
  onAudioSettingChange,
  mouseSensitivity,
  onMouseSensitivityChange,
  onLanguageChange,
}) => (
  <div className="absolute inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black/75 p-3 text-amber-50 backdrop-blur-sm sm:p-4">
    <div
      className={`w-full rounded-sm border border-[#d7b77b]/40 bg-[#211916]/95 shadow-2xl shadow-black/60 ${view === "settings" || view === "diary" || view === "controls" ? "max-w-5xl" : "max-w-lg"} ${view === "diary" ? "p-2" : "p-4 sm:p-5"}`}
    >
      {view === "menu" ? (
        <>
          <h1 className="text-center font-serif text-3xl font-semibold">{t("ui.pause")}</h1>
          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onPointerDown={onResume}
              className="rounded-lg bg-amber-200 px-5 py-3 font-semibold text-stone-900 hover:bg-amber-100"
            >
              {t("ui.resume")}
            </button>
            <button
              type="button"
              onClick={() => setView("diary")}
              className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10"
            >
              {t("ui.diary")}
            </button>
            <button
              type="button"
              onClick={onRequestHint}
              className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10"
            >
              {t("hints.request")}
            </button>
            <button
              type="button"
              onClick={() => setView("settings")}
              className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10"
            >
              {t("menu.settings")}
            </button>
            <button
              type="button"
              onClick={() => setView("controls")}
              className="rounded-lg border border-amber-100/35 px-5 py-3 font-semibold hover:bg-amber-50/10"
            >
              {t("ui.controls")}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="rounded-lg border border-red-300/35 px-5 py-3 font-semibold text-red-100 hover:bg-red-400/10"
            >
              {t("ui.exitGame")}
            </button>
          </div>
        </>
      ) : view === "diary" ? (
        <DiaryBook diaryEntries={diaryEntries} onBack={() => setView("menu")} />
      ) : view === "hints" ? (
        <>
          <h1 className="font-serif text-3xl font-semibold">{t("hints.title")}</h1>
          <p className="mt-2 text-sm text-amber-100/65">{t("hints.private")}</p>
          <div className="mt-5 max-h-[45vh] space-y-3 overflow-y-auto">
            {hintHistory.map((hint) => (
              <article
                key={hint.id}
                className="rounded border border-amber-100/20 bg-black/20 px-4 py-3 font-serif leading-relaxed"
              >
                {hint.text}
              </article>
            ))}
          </div>
          <button
            type="button"
            onClick={onRequestHint}
            className="mt-5 w-full rounded-lg bg-amber-200 px-5 py-3 font-semibold text-stone-900 hover:bg-amber-100"
          >
            {t("hints.another")}
          </button>
          <BackButton onClick={() => setView("menu")} />
        </>
      ) : view === "controls" ? (
        <>
          <ControlsPanel isAdmin={isAdmin} />
          <BackButton onClick={() => setView("menu")} />
        </>
      ) : (
        <>
          <SettingsPanel
            audioSettings={audioSettings}
            onAudioSettingChange={onAudioSettingChange}
            mouseSensitivity={mouseSensitivity}
            onMouseSensitivityChange={onMouseSensitivityChange}
            onLanguageChange={onLanguageChange}
          />
          <BackButton onClick={() => setView("menu")} />
        </>
      )}
    </div>
  </div>
);

export default PauseOverlay;
