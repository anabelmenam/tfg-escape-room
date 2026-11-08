import { createElement } from "react";
import { Eye, Footprints, Hand, Menu, MousePointer2 } from "lucide-react";
import { t } from "../../translations/index.js";

const groups = [
  { title: "settingsScreen.movement", icon: Footprints, indexes: [0, 3, 4, 5] },
  { title: "settingsScreen.interaction", icon: Hand, indexes: [1, 2, 6, 7, 8] },
  { title: "settingsScreen.interface", icon: Menu, indexes: [9, 10] },
];
const keys = ["W A S D", "Mouse", "E", "Ctrl", "Shift", "Space", "Q", "1–8 / wheel", "R", "F", "Esc"];
const icons = [Footprints, MousePointer2, Hand, Footprints, Footprints, Footprints, Eye, Hand, Eye, Eye, Menu];

const ControlsPanel = ({ isAdmin = false }) => (
  <>
    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">{t("menu.controls")}</p>
    <h1 className="mt-1 font-serif text-3xl text-[#f5e8ce] sm:text-4xl">{t("menu.howToPlay")}</h1>
    <p className="mt-1 text-xs text-[#aa9b84] sm:text-sm">{t("settingsScreen.controlsDescription")}</p>
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {groups.map((group, groupIndex) => (
        <section
          key={group.title}
          className={`rounded border border-[#6f5940]/50 bg-[#171210]/70 p-3.5 ${groupIndex === 1 ? "md:row-span-2" : ""}`}
        >
          <h2 className="flex items-center gap-2 border-b border-[#675641]/45 pb-2 font-serif text-lg text-[#e7c17d]">
            {createElement(group.icon, { size: 17 })}
            {t(group.title)}
          </h2>
          <div className="mt-2 space-y-1.5">
            {group.indexes
              .filter((index) => isAdmin || index !== 9)
              .map((index) => {
                const ItemIcon = icons[index];
                return (
                  <div
                    key={keys[index]}
                    className="grid grid-cols-[1.1rem_minmax(4.5rem,auto)_1fr] items-center gap-2 rounded bg-black/15 px-2 py-1.5"
                  >
                    <ItemIcon size={14} className="text-[#9f8968]" />
                    <kbd className="w-fit rounded border border-[#806644] bg-[#251a14] px-1.5 py-0.5 font-mono text-[0.68rem] font-bold text-[#f0c87d] shadow-[inset_0_-1px_0_rgb(0_0_0/.35)]">
                      {keys[index]}
                    </kbd>
                    <span className="text-xs leading-tight text-[#d5c6aa] sm:text-sm">
                      {t("menu.controlsList")[index]}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  </>
);

export default ControlsPanel;
