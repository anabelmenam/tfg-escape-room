import { Minus, Plus } from "lucide-react";
import { t } from "../../../translations/index.js";

const VolumeControl = ({ id, label, description, value, onChange }) => {
  const step = 0.05;

  const changeVolume = (amount) => {
    const newValue = Math.max(0, Math.min(1, Math.round((value + amount) * 100) / 100));

    onChange(newValue);
  };

  return (
    <div className="border-b border-[#675641]/55 py-3 last:border-b-0">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <label className="font-bold text-[#ead8b5]" htmlFor={id}>
            {label}
          </label>
          <p className="mt-0.5 text-xs leading-snug text-[#a99a83] sm:text-sm">{description}</p>
        </div>

        <span className="min-w-12 text-right font-mono text-sm text-[#e7c17d]">{Math.round(value * 100)}%</span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={t("menu.lowerVolume").replace("{label}", label)}
          onClick={() => changeVolume(-step)}
          disabled={value <= 0}
          className="text-[#9d8a6d] transition-colors hover:text-[#e7c17d] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={16} />
        </button>

        <input
          id={id}
          type="range"
          min="0"
          max="1"
          step={step}
          value={value}
          className="h-1.5 w-full cursor-pointer accent-[#d99b55]"
          onChange={(event) => onChange(Number(event.target.value))}
        />

        <button
          type="button"
          aria-label={t("menu.raiseVolume").replace("{label}", label)}
          onClick={() => changeVolume(step)}
          disabled={value >= 1}
          className="text-[#e7c17d] transition-colors hover:text-[#f5d49a] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const AudioSettings = ({ idPrefix = "audio", settings, onChange }) => (
  <div>
    <VolumeControl
      id={`${idPrefix}-music-volume`}
      label={t("menu.music")}
      description={t("menu.musicDescription")}
      value={settings.music}
      onChange={(value) => onChange("music", value)}
    />

    <VolumeControl
      id={`${idPrefix}-effects-volume`}
      label={t("menu.effects")}
      description={t("menu.effectsDescription")}
      value={settings.effects}
      onChange={(value) => onChange("effects", value)}
    />

    <VolumeControl
      id={`${idPrefix}-footsteps-volume`}
      label={t("menu.footsteps")}
      description={t("menu.footstepsDescription")}
      value={settings.footsteps}
      onChange={(value) => onChange("footsteps", value)}
    />
  </div>
);

export default AudioSettings;
