import { createElement } from "react";
import { Eye, Footprints, Hand, Menu, MousePointer2 } from "lucide-react";
import { t } from "../../translations/index.js";

const groups = [
  { title: "settingsScreen.movement", icon: Footprints, indices: [0, 3, 4, 5] },
  { title: "settingsScreen.interaction", icon: Hand, indices: [1, 2, 6, 7, 8] },
  { title: "settingsScreen.interface", icon: Menu, indices: [9, 10] },
];
const keys = ["W A S D", "Mouse", "E", "Ctrl", "Shift", "Space", "Q", "1–8 / wheel", "I / R", "F", "Esc"];
const icons = [Footprints, MousePointer2, Hand, Footprints, Footprints, Footprints, Eye, Hand, Eye, Eye, Menu];

const ControlsPanel = ({ isAdmin = false }) => <>
  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">{t("menu.controls")}</p>
  <h1 className="mt-2 font-serif text-4xl text-[#f5e8ce]">{t("menu.howToPlay")}</h1>
  <p className="mt-2 text-sm text-[#aa9b84]">{t("settingsScreen.controlsDescription")}</p>
  <div className="mt-7 grid gap-4 md:grid-cols-2">
    {groups.map((group, groupIndex) => <section key={group.title} className={`rounded border border-[#6f5940]/50 bg-[#171210]/70 p-5 ${groupIndex === 1 ? "md:row-span-2" : ""}`}>
      <h2 className="flex items-center gap-2 border-b border-[#675641]/45 pb-3 font-serif text-xl text-[#e7c17d]">{createElement(group.icon, { size: 19 })}{t(group.title)}</h2>
      <div className="mt-3 space-y-2.5">
        {group.indices.filter((index) => isAdmin || index !== 9).map((index) => {
          const ItemIcon = icons[index];
          return <div key={keys[index]} className="grid grid-cols-[1.4rem_minmax(5rem,auto)_1fr] items-center gap-3 rounded bg-black/15 px-3 py-2.5">
            <ItemIcon size={16} className="text-[#9f8968]" />
            <kbd className="w-fit rounded border border-[#806644] bg-[#251a14] px-2 py-1 font-mono text-xs font-bold text-[#f0c87d] shadow-[inset_0_-2px_0_rgb(0_0_0/.35)]">{keys[index]}</kbd>
            <span className="text-sm text-[#d5c6aa]">{t("menu.controlsList")[index]}</span>
          </div>;
        })}
      </div>
    </section>)}
  </div>
</>;

export default ControlsPanel;
