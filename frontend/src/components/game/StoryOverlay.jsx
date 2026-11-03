import { t } from "../../translations/index.js";

const StoryOverlay = ({ character, onContinue }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-6 text-amber-50">
    <div className="max-w-2xl border border-amber-100/25 bg-[#211712] p-8 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-amber-300">{t("ui.story")}</p>
      <h1 className="mt-3 font-serif text-4xl">{t(`story.${character === "mum" ? "mumTitle" : "dadTitle"}`)}</h1>
      <p className="mt-5 font-serif text-lg italic leading-relaxed text-amber-50/85">
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
