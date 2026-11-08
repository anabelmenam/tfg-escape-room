import { getLanguage } from "../../translations/index.js";

const AppLoadingSkeleton = () => (
  <main
    className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#110f10] px-4 py-4 text-[#f2e7d1] before:pointer-events-none before:absolute before:inset-6 before:border before:border-[#d5b67c]/20 after:pointer-events-none after:absolute after:inset-8 after:border after:border-[#d5b67c]/[.08] sm:px-5"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span className="sr-only">{getLanguage() === "es" ? "Cargando…" : "Loading…"}</span>

    <section
      className="relative z-10 w-full max-w-lg animate-pulse rounded-sm border border-[#d7b77b]/40 bg-[#211916]/95 p-5 shadow-2xl shadow-black/60 sm:p-7"
      aria-hidden="true"
    >
      <div className="mx-auto mb-5 h-3 w-36 rounded-sm bg-[#d8aa64]/25" />
      <div className="mx-auto mb-5 h-20 w-64 max-w-[80%] rounded-sm bg-[#d7b77b]/15" />
      <div className="mx-auto mb-10 h-4 w-80 max-w-[90%] rounded-sm bg-[#c9ba9e]/15" />

      <div className="mx-auto flex max-w-sm flex-col gap-3">
        <div className="h-12 rounded-sm bg-[#bd7939]/35" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-12 rounded-sm border border-[#9a8061]/20 bg-[#171210]/75" />
        ))}
      </div>

      <div className="mt-8 flex justify-between border-t border-[#675641]/50 pt-5">
        <div className="h-4 w-28 rounded-sm bg-[#958772]/20" />
        <div className="h-4 w-16 rounded-sm bg-[#958772]/20" />
      </div>
    </section>
  </main>
);

export default AppLoadingSkeleton;
