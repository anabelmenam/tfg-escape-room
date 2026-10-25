import { t } from "../../translations/index.js";

const NEXT_AREA = { bedroom: "hallway", hallway: "children", children: "bathroom", bathroom: "kitchen", kitchen: "bedroom" };
const currentCharacter = (session) => session.character ?? (session.character === "mum" ? "mum" : "dad");

const TestModePanel = ({ session }) => (
  <div className="absolute left-4 top-4 z-20 rounded border border-amber-200/40 bg-black/80 p-3 text-sm text-amber-50">
    <p className="font-bold">{t("menu.tests")} · {session.endingPreview ? t("menu.final") : session.testArea === "icons" ? t("menu.iconStudio") : `${t(`characterSelection.${currentCharacter(session) === "mum" ? "mama" : "papa"}`)} · ${t(`menu.areas.${session.testArea}`)}`}</p>
    <p className="mt-1 text-xs">{t("menu.releaseCursor")}</p>
    <div className="mt-2 flex gap-4 underline">
      {session.testArea !== "icons" && <>
        <a href={`?character=${currentCharacter(session) === "mum" ? "dad" : "mum"}&area=${session.testArea}`}>{t("menu.changeWorld")}</a>
        <a href={`?character=${currentCharacter(session)}&area=${NEXT_AREA[session.testArea]}`}>{t("menu.changeArea")}</a>
      </>}
      <a href={window.location.pathname}>{t("menu.exitTests")}</a>
    </div>
  </div>
);

export default TestModePanel;
