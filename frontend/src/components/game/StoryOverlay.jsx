import { t } from "../../translations/index.js";

const StoryOverlay = ({ character, onContinue }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/85 p-3 text-amber-50 sm:p-6">
    <div className="max-h-[calc(100dvh-1.5rem)] max-w-2xl overflow-y-auto border border-amber-100/25 bg-[#211712] p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-amber-300">{t("ui.story")}</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl">{t(`story.${character === "mum" ? "mumTitle" : "dadTitle"}`)}</h1>
      <p className="mt-4 font-serif text-base italic leading-relaxed text-amber-50/85 sm:mt-5 sm:text-lg">
        {t(`story.${character === "mum" ? "mum" : "dad"}`)}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-7 w-full bg-amber-200 px-5 py-3 font-semibold text-stone-900"
      >
        {t("ui.continue")}
      </button>
    </div>
  </div>
);

export default StoryOverlay;
