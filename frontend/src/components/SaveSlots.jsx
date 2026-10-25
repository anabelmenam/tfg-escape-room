import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { createGameRoom, deleteGameRoom, getSaveSlots, joinGameRoom } from "../services/gameApi.js";
import { t } from "../translations/index.js";

const SaveSlots = ({ onContinue, onBack }) => {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const load = () => getSaveSlots().then(({ slots: saved }) => setSlots(saved));
  useEffect(() => { void load(); }, []);
  const slotAt = (number) => slots.find((slot) => slot.slotNumber === number);
  const openSlot = (number) => { setSelected(number); setMode("create"); setName(""); setCode(""); setError(""); };
  const closeSlot = () => { if (!submitting) { setSelected(null); setError(""); } };
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true); setError("");
    try { onContinue(mode === "create" ? await createGameRoom(selected, name.trim() || t("account.defaultGame")) : await joinGameRoom(code.trim().toUpperCase(), selected)); }
    catch (requestError) { const message = t(`account.errors.${requestError.message}`); setError(message.startsWith("account.errors.") ? t("account.errors.generic") : message); setSubmitting(false); }
  };
  useEffect(() => {
    if (!deleteTarget) return undefined;
    const closeWithEscape = (event) => { if (event.key === "Escape" && !deleting) setDeleteTarget(null); };
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [deleteTarget, deleting]);
  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true); setDeleteError("");
    try { await deleteGameRoom(deleteTarget.roomId); await load(); setDeleteTarget(null); }
    catch (requestError) { const message = t(`account.errors.${requestError.message}`); setDeleteError(message.startsWith("account.errors.") ? t("account.errors.generic") : message); }
    finally { setDeleting(false); }
  };
  return <div>
    {selected === null ? <>
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-[#c9ba9e] transition hover:text-[#f5e8ce]"><ArrowLeft size={17} />{t("menu.back")}</button>
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.24em] text-[#d8aa64]">{t("account.savedGames")}</p><h1 className="mt-2 font-serif text-4xl text-[#f5e8ce]">{t("account.chooseSlot")}</h1></div><span className="text-sm text-[#958772]">{slots.length}/3</span></div>
      <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((number) => { const slot = slotAt(number); return <article key={number} className="flex min-h-56 flex-col border border-[#6f5940]/55 bg-[#171210]/75 p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#9f8968]">{t("account.slot")} {number}</p>{slot ? <><h2 className="mt-4 font-serif text-2xl text-[#f2dfbd]">{slot.name}</h2><p className="mt-2 text-sm text-[#bcae95]">{t(`account.status.${slot.status}`)}</p><p className="mt-1 font-mono text-xs tracking-widest text-[#d8aa64]">{slot.joinCode}</p><div className="mt-auto flex gap-2 pt-6"><button type="button" onClick={() => onContinue(slot.status === "finished" ? { ...slot, endingPreview: true, endingReplay: true, testArea: "hallway" } : slot)} className="flex-1 bg-[#bd7939] px-3 py-2 font-bold text-[#1d120b]">{t(slot.status === "finished" ? "menu.viewEnding" : "account.continue")}</button><button type="button" aria-label={t("account.delete")} onClick={() => { setDeleteTarget(slot); setDeleteError(""); }} className="border border-red-300/30 px-3 text-red-200 transition hover:border-red-300/70 hover:bg-red-950/30"><Trash2 size={17} /></button></div></> : <button type="button" onClick={() => openSlot(number)} className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 border border-dashed border-[#806644] text-[#a99a83] hover:border-[#d7b77b] hover:text-[#f2dfbd]"><Plus /><span>{t("account.emptySlot")}</span></button>}</article>; })}</div>
    </> : <section className="mx-auto max-w-xl py-2">
      <button type="button" disabled={submitting} onClick={closeSlot} className="mb-8 flex items-center gap-2 text-sm text-[#c9ba9e] transition hover:text-[#f5e8ce] disabled:opacity-40"><ArrowLeft size={17} />{t("menu.back")}</button>
      <p className="text-xs font-bold uppercase tracking-[.24em] text-[#d8aa64]">{t("account.slot")} {selected}</p>
      <h1 className="mt-2 font-serif text-4xl text-[#f5e8ce]">{t("createGameScreen.title")}</h1>
      <p className="mt-3 text-[#a99a83]">{t("createGameScreen.description")}</p>
      <div className="mt-8 grid grid-cols-2 gap-2 rounded border border-[#6f5940]/55 bg-[#120e0d] p-1">{["create", "join"].map((item) => <button key={item} type="button" disabled={submitting} onClick={() => { setMode(item); setError(""); }} className={`px-4 py-3 text-sm font-bold transition ${mode === item ? "bg-[#bd7939] text-[#1d120b]" : "text-[#c9ba9e] hover:bg-[#2a1d17]"}`}>{t(`account.${item}Game`)}</button>)}</div>
      <div className="mt-6 border border-[#6f5940]/55 bg-[#171210]/75 p-6">{mode === "create" ? <label className="block text-sm font-semibold text-[#e4d2ae]">{t("account.gameName")}<input autoFocus className="mt-2 w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]" value={name} maxLength={50} placeholder={t("account.defaultGame")} onChange={(event) => setName(event.target.value)} /></label> : <label className="block text-sm font-semibold text-[#e4d2ae]">{t("createGameScreen.roomCode")}<input autoFocus className="mt-2 w-full border border-[#806644] bg-[#120e0d] px-4 py-3 font-mono uppercase tracking-[.2em] outline-none focus:border-[#e0b968]" value={code} maxLength={6} placeholder="ABC123" onChange={(event) => setCode(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} /></label>}{error && <p className="mt-4 border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}<button type="button" disabled={submitting || (mode === "join" && code.length !== 6)} onClick={submit} className="mt-6 w-full bg-[#bd7939] px-5 py-3 font-bold text-[#1d120b] transition hover:bg-[#d69851] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? t("account.working") : t(`account.${mode}Action`)}</button></div>
    </section>}
    {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-game-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setDeleteTarget(null); }}><section className="relative w-full max-w-md overflow-hidden border border-red-300/30 bg-[#211916] p-7 shadow-2xl shadow-black"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500/70 to-transparent" /><button type="button" disabled={deleting} aria-label={t("ui.close")} onClick={() => setDeleteTarget(null)} className="absolute right-4 top-4 text-[#958772] transition hover:text-[#f5e8ce] disabled:opacity-40"><X size={21} /></button><div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-300/30 bg-red-950/40 text-red-200"><AlertTriangle size={24} /></div><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-red-300/80">{t("deleteModal.dangerZone")}</p><h2 id="delete-game-title" className="mt-2 font-serif text-3xl text-[#f5e8ce]">{t("deleteModal.title")}</h2><p className="mt-2 text-lg text-[#e6d3b2]">{deleteTarget.name}</p><p className="mt-4 leading-relaxed text-[#bcae95]">{t("account.deleteConfirm")}</p>{deleteError && <p className="mt-4 border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{deleteError}</p>}<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="border border-[#806644] px-5 py-2.5 font-bold text-[#e4d2ae] transition hover:border-[#d7b77b] disabled:opacity-40">{t("deleteModal.cancel")}</button><button type="button" disabled={deleting} onClick={remove} className="bg-red-800 px-5 py-2.5 font-bold text-red-50 transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">{deleting ? t("deleteModal.deleting") : t("deleteModal.confirm")}</button></div></section></div>}
  </div>;
};

export default SaveSlots;
