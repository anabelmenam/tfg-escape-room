import { t } from "../../translations/index.js";

const GameHud = ({ showCrosshair }) => <>
  {showCrosshair && <div id="crosshair" className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />}
  <div id="story-note-notification" className="story-note-notification pointer-events-none absolute left-1/2 top-16 z-30 hidden w-[min(90vw,32rem)] -translate-x-1/2 rounded-sm border border-[#d7b77b]/45 bg-[#211916]/95 px-6 py-4 text-center font-serif text-amber-50 shadow-xl shadow-black/50" />
  <div id="ambient-inspection" className="pointer-events-none absolute bottom-40 left-1/2 z-20 hidden max-w-xl -translate-x-1/2 rounded border border-amber-100/20 bg-black/80 px-5 py-3 text-center font-serif italic text-amber-50" />
  <div id="interaction-text" className="pointer-events-none absolute bottom-32 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-black/70 px-4 py-2 text-lg font-semibold text-white" />
  <p id="inventory-selected-name" className="pointer-events-none absolute bottom-24 left-1/2 z-20 hidden -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-sm font-semibold text-amber-50" />
  <div id="inventory" className="pointer-events-none absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
    {[0, 1, 2, 3, 4].map((index) => <div key={index} id={`inventory-slot-${index}`} className="relative flex h-16 w-16 items-center justify-center rounded border-2 border-white/50 bg-[#9B8065]">
      <span className="absolute left-1 top-0.5 text-xs text-white/70">{index + 1}</span>
      <div id={`inventory-item-${index}`} className="flex h-full w-full items-center justify-center" />
    </div>)}
  </div>
  <div id="inventory-inspection" className="pointer-events-auto absolute inset-0 z-30 hidden items-center justify-center bg-black/80 p-8">
    <div className="relative max-h-full max-w-4xl rounded-lg border border-amber-100/30 bg-[#251913] p-4 shadow-2xl">
      <button id="inventory-inspection-close" type="button" aria-label={t("ui.close")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-xl font-semibold leading-none text-white hover:bg-black">×</button>
      <img id="inventory-inspection-image" className="max-h-[76vh] max-w-full object-contain" alt="" />
      <p id="inventory-inspection-title" className="mt-3 text-center text-lg font-semibold text-amber-50" />
      <p id="inventory-inspection-translation" className="mt-3 max-w-3xl text-center font-serif italic leading-relaxed text-amber-100/85" />
      <p id="inventory-inspection-hint" className="mt-1 text-center text-sm text-amber-100/70" />
    </div>
  </div>
</>;

export default GameHud;

