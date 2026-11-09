import { useState } from "react";
import { ArrowLeft, CircleCheck, LockKeyhole, Mail, UserRound } from "lucide-react";
import { loginAccount, registerAccount, requestPasswordReset, resetPassword } from "../services/gameApi.js";
import { t } from "../translations/index.js";

const resetTokenFromUrl = () => new URLSearchParams(window.location.search).get("resetToken") ?? "";

const AccountAccess = ({ onAuthenticated }) => {
  const [resetToken] = useState(resetTokenFromUrl);
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };
  const returnToLogin = () => {
    window.location.replace(`${window.location.pathname}${window.location.hash}`);
  };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "forgot") {
        await requestPasswordReset(form.email);
        setMessage(t("account.resetEmailSent"));
      } else if (mode === "reset") {
        if (form.password !== form.confirmPassword) throw new Error("PASSWORDS_DO_NOT_MATCH");
        await resetPassword(resetToken, form.password);
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
        setMode("resetComplete");
      } else {
        const result =
          mode === "register"
            ? await registerAccount(form)
            : await loginAccount({ email: form.email, password: form.password });
        onAuthenticated(result.user);
      }
    } catch (requestError) {
      const translated = t(`account.errors.${requestError.message}`);
      setError(translated.startsWith("account.errors.") ? t("account.errors.generic") : translated);
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "forgot"
      ? t("account.forgotTitle")
      : mode === "reset"
        ? t("account.resetTitle")
        : mode === "resetComplete"
          ? t("account.resetCompleteTitle")
          : t("menu.title");

  return (
    <main className="account-access relative flex h-dvh min-h-0 items-center justify-center overflow-hidden bg-[#110f10] px-5 py-6 text-[#f2e7d1] before:pointer-events-none before:absolute before:inset-6 before:border before:border-[#d5b67c]/20">
      <section className="account-access-panel relative z-10 w-full max-w-[26rem] border border-[#d7b77b]/40 bg-[#211916]/95 p-8 shadow-2xl shadow-black/60 sm:p-9">
        {(mode === "forgot" || mode === "reset") && (
          <button
            type="button"
            onClick={returnToLogin}
            className="account-access-back mb-5 flex items-center gap-2 text-sm font-semibold text-[#c9b998] hover:text-[#f5e8ce]"
          >
            <ArrowLeft size={17} />
            {t("account.backToLogin")}
          </button>
        )}
        <p className="account-access-eyebrow text-center text-xs font-bold uppercase tracking-[.24em] text-[#d8aa64]">
          {t("menu.cooperative")}
        </p>
        <img
          src="/logo/logo-name.png"
          alt=""
          aria-hidden="true"
          className="account-access-logo mx-auto mt-3 w-full max-w-[14rem] drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
        />
        <h1
          className={
            ["forgot", "reset", "resetComplete"].includes(mode)
              ? `account-access-title mt-3 text-center font-serif text-[#f5e8ce] ${
                  mode === "forgot" ? "text-3xl" : "text-4xl"
                }`
              : "sr-only"
          }
        >
          {title}
        </h1>

        {mode === "resetComplete" ? (
          <div className="mt-7 text-center">
            <CircleCheck className="mx-auto text-emerald-400" size={48} />
            <p className="mt-4 text-[#c9b998]">{t("account.resetCompleteDescription")}</p>
            <button
              type="button"
              onClick={returnToLogin}
              className="account-access-submit mt-6 w-full bg-[#bd7939] px-4 py-3 font-bold text-[#1d120b] hover:bg-[#d69851]"
            >
              {t("account.loginAction")}
            </button>
          </div>
        ) : (
          <>
            {!["forgot", "reset"].includes(mode) && (
              <div className="account-access-tabs mt-7 grid grid-cols-2 rounded border border-[#6f5940]/60 bg-[#120e0d] p-1">
                {["login", "register"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeMode(item)}
                    className={`rounded px-3 py-2 text-sm font-bold ${mode === item ? "bg-[#bd7939] text-[#1d120b]" : "text-[#bcae95]"}`}
                  >
                    {t(`account.${item}`)}
                  </button>
                ))}
              </div>
            )}
            {mode === "forgot" && (
              <p className="mt-5 text-sm leading-6 text-[#bcae95]">{t("account.forgotDescription")}</p>
            )}
            {mode === "reset" && (
              <p className="mt-5 text-sm leading-6 text-[#bcae95]">{t("account.resetDescription")}</p>
            )}
            <form className="account-access-form mt-6 space-y-4" onSubmit={submit}>
              {mode === "register" && (
                <label className="block text-sm font-semibold text-[#e4d2ae]">
                  <span className="mb-2 flex items-center gap-2">
                    <UserRound size={16} />
                    {t("account.name")}
                  </span>
                  <input
                    value={form.displayName}
                    onChange={update("displayName")}
                    maxLength={40}
                    required
                    className="account-access-input w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]"
                  />
                </label>
              )}
              {mode !== "reset" && (
                <label className="block text-sm font-semibold text-[#e4d2ae]">
                  <span className="mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    {t("account.email")}
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    required
                    autoComplete="email"
                    className="account-access-input w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]"
                  />
                </label>
              )}
              {mode !== "forgot" && (
                <label className="block text-sm font-semibold text-[#e4d2ae]">
                  <span className="mb-2 flex items-center gap-2">
                    <LockKeyhole size={16} />
                    {mode === "reset" ? t("account.newPassword") : t("account.password")}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={update("password")}
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="account-access-input w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]"
                  />
                </label>
              )}
              {mode === "reset" && (
                <label className="block text-sm font-semibold text-[#e4d2ae]">
                  <span className="mb-2 flex items-center gap-2">
                    <LockKeyhole size={16} />
                    {t("account.confirmPassword")}
                  </span>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={update("confirmPassword")}
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    className="account-access-input w-full border border-[#806644] bg-[#120e0d] px-4 py-3 outline-none focus:border-[#e0b968]"
                  />
                </label>
              )}
              {["register", "reset"].includes(mode) && (
                <p className="text-xs text-[#958772]">{t("account.passwordHint")}</p>
              )}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => changeMode("forgot")}
                  className="text-sm font-semibold text-[#d8aa64] hover:text-[#f0ca84]"
                >
                  {t("account.forgotPassword")}
                </button>
              )}
              {message && (
                <p
                  role="status"
                  className="border border-emerald-400/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100"
                >
                  {message}
                </p>
              )}
              {error && (
                <p role="alert" className="border border-red-400/35 bg-red-950/35 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}
              <button
                disabled={busy || Boolean(message)}
                className="account-access-submit w-full bg-[#bd7939] px-4 py-3 font-bold text-[#1d120b] hover:bg-[#d69851] disabled:opacity-50"
              >
                {busy ? t("account.working") : t(`account.${mode}Action`)}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default AccountAccess;
