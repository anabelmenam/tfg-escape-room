import { t } from "../../translations/index.js";

const GameLoadingSkeleton = () => (
  <div
    className="absolute inset-0 z-50 overflow-hidden bg-[#100d0c] text-[#f2e7d1]"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span className="sr-only">{t("menu.preparing")} {t("menu.loading")}</span>

    <div className="flex h-full w-full items-end justify-center px-5 pb-5 sm:px-8 sm:pb-7">
      <div className="grid w-full max-w-4xl animate-pulse grid-cols-8 gap-1.5 sm:gap-2.5" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="aspect-square rounded border border-[#d7b77b]/20 bg-[#9b8065]/25"
          />
        ))}
      </div>
    </div>
  </div>
);

export default GameLoadingSkeleton;
