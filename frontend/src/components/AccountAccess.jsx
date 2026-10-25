import { useState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { loginAccount, registerAccount } from "../services/gameApi.js";
import { t } from "../translations/index.js";

const AccountAccess = ({ onAuthenticated }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = mode === "register" ? await registerAccount(form) : await loginAccount({ email: form.email, password: form.password });
      onAuthenticated(result.user);
    } catch (requestError) { setError(t(`account.errors.${requestError.message}`)); }
    finally { setBusy(false); }
  };
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#110f10] px-5 py-10 text-[#f2e7d1] before:pointer-events-none before:absolute before:inset-6 before:border before:border-[#d5b67c]/20" style={{ backgroundImage: "radial-gradient(circle at 14% 10%, rgb(126 69 33 / 35%), transparent 31%), radial-gradient(circle at 86% 85%, rgb(68 91 95 / 25%), transparent 34%)" }}>
    <section className="relative z-10 w-full max-w-md border border-[#d7b77b]/40 bg-[#211916]/95 p-8 shadow-2xl shadow-black/60 sm:p-10">
      <p className="text-center text-xs font-bold uppercase tracking-[.24em] text-[#d8aa64]">{t("menu.cooperative")}</p><h1 className="mt-3 text-center font-serif text-4xl text-[#f5e8ce]">{t("menu.title")}</h1>
      <div className="mt-7 grid grid-cols-2 rounded border border-[#6f5940]/60 bg-[#120e0d] p-1">{["login", "register"].map((item) => <button key={item} type="button" onClick={() => { setMode(item); setError(""); }} className={`rounded px-3 py-2 text-sm font-bold ${mode === item ? "bg-[#bd7939] text-[#1d120b]" : "text-[#bcae95]"}`}>{t(`account.${item}`)}</button>)}</div>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        {mode === "register" && <label className="block text-sm font-semibold text-[#e4d2ae]"><span className="mb-2 flex items-center gap-2"><UserRound size={16} />{t("account.name")}</span><input value={form.displayName} onChange={update("displayName")} maxLength={40} required className="w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]" /></label>}
        <label className="block text-sm font-semibold text-[#e4d2ae]"><span className="mb-2 flex items-center gap-2"><Mail size={16} />{t("account.email")}</span><input type="email" value={form.email} onChange={update("email")} required autoComplete="email" className="w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]" /></label>
        <label className="block text-sm font-semibold text-[#e4d2ae]"><span className="mb-2 flex items-center gap-2"><LockKeyhole size={16} />{t("account.password")}</span><input type="password" value={form.password} onChange={update("password")} minLength={8} maxLength={128} required autoComplete={mode === "register" ? "new-password" : "current-password"} className="w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]" /></label>
        {mode === "register" && <p className="text-xs text-[#958772]">{t("account.passwordHint")}</p>}{error && <p role="alert" className="border border-red-400/35 bg-red-950/35 px-3 py-2 text-sm text-red-200">{error.startsWith("account.errors.") ? t("account.errors.generic") : error}</p>}
        <button disabled={busy} className="w-full bg-[#bd7939] px-4 py-3 font-bold text-[#1d120b] hover:bg-[#d69851] disabled:opacity-50">{busy ? t("account.working") : t(`account.${mode}Action`)}</button>
      </form>
    </section>
  </main>;
};

export default AccountAccess;
