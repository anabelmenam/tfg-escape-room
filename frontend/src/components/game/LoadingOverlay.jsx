import { t } from "../../translations/index.js";

const LoadingOverlay = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#100d0c] text-amber-50">
    <div className="flex w-72 flex-col items-center text-center">
      <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-amber-100/15 border-t-amber-300" />
      <h1 className="font-serif text-2xl font-semibold tracking-wide">{t("menu.preparing")}</h1>
      <p className="mt-2 text-sm text-amber-100/65">{t("menu.loading")}</p>
      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-amber-50/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-300/70" />
      </div>
    </div>
  </div>
);

export default LoadingOverlay;
