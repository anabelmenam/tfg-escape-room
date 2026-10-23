import { useState } from "react";
import { createGameRoom, joinGameRoom } from "../services/gameApi";
import AudioSettings from "./AudioSettings";
import MouseSettings from "./MouseSettings";
import LanguageSettings from "./LanguageSettings";

const controls = [
  ["W A S D", "Moverse"],
  ["Ratón", "Mirar y seleccionar"],
  ["E", "Interactuar, recoger o colocar"],
  ["Ctrl", "Correr"],
  ["Mayús", "Agacharse o levantarse"],
  ["Espacio", "Saltar"],
  ["Q", "Encender o apagar la linterna"],
  ["1–5 / rueda", "Cambiar objeto del inventario"],
  ["I / R", "Examinar ciertos objetos"],
  ["F", "Cambiar la vista"],
  ["Esc", "Pausar o cerrar una inspección"],
];

const testAreas = [
  ["bedroom", "Dormitorio"],
  ["hallway", "Pasillo"],
  ["children", "Infantil"],
  ["bathroom", "Baño"],
  ["kitchen", "Cocina"],
];

const MenuButton = ({ children, secondary = false, onClick }) => (
  <button
    type="button"
    className={`w-full rounded-sm border px-5 py-3 text-left font-bold uppercase tracking-[0.14em] transition ${secondary ? "border-[#9a8061]/60 bg-[#171210]/75 text-[#e4d2ae] hover:border-[#d7b77b] hover:bg-[#302119]" : "border-[#d99b55] bg-[#bd7939] text-[#1d120b] hover:bg-[#d69851]"}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const Lobby = ({ onEnterLobby, audioSettings, onAudioSettingChange, mouseSensitivity, onMouseSensitivityChange, onLanguageChange }) => {
  const [view, setView] = useState("menu");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const validName = name.trim().length > 0;

  const createRoom = async () => {
    if (!validName) return;
    setStatus("creating");
    setError("");
    try {
      onEnterLobby(await createGameRoom(name.trim()));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStatus("idle");
    }
  };

  const joinRoom = async () => {
    if (!validName || joinCode.length !== 6) return;
    setStatus("joining");
    setError("");
    try {
      onEnterLobby(await joinGameRoom(joinCode, name.trim()));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#110f10] px-5 py-10 text-[#f2e7d1] before:pointer-events-none before:absolute before:inset-6 before:border before:border-[#d5b67c]/20 after:pointer-events-none after:absolute after:inset-8 after:border after:border-[#d5b67c]/[.08]" style={{ backgroundImage: "radial-gradient(circle at 14% 10%, rgb(126 69 33 / 35%), transparent 31%), radial-gradient(circle at 86% 85%, rgb(68 91 95 / 25%), transparent 34%)" }}>
      <section className={`relative z-10 w-full rounded-sm border border-[#d7b77b]/40 bg-[#211916]/95 p-7 shadow-2xl shadow-black/60 sm:p-10 ${view === "play" && import.meta.env.DEV ? "max-w-4xl" : "max-w-lg"}`}>
        {view !== "menu" && <button type="button" className="mb-6 text-sm text-[#c9ba9e] transition hover:text-[#f5e8ce]" onClick={() => { setView("menu"); setError(""); }}>← Volver</button>}

        {view === "menu" && (
          <>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">Escape room cooperativo</p>
            <h1 className="mb-4 text-center font-serif text-5xl leading-none text-[#f5e8ce] sm:text-6xl">La casa entre mundos</h1>
            <p className="mx-auto mb-10 max-w-md text-center leading-relaxed text-[#c9ba9e]">Dos jugadores. Dos realidades paralelas. Una misma casa que nunca cuenta toda la verdad.</p>
            <div className="mx-auto flex max-w-sm flex-col gap-3">
              <MenuButton onClick={() => setView("play")}>Jugar</MenuButton>
              <MenuButton secondary onClick={() => setView("settings")}>Ajustes</MenuButton>
              <MenuButton secondary onClick={() => setView("controls")}>Controles</MenuButton>
            </div>
            <div className="mx-auto mt-6 max-w-sm"><LanguageSettings onChange={onLanguageChange} /></div>
          </>
        )}

        {view === "play" && (
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">Jugar</p>
            <h1 className="mb-7 font-serif text-4xl text-[#f5e8ce]">Entra en la casa</h1>
            <label className="mb-2 block text-sm font-semibold text-[#e4d2ae]" htmlFor="player-name">Tu nombre</label>
            <input id="player-name" className="mb-5 w-full rounded-sm border border-[#806644] bg-[#120e0d] px-4 py-3 text-lg tracking-wide text-[#f6ead1] outline-none transition placeholder:text-[#877862] focus:border-[#e0b968] focus:ring-1 focus:ring-[#e0b968]" value={name} maxLength={40} placeholder="Escribe tu nombre" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && createRoom()} />
            <button type="button" className="w-full rounded-sm bg-[#bd7939] px-4 py-3 font-bold text-[#1d120b] transition hover:bg-[#d69851] disabled:cursor-not-allowed disabled:bg-[#69513a] disabled:text-[#b6a38d]" disabled={!validName || status !== "idle"} onClick={createRoom}>{status === "creating" ? "Creando sala…" : "Crear sala"}</button>
            <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-widest text-[#8e7e68] before:h-px before:flex-1 before:bg-[#675641] after:h-px after:flex-1 after:bg-[#675641]"><span>o únete a una partida</span></div>
            <label className="mb-2 block text-sm font-semibold text-[#e4d2ae]" htmlFor="room-code-input">Código de sala</label>
            <div className="flex gap-2">
              <input id="room-code-input" className="min-w-0 flex-1 rounded-sm border border-[#806644] bg-[#120e0d] px-4 py-3 font-mono text-lg uppercase tracking-[0.16em] text-[#f6ead1] outline-none transition placeholder:text-[#877862] focus:border-[#e0b968] focus:ring-1 focus:ring-[#e0b968]" value={joinCode} maxLength={6} placeholder="ABC123" onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} onKeyDown={(event) => event.key === "Enter" && joinRoom()} />
              <button type="button" className="rounded-sm border border-[#b58a4d] px-4 font-bold text-[#e7c17d] transition hover:bg-[#49331f] disabled:cursor-not-allowed disabled:border-[#554633] disabled:text-[#786b58]" disabled={!validName || joinCode.length !== 6 || status !== "idle"} onClick={joinRoom}>{status === "joining" ? "…" : "Unirse"}</button>
            </div>
            {import.meta.env.DEV && (
              <div className="mt-6 border-t border-[#675641] pt-5">
                <h2 className="font-bold text-[#e7c17d]">Modo de pruebas</h2>
                <p className="mt-1 text-sm text-[#c9ba9e]">Entra directamente, sin sala ni segundo jugador.</p>
                <div className="mt-4 grid grid-cols-2 items-start gap-4">
                  <div>
                    <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#d8aa64]">Mundo A</h3>
                    <div className="grid gap-2">
                      {testAreas.map(([area, label]) => (
                        <a key={`past-${area}`} href={`?test=past&area=${area}`} className="rounded border border-[#806644] p-2 text-center text-sm hover:bg-[#49331f]">{label}</a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#8fb1b3]">Mundo B</h3>
                    <div className="grid gap-2">
                      {testAreas.map(([area, label]) => (
                        <a key={`present-${area}`} href={`?test=present&area=${area}`} className="rounded border border-[#806644] p-2 text-center text-sm hover:bg-[#49331f]">{label}</a>
                      ))}
                    </div>
                  </div>
                  <a href="?test=icons" className="col-span-2 justify-self-center rounded border border-[#b58a4d] bg-[#171210]/70 px-8 py-3 text-center text-sm font-semibold text-[#e7c17d] hover:bg-[#49331f]">Estudio de iconos</a>
                  <a href="?test=ending" className="col-span-2 justify-self-center rounded border border-[#b58a4d] bg-[#171210]/70 px-8 py-3 text-center text-sm font-semibold text-[#e7c17d] hover:bg-[#49331f]">Ver final</a>
                </div>
              </div>
            )}
            {error && <p className="mt-5 rounded-sm border border-red-400/35 bg-red-950/35 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}
            <p className="mt-6 text-center text-xs leading-relaxed text-[#958772]">Dentro de la sala elegiréis quién juega en el Mundo A y quién en el Mundo B.</p>
          </>
        )}

        {view === "settings" && (
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">Ajustes</p>
            <h1 className="mb-3 font-serif text-4xl text-[#f5e8ce]">Sonido</h1>
            <p className="mb-4 text-sm leading-relaxed text-[#c9ba9e]">Los cambios se aplican inmediatamente y se conservarán la próxima vez que abras el juego.</p>
            <AudioSettings idPrefix="menu" settings={audioSettings} onChange={onAudioSettingChange} />
            <MouseSettings idPrefix="menu" sensitivity={mouseSensitivity} onChange={onMouseSensitivityChange} />
          </>
        )}

        {view === "controls" && (
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#d8aa64]">Controles</p>
            <h1 className="mb-7 font-serif text-4xl text-[#f5e8ce]">Cómo jugar</h1>
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 text-sm">
              {controls.map(([key, description]) => (
                <div className="contents" key={key}>
                  <span className="font-semibold text-[#e7c17d]">{key}</span>
                  <span className="text-[#d5c6aa]">{description}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Lobby;
