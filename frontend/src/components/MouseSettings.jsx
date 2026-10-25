import { Minus, Plus } from "lucide-react";
import { t } from "../translations/index.js";

const MouseSettings = ({ idPrefix = "mouse", sensitivity, onChange }) => {
  const min = 0.2;
  const max = 2;
  const step = 0.1;

  const changeSensitivity = (amount) => {
    const newValue = Math.max(min, Math.min(max, Math.round((sensitivity + amount) * 10) / 10));

    onChange(newValue);
  };

  return (
    <div className="pt-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <label className="font-bold text-[#ead8b5]" htmlFor={`${idPrefix}-sensitivity`}>
            {t("menu.mouseSensitivity")}
          </label>

          <p className="mt-1 text-sm text-[#a99a83]">{t("menu.mouseDescription")}</p>
        </div>

        <span className="min-w-12 text-right font-mono text-sm text-[#e7c17d]">{sensitivity.toFixed(1)}×</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t("menu.lowerSensitivity")}
          onClick={() => changeSensitivity(-step)}
          disabled={sensitivity <= min}
          className="text-[#9d8a6d] transition-colors hover:text-[#e7c17d] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={18} />
        </button>

        <input
          id={`${idPrefix}-sensitivity`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={sensitivity}
          className="h-2 w-full cursor-pointer accent-[#d99b55]"
          onChange={(event) => onChange(Number(event.target.value))}
        />

        <button
          type="button"
          aria-label={t("menu.raiseSensitivity")}
          onClick={() => changeSensitivity(step)}
          disabled={sensitivity >= max}
          className="text-[#e7c17d] transition-colors hover:text-[#f5d49a] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};

export default MouseSettings;
