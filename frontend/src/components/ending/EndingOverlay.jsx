import { t } from "../../translations/index.js";

const EndingOverlay = ({ ending, showLight, tourBeat, tourFade, character, endingPreview = false, onExit }) => {
  return (
    <>
      {showLight && <div className="ending-light-bloom pointer-events-none absolute inset-0 z-[65] bg-black" />}

      {tourBeat !== null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-[60] flex justify-center px-6">
          <p
            key={tourBeat}
            className="max-w-3xl animate-pulse bg-black/65 px-7 py-4 text-center font-serif text-xl italic leading-relaxed text-amber-50 shadow-2xl"
          >
            {t(`finalTour.line${tourBeat + 1}`)}
          </p>
        </div>
      )}

      <div
        className={`pointer-events-none absolute inset-0 z-[63] bg-black transition-opacity duration-500 ${tourFade ? "opacity-100" : "opacity-0"}`}
      />

      {["choice", "complete"].includes(ending?.phase) && (
        <div className="ending-screen-in absolute inset-0 z-[70] flex items-center justify-center overflow-hidden bg-white p-6 text-stone-900">
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(238,224,195,.92)_48%,rgba(40,29,24,.96)_100%)]" />
          <div className="ending-panel-in relative w-full max-w-3xl rounded-sm border border-stone-900/20 bg-[#efe4cd]/95 p-7 text-center shadow-2xl">
            {ending.phase === "complete" && (
              <div className="relative mx-auto aspect-[4/3] max-h-[46vh] overflow-hidden border-[10px] border-[#5a3d29] bg-stone-300 shadow-xl">
                <img
                  src="/images/puzzles/family-photo-1998.png"
                  alt={t("ending.familyPhotoAlt")}
                  className={`h-full w-full object-cover ${ending.choice === "sacrifice" ? "opacity-70 grayscale-[.25]" : ""}`}
                />
                {ending.choice === "sacrifice" && (
                  <div
                    className="absolute inset-y-0 bg-gradient-to-r from-white/85 via-white/60 to-transparent blur-[2px]"
                    style={{
                      left: ending.sacrificeCharacter === "mum" ? "26%" : "0%",
                      width: ending.sacrificeCharacter === "mum" ? "31%" : "29%",
                    }}
                  />
                )}
              </div>
            )}

            {ending.phase === "choice" ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[.38em] text-stone-600">Escape room</p>
                <h1 className="mt-5 font-serif text-7xl font-semibold tracking-[.18em]">{t("finalScreen.title")}</h1>
                <p className="mx-auto mt-6 max-w-xl font-serif text-xl italic leading-relaxed">
                  {t("finalScreen.text")}
                </p>
                <button
                  type="button"
                  onClick={onExit}
                  className="mt-9 bg-stone-800 px-10 py-4 font-semibold text-amber-50 hover:bg-stone-700"
                >
                  {t("finalScreen.back")}
                </button>
              </>
            ) : (
              <>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.28em] text-stone-600">{t("ending.title")}</p>
                <h1 className="mt-4 font-serif text-3xl">
                  {t(ending.choice === "together" ? "ending.togetherTitle" : "ending.sacrificeTitle")}
                </h1>
                <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic leading-relaxed">
                  {ending.choice === "together"
                    ? t("ending.togetherText")
                    : t(
                        ending.sacrificeCharacter === character ? "ending.youStayedText" : "ending.companionStayedText",
                      )}
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  {endingPreview && (
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="border border-stone-700 px-8 py-3 font-semibold hover:bg-stone-900/10"
                    >
                      Probar desde la puerta
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onExit}
                    className="bg-stone-800 px-8 py-3 font-semibold text-amber-50 hover:bg-stone-700"
                  >
                    {t("ending.returnToLobby")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EndingOverlay;
