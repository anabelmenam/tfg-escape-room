import { Minus, Plus } from "lucide-react";

const VolumeControl = ({ id, label, description, value, onChange }) => {
  const step = 0.05;

  const changeVolume = (amount) => {
    const newValue = Math.max(0, Math.min(1, Math.round((value + amount) * 100) / 100));

    onChange(newValue);
  };

  return (
    <div className="border-b border-[#675641]/55 py-5 last:border-b-0">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <label className="font-bold text-[#ead8b5]" htmlFor={id}>
            {label}
          </label>
          <p className="mt-1 text-sm text-[#a99a83]">{description}</p>
        </div>

        <span className="min-w-12 text-right font-mono text-sm text-[#e7c17d]">{Math.round(value * 100)}%</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Bajar volumen de ${label}`}
          onClick={() => changeVolume(-step)}
          disabled={value <= 0}
          className="text-[#9d8a6d] transition-colors hover:text-[#e7c17d] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={18} />
        </button>

        <input
          id={id}
          type="range"
          min="0"
          max="1"
          step={step}
          value={value}
          className="h-2 w-full cursor-pointer accent-[#d99b55]"
          onChange={(event) => onChange(Number(event.target.value))}
        />

        <button
          type="button"
          aria-label={`Subir volumen de ${label}`}
          onClick={() => changeVolume(step)}
          disabled={value >= 1}
          className="text-[#e7c17d] transition-colors hover:text-[#f5d49a] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};

const AudioSettings = ({ idPrefix = "audio", settings, onChange }) => (
  <div>
    <VolumeControl
      id={`${idPrefix}-music-volume`}
      label="Música"
      description="Banda sonora ambiental."
      value={settings.music}
      onChange={(value) => onChange("music", value)}
    />

    <VolumeControl
      id={`${idPrefix}-effects-volume`}
      label="Interacciones"
      description="Puertas, interruptores, objetos y puzles."
      value={settings.effects}
      onChange={(value) => onChange("effects", value)}
    />

    <VolumeControl
      id={`${idPrefix}-footsteps-volume`}
      label="Pasos"
      description="Sonido del movimiento de los jugadores."
      value={settings.footsteps}
      onChange={(value) => onChange("footsteps", value)}
    />
  </div>
);

export default AudioSettings;
